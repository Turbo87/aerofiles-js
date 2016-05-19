const B_RECORD_RE = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;
const H_RECORD_RE = /^H([FO])([A-Z0-9]{3})(?:([^:]*):)?(.*)$/;
const NEWLINE_RE = /\r\n|\r|\n/;

export function parse(text) {
  let date, lastTime;
  let headers = [];
  let fixes = [];

  text.split(NEWLINE_RE).forEach(line => {
    const firstChar = line[0];
    let record;

    switch (firstChar) {
      case 'H': {
        record = parseHRecord(line);
        if (record) {
          if (record.subject === 'DTE') {
            date = record.date;
          }

          headers.push(record);
        }
        break;
      }

      case 'B': {
        record = parseBRecord(line);
        if (record) {
          fixes.push(record);
        }
        break;
      }
    }

    if (record && date && record.time) {
      record.timestamp = date.toTimestamp(record.time);

      // Handle UTC-midnight wrap-around
      // i.e. time jumps of 12 hours or more will increase/decrease the date

      if (lastTime) {
        if (lastTime - record.timestamp > 12 * 60 * 60 * 1000) {
          date = date.next();
          record.timestamp = date.toTimestamp(record.time);

        } else if (record.timestamp - lastTime > 12 * 60 * 60 * 1000) {
          date = date.previous();
          record.timestamp = date.toTimestamp(record.time);
        }
      }

      lastTime = record.timestamp;
    }
  });

  return {headers, fixes};
}

export function parseRecords(text) {
  return text.split(NEWLINE_RE).map(parseRecord);
}

export function parseRecord(line) {
  return parseBRecord(line) || parseHRecord(line) || {type: line[0]};
}

export class Record {
  constructor(values) {
    for (let key in values) {
      this[key] = values[key];
    }
  }
}

export class BRecord extends Record {
  static fromLine(line) {
    const match = B_RECORD_RE.exec(line);
    if (match) {
      let time = {
        hour: parseInt(match[1], 10),
        minute: parseInt(match[2], 10),
        second: parseInt(match[3], 10),
      };

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

export function parseBRecord(line) {
  return BRecord.fromLine(line);
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

        result.date = new LocalDate(year, month, day);
      }

      return new HRecord(result);
    }
  }
}

export function parseHRecord(line) {
  return HRecord.fromLine(line);
}

class LocalDate {
  constructor(year, month, day) {
    this.year = year;
    this.month = month;
    this.day = day;
  }

  next() {
    let timestamp = Date.UTC(this.year, this.month, this.day) + 24 * 60 * 60 * 1000;
    let nextDate = new Date(timestamp);
    return new LocalDate(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDay());
  }

  previous() {
    let timestamp = Date.UTC(this.year, this.month, this.day) - 24 * 60 * 60 * 1000;
    let nextDate = new Date(timestamp);
    return new LocalDate(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDay());
  }

  toTimestamp({hour, minute, second}) {
    return Date.UTC(this.year, this.month - 1, this.day, hour, minute, second);
  }
}
