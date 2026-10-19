import { describe, expect, it } from 'vitest';
import { cumleParcala } from './components/Cumle';
import { genelDestesi, lgsDestesi } from './content';
import { adimVarMi, sorulacakAdim } from './exercise';

describe('cumleParcala', () => {
  it('kelimeyi bosluga ayirir, buyuk harfle baslasa da', () => {
    expect(cumleParcala('Boil the eggs.', 'boil')).toEqual(['', 'Boil', ' the eggs.']);
  });

  it('kelimenin parcasi olan gecisi atlar', () => {
    expect(cumleParcala('It has many subscribers; I am a subscriber too.', 'subscriber')).toEqual([
      'It has many subscribers; I am a ',
      'subscriber',
      ' too.',
    ]);
  });

  it('kalip ifadeleri de bulur', () => {
    expect(cumleParcala('We hang out at the park.', 'hang out')?.[1]).toBe('hang out');
  });

  it('yoksa null', () => {
    expect(cumleParcala('The cat sleeps.', 'category')).toBeNull();
  });
});

describe('7. basamak verisi', () => {
  it('her LGS kartinda ve Genel kartlarinin cogunda bosluklu cumle kurulabiliyor', () => {
    const lgs = lgsDestesi();
    const lgsOrnekli = lgs.filter((c) => c.ornek && cumleParcala(c.ornek, c.en));
    // Uniteye bagli Genel kartlarindan cumlesi cekimli olanlar (Ice melts) haric hepsi
    expect(lgsOrnekli.length / lgs.length).toBeGreaterThan(0.99);
    const genel = genelDestesi();
    const genelOrnekli = genel.filter((c) => c.ornek && cumleParcala(c.ornek, c.en));
    expect(genelOrnekli.length / genel.length).toBeGreaterThan(0.85);
  });

  it('cumlesi olmayan kart 6. basamakta kalir', () => {
    const kart = { ornek: undefined };
    expect(adimVarMi(kart, 7)).toBe(false);
    expect(sorulacakAdim(kart, 7)).toBe(6);
    expect(sorulacakAdim({ ornek: 'x' }, 7)).toBe(7);
  });
});
