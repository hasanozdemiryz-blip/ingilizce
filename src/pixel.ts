/**
 * META PIKSELI (7 Kasim; Instagram reklamindan gelenin platformda ders yapip
 * yapmadigini olcmek ve reklami "derse baslayan" kisiye gore optimize etmek).
 *
 * Clarity ile ayni kural (7 Kasim, kullanici karari): cerez seridinde "Reddet"
 * denmemisse (`hafizada-cerez` != 'hayir') ve Ayarlar'daki olcum anahtari aciksa. Kisisel veri (ad, e-posta) GONDERILMEZ; yalniz olay adlari.
 * Kimlik `meta-pixel.config.json`'da; bossa hicbir sey yuklenmez.
 */
import ayar from '../meta-pixel.config.json';
import { CEREZ_ANAHTARI } from './clarity';

type Fbq = ((...a: unknown[]) => void) & { queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown; callMethod?: (...a: unknown[]) => void };

let yuklendi = false;

/** analitik.ts olay adlari -> Pixel ozel olaylari. Listede olmayan gonderilmez. */
const OLAYLAR: Record<string, string> = {
  ders_basladi: 'DersBasladi',
  ders_bitti: 'DersBitti',
  giris_yapildi: 'GirisYapildi',
};

export function pixelHazirla(olcumAcik: boolean): void {
  const id = (ayar as { id?: string }).id;
  if (!id || yuklendi || !olcumAcik || typeof window === 'undefined') return;
  if (/^(localhost|127.0.0.1)$/.test(location.hostname)) return;
  let onay: string | null = null;
  try {
    onay = localStorage.getItem(CEREZ_ANAHTARI);
  } catch {
    return;
  }
  // 7 Kasim (kullanici karari): secim yapmayanda da calisir; yalniz "Reddet" (hayir) durdurur.
  if (onay === 'hayir') return;
  yuklendi = true;
  const w = window as unknown as { fbq?: Fbq; _fbq?: Fbq };
  if (!w.fbq) {
    const f: Fbq = Object.assign(
      (...a: unknown[]) => {
        if (f.callMethod) f.callMethod(...a);
        else f.queue!.push(a);
      },
      { queue: [] as unknown[], loaded: true, version: '2.0' },
    );
    f.push = f;
    w.fbq = f;
    w._fbq = f;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
  }
  w.fbq!('init', id);
  w.fbq!('track', 'PageView');
}

/** Onay yoksa ya da Pixel yuklu degilse sessizce hicbir sey yapmaz. */
export function pixelOlay(ad: string): void {
  const ozel = OLAYLAR[ad];
  if (!ozel || !yuklendi) return;
  try {
    (window as unknown as { fbq?: Fbq }).fbq?.('trackCustom', ozel);
  } catch {
    /* yut */
  }
}
