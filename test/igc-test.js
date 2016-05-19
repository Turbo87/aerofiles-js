import { describe, it } from 'mocha';
import { expect } from 'chai';
import { parseBRecord } from '../src/igc';

describe('IGC module', function() {
  describe('parseBRecord()', function() {
    it('parses valid B record', function() {
      const input = 'B1056335049317N00610998EA001850019300611109104011';
      const result = parseBRecord(input);
      expect(result.latitude).to.be.closeTo(50 + 49.317 / 60, 0.00001);
      expect(result.longitude).to.be.closeTo(6 + 10.998 / 60, 0.00001);
    });
  });
});
