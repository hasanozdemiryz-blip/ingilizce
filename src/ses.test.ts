import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { genelDestesi, lgsDestesi } from './content';
import type { UniteIcerik } from './lgs';

const KOK = path.resolve(__dirname, '..');
const var_ = (yol: string) => fs.existsSync(path.join(KOK, 'public/ses', yol));

describe('ses dosyalari (KARARLAR 9)', () => {
  it('Genel ve LGS destesindeki her kelimenin sesi var', () => {
    const eksik = [...genelDestesi(), ...lgsDestesi()].filter((c) => !var_(`k/${c.id}.mp3`)).map((c) => c.id);
    expect(eksik).toEqual([]);
  });

  it('her diyalog satirinin sesi var', () => {
    const eksik: string[] = [];
    for (let u = 1; u <= 10; u++) {
      const d: UniteIcerik = JSON.parse(
        fs.readFileSync(path.join(KOK, `content/lgs-unite/u${String(u).padStart(2, '0')}.json`), 'utf8'),
      );
      d.diyaloglar.forEach((dy, i) =>
        dy.satirlar.forEach((_, j) => {
          if (!var_(`d/u${u}-${i + 1}-${j + 1}.mp3`)) eksik.push(`u${u}-${i + 1}-${j + 1}`);
        }),
      );
    }
    expect(eksik).toEqual([]);
  });
});
