import { describe, it } from 'mocha';
import { expect } from 'chai';
import glob from 'glob';
import fs from 'fs';
import { parseBRecord } from '../src/igc';

const IGC_FILES = glob.sync('test/fixtures/*.igc', { nocase: true });
const NEWLINE_RE = /\r\n|\r|\n/;

describe('IGC module', function() {
  describe('parseBRecord()', function() {
    it('parses valid B record', function() {
      const input = 'B1056335049317N00610998EA001850019300611109104011';
      const result = parseBRecord(input);
      expect(result.hour).to.equal(10);
      expect(result.minute).to.equal(56);
      expect(result.second).to.equal(33);
      expect(result.latitude).to.be.closeTo(50 + 49.317 / 60, 0.00001);
      expect(result.longitude).to.be.closeTo(6 + 10.998 / 60, 0.00001);
      expect(result.altitudeGPS).to.equal(185);
      expect(result.altitudeBaro).to.equal(193);
    });

    IGC_FILES.forEach(file => {
      it(`parses ${file} without throwing exceptions`, function() {
        fs.readFileSync(file, { encoding: 'utf8' }).split(NEWLINE_RE).forEach(line => {
          if (line[0] === 'B') {
            expect(parseBRecord(line), `parseBRecord('${line}')`).to.be.ok;
          }
        });
      });
    })
  });
});
