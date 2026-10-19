import { describe, expect, it } from 'vitest';
import { yazilisParca } from './yazilis';

describe('yazilisParca', () => {
  it('kelimenin icindeki Turkce kelimeyi bulur', () => {
    expect(yazilisParca({ en: 'delicious', hook: 'deli', yol: 'yazılış' })).toEqual([0, 4]);
    expect(yazilisParca({ en: 'attend', hook: 'at', yol: 'yazılış' })).toEqual([0, 2]);
  });

  it('Turkce harfleri ASCII ile eslestirir, tutmayani elle bilir', () => {
    expect(yazilisParca({ en: 'refuse', hook: 'füze', yol: 'yazılış' })).toEqual([2, 6]);
  });

  it('ses cagrisiminda vurgu yok', () => {
    expect(yazilisParca({ en: 'far', hook: 'far', yol: 'ses' })).toBeNull();
    expect(yazilisParca({ en: 'far', hook: 'far' })).toBeNull();
  });

  it('bulunamazsa null', () => {
    expect(yazilisParca({ en: 'device', hook: 'kalem', yol: 'yazılış' })).toBeNull();
  });
});
