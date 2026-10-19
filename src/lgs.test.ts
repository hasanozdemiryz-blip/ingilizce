import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { karistir, type UniteIcerik } from './lgs';

const KLASOR = path.resolve(__dirname, '../content/lgs-unite');
const uniteler: UniteIcerik[] = fs
  .readdirSync(KLASOR)
  .filter((f) => /^u\d\d\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(fs.readFileSync(path.join(KLASOR, f), 'utf8')));

describe('LGS unite icerigi', () => {
  it('10 unite, her birinde 8–12 kalip, 3–4 diyalog, 10 soru', () => {
    expect(uniteler.map((u) => u.unite)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const u of uniteler) {
      expect(u.kaliplar.length).toBeGreaterThanOrEqual(8);
      expect(u.kaliplar.length).toBeLessThanOrEqual(12);
      expect(u.diyaloglar.length).toBeGreaterThanOrEqual(3);
      expect(u.diyaloglar.length).toBeLessThanOrEqual(4);
      expect(u.test).toHaveLength(10);
    }
  });

  it('her diyalogda kadin ve erkek ses var (KARARLAR 9)', () => {
    for (const u of uniteler)
      for (const d of u.diyaloglar) expect(new Set(d.satirlar.map((s) => s.cinsiyet))).toEqual(new Set(['k', 'e']));
  });

  it('her sorunun dort sikki ve gecerli bir dogrusu var', () => {
    for (const u of uniteler)
      for (const s of u.test) {
        expect(s.secenekler).toHaveLength(4);
        expect(new Set(s.secenekler).size).toBe(4);
        expect(s.dogru).toBeGreaterThanOrEqual(0);
        expect(s.dogru).toBeLessThan(4);
      }
  });
});

describe('karistir', () => {
  const soru = { soru: 'X?', secenekler: ['a', 'b', 'c', 'd'], dogru: 1, aciklama: '' };

  it('dogru cevap yine dogru siklarda', () => {
    const k = karistir(soru);
    expect(k.secenekler[k.dogru]).toBe('b');
    expect([...k.secenekler].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('ayni soru her seferinde ayni sirada', () => {
    expect(karistir(soru)).toEqual(karistir(soru));
  });

  it('dogru siklar unitelerde tek harfe yigilmiyor', () => {
    const say = [0, 0, 0, 0];
    for (const u of uniteler) for (const s of u.test) say[karistir(s).dogru]++;
    for (const n of say) expect(n).toBeGreaterThan(12);
  });
});
