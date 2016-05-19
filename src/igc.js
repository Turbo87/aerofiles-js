import { LocalDate, LocalTime, ZoneOffset } from 'js-joda';

const A_RECORD_RE = /^A(\w{3})(\w+)(?::(.*))?$/;
const B_RECORD_RE = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;
const H_RECORD_RE = /^H([FO])([A-Z0-9]{3})(?:([^:]*):)?(.*)$/;
const NEWLINE_RE = /\r\n|\r|\n/;

export function parse(text) {
  let date, lastTime;
  let headers = [];
  let fixes = [];

  parseRecords(text).forEach(record => {
    if (record instanceof BRecord) {
      fixes.push(record);

    } else if (record instanceof HRecord) {
      if (record.subject == 'DTE') {
        date = record.date;
      }

      headers.push(record);
    }

    if (record.time) {
      if (date) {
        // Handle UTC-midnight wrap-around
        // i.e. time jumps of 12 hours or more will increase/decrease the date

        if (lastTime) {
          if (lastTime.hour() == 23 && record.time.hour() == 0) {
            date = date.plusDays(1);
          } else if (lastTime.hour() == 0 && record.time.hour() == 23) {
            date = date.minusDays(1);
          }
        }

        record.datetime = record.time.atDate(date).atZone(ZoneOffset.UTC);
      }

      lastTime = record.time;
    }
  });

  return {headers, fixes};
}

export function parseRecords(text) {
  return text.split(NEWLINE_RE).map(parseRecord);
}

export function parseRecord(line) {
  return BRecord.fromLine(line) ||
    HRecord.fromLine(line) ||
    IRecord.fromLine(line) ||
    {type: line[0]};
}

export class Record {
  constructor(values) {
    for (let key in values) {
      this[key] = values[key];
    }
  }
}

export class ARecord extends Record {
  static fromLine(line) {
    const match = A_RECORD_RE.exec(line);
    if (match) {
      let manufacturer = match[1];
      let id = match[2];
      let data = match[3];
      let flightNumber;

      // Special handling for LX devices
      if (endsWith(id, 'FLIGHT')) {
        id = id.slice(0, 3);
        flightNumber = parseInt(data, 10);
        data = undefined;
      }

      return new ARecord({manufacturer, id, flightNumber, data});
    }
  }
}

export class BRecord extends Record {
  static fromLine(line) {
    const match = B_RECORD_RE.exec(line);
    if (match) {
      let time = LocalTime.of(parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10));

      let latitude = parseInt(match[4], 10) + parseInt(match[5], 10) / 60000;
      if (match[6] == 'S') {
        latitude = -latitude;
      }

      let longitude = parseInt(match[7], 10) + parseInt(match[8], 10) / 60000;
      if (match[9] == 'W') {
        longitude = -longitude;
      }

      let altitudeGPS = parseInt(match[11], 10);
      let altitudeBaro = parseInt(match[12], 10);

      return new BRecord({time, longitude, latitude, altitudeGPS, altitudeBaro});
    }
  }
}

export class HRecord extends Record {
  static fromLine(line) {
    const match = H_RECORD_RE.exec(line);
    if (match) {
      var source = match[1];
      var subject = match[2];
      var description = match[3];
      var value = match[4];

      var result = {source, subject, description, value};

      if (subject === 'DTE') {
        var day = parseInt(value.slice(0, 2), 10);
        var month = parseInt(value.slice(2, 4), 10);
        var year = 2000 + parseInt(value.slice(4, 6), 10);
        if (year > 2090) {
          year -= 100;
        }

        result.date = LocalDate.of(year, month, day);
      }

      return new HRecord(result);
    }
  }
}

export class ExtensionsRecord extends Record {
  static readExtensions(line) {
    let extensions = [];

    let n = parseInt(line.slice(1, 3), 10);
    for (let i = 0; i < n; i++) {
      extensions.push(RecordExtension.fromSlice(line, 3 + i * 7));
    }

    return extensions;
  }
}

export class IRecord extends ExtensionsRecord {
  static fromLine(line) {
    if (line[0] === 'I') {
      let extensions = this.readExtensions(line);
      return new IRecord({extensions});
    }
  }
}

export class RecordExtension {
  static fromSlice(line, offset) {
    let start = parseInt(line.slice(offset, offset + 2), 10);
    let end = parseInt(line.slice(offset + 2, offset + 4), 10);
    let code = line.slice(offset + 4, offset + 7);

    return new RecordExtension(start, end, code);
  }

  constructor(start, end, code) {
    this.start = start;
    this.end = end;
    this.code = code;
  }
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}
