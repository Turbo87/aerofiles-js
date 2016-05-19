const B_RECORD_RE = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;

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
