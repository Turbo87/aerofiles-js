import { describe, it } from 'mocha';
import { expect } from 'chai';
import glob from 'glob';
import fs from 'fs';
import * as IGC from '../src/igc';
import { LocalDate, LocalTime, ZonedDateTime } from 'js-joda';

const IGC_FILES = glob.sync('test/fixtures/*.igc', { nocase: true });

describe('IGC module', function() {
  describe('parse()', function() {
    it('handles UTC-midnight crossing', function() {
      const content = fs.readFileSync('test/fixtures/2016-05-13-xcs-aaa-01_2.igc', { encoding: 'utf8' });
      const result = IGC.parse(content);

      let lastFix;
      result.fixes.forEach(fix => {
        expect(fix.datetime, 'fix.datetime').to.be.an.instanceof(ZonedDateTime);

        if (lastFix) {
          expect(fix.datetime.isAfter(lastFix.datetime), 'fix.datetime.isAfter(lastFix.datetime)').to.be.ok;
        }

        lastFix = fix;
      })
    });

    IGC_FILES.forEach(file => {
      it(`parses ${file} without throwing exceptions`, function() {
        const content = fs.readFileSync(file, { encoding: 'utf8' });
        const result = IGC.parse(content);
        expect(result.headers.length).to.be.above(1);
        expect(result.fixes.length).to.be.above(5);
      });
    })
  });

  describe('parseRecords()', function() {
    IGC_FILES.forEach(file => {
      it(`parses ${file} without throwing exceptions`, function() {
        const content = fs.readFileSync(file, { encoding: 'utf8' });
        const result = IGC.parseRecords(content);
        expect(result.length).to.be.above(25);
        expect(result.filter(it => it instanceof IGC.HRecord).length).to.be.above(5);
        expect(result.filter(it => it instanceof IGC.BRecord).length).to.be.above(5);
      });
    })
  });

  describe('ARecord.fromLine()', function() {
    it('correctly parses AFLA9KJ', function() {
      let result = IGC.ARecord.fromLine('AFLA9KJ');
      expect(result.manufacturer).to.equal('FLA');
      expect(result.id).to.equal('9KJ');
      expect(result.data).to.not.be.ok;
      expect(result.flightNumber).to.not.be.ok;
    });

    it('correctly parses ALXV2OWFLIGHT:1', function() {
      let result = IGC.ARecord.fromLine('ALXV2OWFLIGHT:1');
      expect(result.manufacturer).to.equal('LXV');
      expect(result.id).to.equal('2OW');
      expect(result.data).to.not.be.ok;
      expect(result.flightNumber).to.equal(1);
    });
  });

  describe('BRecord.fromLine()', function() {
    it('parses valid B record', function() {
      const input = 'B1056335049317N00610998EA001850019300611109104011';
      const result = IGC.BRecord.fromLine(input);
      expect(result.time).to.deep.equal(LocalTime.parse('10:56:33'));
      expect(result.latitude).to.be.closeTo(50 + 49.317 / 60, 0.00001);
      expect(result.longitude).to.be.closeTo(6 + 10.998 / 60, 0.00001);
      expect(result.altitudeGPS).to.equal(185);
      expect(result.altitudeBaro).to.equal(193);
    });
  });

  describe('HRecord.fromLine()', function() {
    it('parses HFDTE record', function() {
      const input = 'HFDTE140516';
      const result = IGC.HRecord.fromLine(input);
      expect(result.source).to.equal('F');
      expect(result.subject).to.equal('DTE');
      expect(result.description).to.not.be.ok;
      expect(result.value).to.equal('140516');
      expect(result.date).to.deep.equal(LocalDate.parse('2016-05-14'));
    });

    it('parses HFGTY record', function() {
      const input = 'HFGTYGLIDERTYPE:ASG32 MI';
      const result = IGC.HRecord.fromLine(input);
      expect(result.source).to.equal('F');
      expect(result.subject).to.equal('GTY');
      expect(result.description).to.equal('GLIDERTYPE');
      expect(result.value).to.equal('ASG32 MI');
    });

    it('parses HFGPS record', function() {
      const input = 'HFGPS:uBLOX LEA-6DUAL,50,max50000m';
      const result = IGC.HRecord.fromLine(input);
      expect(result.source).to.equal('F');
      expect(result.subject).to.equal('GPS');
      expect(result.description).to.not.be.ok;
      expect(result.value).to.equal('uBLOX LEA-6DUAL,50,max50000m');
    });
  });

  describe('IRecord.fromLine()', function() {
    it('correctly parses I023638FXA3940SIU', function() {
      let result = IGC.IRecord.fromLine('I023638FXA3940SIU');
      expect(result.extensions).to.deep.equal([{
        start: 36,
        end: 38,
        code: 'FXA',
      }, {
        start: 39,
        end: 40,
        code: 'SIU',
      }]);
    });

    it('correctly parses I043638FXA3941ENL4246GSP4749TRT', function() {
      let result = IGC.IRecord.fromLine('I043638FXA3941ENL4246GSP4749TRT');
      expect(result.extensions).to.deep.equal([{
        start: 36,
        end: 38,
        code: 'FXA',
      }, {
        start: 39,
        end: 41,
        code: 'ENL',
      }, {
        start: 42,
        end: 46,
        code: 'GSP',
      }, {
        start: 47,
        end: 49,
        code: 'TRT',
      }]);
    });
  });

  describe('JRecord.fromLine()', function() {
    it('correctly parses J010812HDT', function() {
      let result = IGC.JRecord.fromLine('J010812HDT');
      expect(result.extensions).to.deep.equal([{
        start: 8,
        end: 12,
        code: 'HDT',
      }]);
    });
  });
});
