const B_RECORD_RE = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;
const H_RECORD_RE = /^H([FO])([A-Z0-9]{3})(?:([^:]*):)?(.*)$/;
const NEWLINE_RE = /\r\n|\r|\n/;

export function parse(text) {
  let headers = [];
  let fixes = [];

  text.split(NEWLINE_RE).forEach(line => {
    const firstChar = line[0];
    switch (firstChar) {
      case 'H': {
        const record = parseHRecord(line);
        if (record) {
          headers.push(record);
        }
        break;
      }
      case 'B': {
        const record = parseBRecord(line);
        if (record) {
          fixes.push(record);
        }
        break;
      }
    }
  });

  return {headers, fixes};
}

export function parseBRecord(line) {
  const match = B_RECORD_RE.exec(line);
  if (match) {
    var hour = parseInt(match[1], 10);
    var minute = parseInt(match[2], 10);
    var second = parseInt(match[3], 10);

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

    return {hour, minute, second, longitude, latitude, altitudeGPS, altitudeBaro};
  }
}

export function parseHRecord(line) {
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

      result.date = {day, month, year};
    }

    return result;
  }
}
