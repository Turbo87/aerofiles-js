const B_RECORD_RE = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;
const H_RECORD_RE = /^H([FO])([A-Z0-9]{3})(?:([^:]*):)?(.*)$/;

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

    return {source, subject, description, value};
  }
}
