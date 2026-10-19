import { describe, expect, it } from 'vitest';
import { kaynakSinifi } from './kaynak';

describe('kaynakSinifi', () => {
  it('utm etiketi her şeyden önce gelir', () => {
    expect(kaynakSinifi('www.google.com', 'Instagram_Reklam')).toBe('instagram_reklam');
  });
  it('bilinen siteler', () => {
    expect(kaynakSinifi('www.google.com.tr')).toBe('google');
    expect(kaynakSinifi('l.instagram.com')).toBe('instagram');
    expect(kaynakSinifi('m.facebook.com')).toBe('facebook');
    expect(kaynakSinifi('t.co')).toBe('x');
    expect(kaynakSinifi('yandex.com.tr')).toBe('arama');
  });
  it('kendi sitemiz ve referrer yok', () => {
    expect(kaynakSinifi('hafizada.com')).toBe('site');
    expect(kaynakSinifi('')).toBe('dogrudan');
  });
  it('bilinmeyen site adıyla kalır', () => {
    expect(kaynakSinifi('www.ingilizceciyiz.com')).toBe('ingilizceciyiz.com');
  });
});
