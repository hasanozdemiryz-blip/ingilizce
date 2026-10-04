import { describe, expect, it } from 'vitest';
import { siradakiDavet } from './davet';
import type { Kazanim } from './cerceveler';

const k = (p: Partial<Kazanim> = {}): Kazanim => ({
  ogrenilen: 0,
  seri: 0,
  setBitti: false,
  ...p,
});

describe('siradakiDavet', () => {
  it('hicbir sey ogrenmemis kisiye davet cikarmaz', () => {
    expect(siradakiDavet(k(), [])).toBeNull();
  });

  it('ilk kelimeden sonra cikar', () => {
    expect(siradakiDavet(k({ ogrenilen: 1 }), [])?.id).toBe('ilk');
  });

  it('gorulen esik bir daha cikmaz', () => {
    expect(siradakiDavet(k({ ogrenilen: 1 }), ['ilk'])).toBeNull();
  });

  it('en taze kilometre tasi kazanir', () => {
    // Ayni anda uc esik de dolu; kullanici tek davet gormeli.
    const d = siradakiDavet(k({ ogrenilen: 12, seri: 4, setBitti: true }), []);
    expect(d?.id).toBe('set');
  });

  it('ustteki esik gorulduyse bir alttakine duser', () => {
    const d = siradakiDavet(k({ ogrenilen: 12, seri: 4 }), ['seri3']);
    expect(d?.id).toBe('kelime10');
  });

  it('hepsi gorulduyse susar', () => {
    const hepsi = ['set', 'seri3', 'kelime10', 'ilk'];
    expect(siradakiDavet(k({ ogrenilen: 99, seri: 9, setBitti: true }), hepsi)).toBeNull();
  });
});
