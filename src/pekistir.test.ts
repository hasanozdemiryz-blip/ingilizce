import { describe, expect, it } from 'vitest';
import { bosSatir, kelimeGeciyor, pekistirSec } from './pekistir';

const icerik = {
  unite: 1,
  kaliplar: [
    { en: 'Would you like to come to my party?', tr: '', not: 'Davet etmek' },
    { en: 'Sure, I would love to!', tr: '', not: 'Kabul etmek' },
    { en: 'Sorry, I can not. I have to study.', tr: '', not: 'Reddetmek' },
  ],
  diyaloglar: [
    { baslik: 'a', satirlar: [{ kim: 'A', cinsiyet: 'k' as const, en: 'Hi!', tr: '' }, { kim: 'B', cinsiyet: 'e' as const, en: 'Do you want to come?', tr: '' }] },
    { baslik: 'b', satirlar: [] },
    { baslik: 'c', satirlar: [] },
  ],
};

describe('kelimeGeciyor', () => {
  it('cekimleri ve kaliplari tanir', () => {
    expect(kelimeGeciyor('She invited me.', 'invite')).toBe(true);
    expect(kelimeGeciyor('Two parties tonight', 'party')).toBe(true);
    expect(kelimeGeciyor('I have to study.', 'have to')).toBe(true);
    expect(kelimeGeciyor('I like art.', 'party')).toBe(false);
  });
});

describe('pekistirSec', () => {
  const temel = { bugunKelimeler: [] as string[], kalip: undefined, diyalog: undefined, oran: 0, simdi: 1_000_000_000_000 };

  it('bugunun kelimesinin gectigi cozulmemis kalip once gelir, en fazla 2', () => {
    const s = pekistirSec(icerik, { ...temel, bugunKelimeler: ['study'] });
    expect(s.kaliplar).toEqual([2, 0]);
    expect(s.diyalog).toBeNull();
  });

  it('cozulmus kalip vadesi gelince geri gelir, gelmeden gelmez', () => {
    const t = temel.simdi;
    const kalip = { '1-1': { d: 1, t }, '1-2': { d: 1, t: t - 2 * 864e5 }, '1-3': { d: 3, t } };
    expect(pekistirSec(icerik, { ...temel, kalip }).kaliplar).toEqual([1]);
  });

  it('diyalog esigi gecilince bir diyalog, kalip bire iner', () => {
    const s = pekistirSec(icerik, { ...temel, oran: 0.25 });
    expect(s.diyalog).toBe(0);
    expect(s.kaliplar).toHaveLength(1);
    expect(pekistirSec(icerik, { ...temel, oran: 0.25, diyalog: { '1-1': 1 } }).diyalog).toBeNull();
  });

  it('bos satir ilk satir degil, en uzun satir', () => {
    expect(bosSatir(icerik.diyaloglar[0].satirlar)).toBe(1);
  });
});

describe('durumEtiketi ve ilkBicim', () => {
  it('cevabi ele veren etiket kirpilir ya da gizlenir', async () => {
    const { durumEtiketi, ilkBicim } = await import('./pekistir');
    expect(durumEtiketi('Davet etmek', 'Would you like to come?')).toBe('Davet etmek');
    expect(durumEtiketi('Sıralama: First', 'First, chop the onions.')).toBe('Sıralama');
    expect(durumEtiketi('How about + fiil-ing', 'How about going to the fair?')).toBeNull();
    expect(ilkBicim('It tastes salty. / It smells delicious.')).toBe('It tastes salty.');
  });
});
