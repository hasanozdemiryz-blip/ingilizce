/**
 * LGS uniteleri (20 Ekim, KARARLAR 7).
 *
 * 2027 = 8. sinif eski program, 10 unite. Unite = kelimeler → kaliplar →
 * sesli diyaloglar → unite testi; hepsi ozgun (kitaptan kopya yok).
 * Icerik `content/lgs-unite/uNN.json`; unite acilinca ayri parca olarak
 * iniyor (her unite ~10 KB) — Genel calisan kimse bunlari indirmiyor.
 */
import { t } from './dil';
import { sesDosyalariKaydet } from './speech';

export const UNITELER: { no: number; ad: string; tr: string; ikon: string }[] = [
  { no: 1, ad: 'Friendship', tr: t('Arkadaşlık'), ikon: '🤝' },
  { no: 2, ad: 'Teen Life', tr: t('Gençlik hayatı'), ikon: '🎧' },
  { no: 3, ad: 'In the Kitchen', tr: t('Mutfakta'), ikon: '🍳' },
  { no: 4, ad: 'On the Phone', tr: t('Telefonda'), ikon: '📞' },
  { no: 5, ad: 'The Internet', tr: t('İnternet'), ikon: '💻' },
  { no: 6, ad: 'Adventures', tr: t('Maceralar'), ikon: '🧗' },
  { no: 7, ad: 'Tourism', tr: t('Turizm'), ikon: '🗺️' },
  { no: 8, ad: 'Chores', tr: t('Ev işleri'), ikon: '🧹' },
  { no: 9, ad: 'Science', tr: t('Bilim'), ikon: '🔬' },
  { no: 10, ad: 'Natural Forces', tr: t('Doğa olayları'), ikon: '🌋' },
];

export type Kalip = { en: string; tr: string; not?: string };
export type DiyalogSatiri = { kim: string; cinsiyet: 'k' | 'e'; en: string; tr: string };
export type Diyalog = { baslik: string; satirlar: DiyalogSatiri[] };
export type TestSorusu = { soru: string; secenekler: string[]; dogru: number; aciklama: string };
export type UniteIcerik = {
  unite: number;
  ad: string;
  /** Unitenin iletisim amaci, Turkce tek cumle */
  konu: string;
  kaliplar: Kalip[];
  diyaloglar: Diyalog[];
  test: TestSorusu[];
};

const YUKLEYICILER = import.meta.glob<UniteIcerik>('../content/lgs-unite/u*.json', { import: 'default' });

/** Unite icerigini indirir. Bulunamazsa hata — ekran bunu gosteriyor. */
export async function uniteYukle(no: number): Promise<UniteIcerik> {
  const yol = `../content/lgs-unite/u${String(no).padStart(2, '0')}.json`;
  const yukle = YUKLEYICILER[yol];
  if (!yukle) throw new Error(`unite yok: ${no}`);
  const icerik = await yukle();
  // Diyalog satirlarinin sesleri: public/ses/d/u<unite>-<diyalog>-<satir>.mp3
  // (kadin satirlari Lexi Parker, erkekler Matthew Wilson; tools/ses/diyalog-plan.mjs)
  sesDosyalariKaydet(
    icerik.diyaloglar.flatMap((d, i) =>
      d.satirlar.map((s, j): [string, string] => [s.en, `${import.meta.env.BASE_URL}ses/d/u${no}-${i + 1}-${j + 1}.mp3`]),
    ),
  );
  return icerik;
}

/**
 * Test sorusunun siklari KARISTIRILIYOR. Verideki dogru sik cogunlukla
 * A ya da B'de (yazarken oyle dustu); karistirilmasa ogrenci soruyu
 * okumadan "B" diyerek puan toplardi. Her acilista ayni sira olsun diye
 * sabit tohum: soru metninden.
 */
export function karistir(soru: TestSorusu): { secenekler: string[]; dogru: number } {
  let h = 0;
  for (const ch of soru.soru) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  const sira = soru.secenekler.map((_, i) => i);
  for (let i = sira.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    // LCG'nin alt bitleri zayif (donemli); ust bitler kullaniliyor.
    const j = (h >>> 16) % (i + 1);
    [sira[i], sira[j]] = [sira[j], sira[i]];
  }
  return { secenekler: sira.map((i) => soru.secenekler[i]), dogru: sira.indexOf(soru.dogru) };
}

/**
 * LGS 2027 tarihi — RESMI DEGIL, onceki yillarin takvimine gore tahmin
 * (Haziranin ikinci cumartesisi). Sitede de ayni: tools/site-bolumler.mjs
 * `LGS_TARIH`. MEB kilavuzu cikinca ikisi birlikte guncellenir.
 */
export const LGS_TARIH = '2027-06-12';

/** LGS'ye kalan gun (sinav sabahi 09:30). Gecmisse 0. */
export function lgsyeKalanGun(simdi = new Date()): number {
  const fark = new Date(`${LGS_TARIH}T09:30:00+03:00`).getTime() - simdi.getTime();
  return Math.max(0, Math.ceil(fark / 864e5));
}

/**
 * Unite basina kalip ve diyalog SAYISI. Icerik uniteler acilinca iniyor
 * (yukarida); ana ekran ve Ilerleme yalniz sayiyi istiyor, bunun icin on
 * unitenin hepsini indirmek gereksiz. `lgs.test.ts` icerikle esitligini denetliyor.
 */
export const UNITE_SAYILARI: Record<number, { kalip: number; diyalog: number }> = {
  1: { kalip: 12, diyalog: 3 },
  2: { kalip: 10, diyalog: 3 },
  3: { kalip: 10, diyalog: 3 },
  4: { kalip: 12, diyalog: 3 },
  5: { kalip: 10, diyalog: 3 },
  6: { kalip: 10, diyalog: 3 },
  7: { kalip: 10, diyalog: 3 },
  8: { kalip: 10, diyalog: 3 },
  9: { kalip: 10, diyalog: 3 },
  10: { kalip: 10, diyalog: 3 },
};

/** Kalip ve diyalog kimlikleri: "3-5" = 3. unitenin 5. kalibi (1'den). */
export const kalipId = (unite: number, i: number): string => `${unite}-${i + 1}`;
export const diyalogId = (unite: number, i: number): string => `${unite}-${i + 1}`;

/** Bir unitede dogru cozulmus kalip / diyalog sayisi. */
export function uniteKalipDurumu(
  unite: number,
  kalip: Record<string, { d: number; t: number }> | undefined,
  diyalog: Record<string, number> | undefined,
): { kalip: number; diyalog: number } {
  const on = `${unite}-`;
  return {
    kalip: Object.entries(kalip ?? {}).filter(([k, v]) => k.startsWith(on) && v.d > 0).length,
    diyalog: Object.keys(diyalog ?? {}).filter((k) => k.startsWith(on)).length,
  };
}
