const B_RECORD_RE = /^B(\d{2})(\d{2})(\d{2})(\d{2})(\d{5})([NS])(\d{3})(\d{5})([EW])([AV])(\d{5})(\d{5})/;

export function parseBRecord(line) {
  const match = B_RECORD_RE.exec(line);
  if (match) {
    let latitude = parseInt(match[4], 10) + parseInt(match[5], 10) / 60000;
    if (match[6] == 'S') {
      latitude = -latitude;
    }

    let longitude = parseInt(match[7], 10) + parseInt(match[8], 10) / 60000;
    if (match[9] == 'W') {
      longitude = -longitude;
    }

    return {longitude, latitude};
  }
}
