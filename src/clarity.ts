/**
 * MICROSOFT CLARITY — sayfa hareket kaydi (31 Ekim; kullanici: "her seyi takip
 * edip UX'i ona gore guncelleyecegiz").
 *
 * Isi haritasi, tiklamalar, nerede cikildigi. Ucuncu taraf ve yurt disina
 * aktarim (KVKK m.9) oldugu icin YALNIZ ACIK RIZAYLA: sitedeki cerez seridinde
 * "Kabul et" denmisse (`hafizada-cerez` = 'evet'; site ve platform ayni
 * adreste, ayni depoyu goruyor) ve Ayarlar'daki olcum anahtari aciksa.
 * Kimlik `clarity.config.json`'da; bossa hicbir sey yuklenmez.
 *
 * Kendi olcumumuz (analitik.ts) bundan bagimsiz: o kisisel veri gondermiyor
 * ve kendi sunucumuzda.
 */
import ayar from '../clarity.config.json';

export const CEREZ_ANAHTARI = 'hafizada-cerez';

let yuklendi = false;

export function clarityHazirla(olcumAcik: boolean): void {
  const id = (ayar as { id?: string }).id;
  if (!id || yuklendi || !olcumAcik || typeof window === 'undefined') return;
  // Yerel onizleme kayda girmesin (bkz. analitik.ts YEREL).
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
  const w = window as unknown as { clarity?: ((...a: unknown[]) => void) & { q?: unknown[] } };
  w.clarity =
    w.clarity ||
    Object.assign((...a: unknown[]) => {
      (w.clarity!.q = w.clarity!.q || []).push(a);
    });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${id}`;
  document.head.appendChild(s);
  // Platform oturumlarini siteden ayirmak icin; kisisel veri degil.
  w.clarity?.('set', 'alan', 'platform');
}
