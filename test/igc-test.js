import { describe, it } from 'mocha';
import { expect } from 'chai';
import glob from 'glob';
import fs from 'fs';
import * as IGC from '../src/igc';

const IGC_FILES = glob.sync('test/fixtures/*.igc', { nocase: true });
const NEWLINE_RE = /\r\n|\r|\n/;

describe('IGC module', function() {
  describe('parse()', function() {
    it('handles UTC-midnight crossing', function() {
      const content = fs.readFileSync('test/fixtures/2016-05-13-xcs-aaa-01_2.igc', { encoding: 'utf8' });
      const result = IGC.parse(content);

      let lastFix;
      result.fixes.forEach(fix => {
        expect(fix.time, 'fix.time').to.be.a('number');

        if (lastFix) {
          expect(fix.time, 'fix.time').to.not.be.below(lastFix.time, new Date(fix.time) + ' => ' + new Date(lastFix.time));
        }

        lastFix = fix;
      })
    });

    IGC_FILES.forEach(file => {
      it(`parses ${file} without throwing exceptions`, function() {
        const content = fs.readFileSync(file, { encoding: 'utf8' });
        const result = IGC.parse(content);
        expect(result.headers.length).to.be.above(1);
        expect(result.fixes.length).to.be.above(100);
      });
    })
  });

  describe('parseRecords()', function() {
    IGC_FILES.forEach(file => {
      it(`parses ${file} without throwing exceptions`, function() {
        const content = fs.readFileSync(file, { encoding: 'utf8' });
        const result = IGC.parseRecords(content);
        expect(result.length).to.be.above(100);
        expect(result.filter(it => it.type === 'H').length).to.be.above(5);
        expect(result.filter(it => it.type === 'B').length).to.be.above(100);
      });
    })
  });

  describe('parseBRecord()', function() {
    it('parses valid B record', function() {
      const input = 'B1056335049317N00610998EA001850019300611109104011';
      const result = IGC.parseBRecord(input);
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
            expect(IGC.parseBRecord(line), `parseBRecord('${line}')`).to.be.ok;
          }
        });
      });
    })
  });

  describe('parseHRecord()', function() {
    it('parses HFDTE record', function() {
      const input = 'HFDTE140516';
      const result = IGC.parseHRecord(input);
      expect(result.source).to.equal('F');
      expect(result.subject).to.equal('DTE');
      expect(result.description).to.not.be.ok;
      expect(result.value).to.equal('140516');
      expect(result.date).to.deep.equal({ day: 14, month: 5, year: 2016 });
    });

    it('parses HFGTY record', function() {
      const input = 'HFGTYGLIDERTYPE:ASG32 MI';
      const result = IGC.parseHRecord(input);
      expect(result.source).to.equal('F');
      expect(result.subject).to.equal('GTY');
      expect(result.description).to.equal('GLIDERTYPE');
      expect(result.value).to.equal('ASG32 MI');
    });

    it('parses HFGPS record', function() {
      const input = 'HFGPS:uBLOX LEA-6DUAL,50,max50000m';
      const result = IGC.parseHRecord(input);
      expect(result.source).to.equal('F');
      expect(result.subject).to.equal('GPS');
      expect(result.description).to.not.be.ok;
      expect(result.value).to.equal('uBLOX LEA-6DUAL,50,max50000m');
    });

    IGC_FILES.forEach(file => {
      it(`parses ${file} without throwing exceptions`, function() {
        fs.readFileSync(file, { encoding: 'utf8' }).split(NEWLINE_RE).forEach(line => {
          if (line[0] === 'H') {
            var result = IGC.parseHRecord(line);
            expect(result, `parseHRecord('${line}')`).to.be.ok;
            expect(result.source).to.be.ok;
            expect(result.subject).to.be.ok;
            expect(result.value).to.not.be.undefined;
          }
        });
      });
    })
  });
});
