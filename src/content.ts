import raw from '../content/cards.json';
import lgsHam from '../content/lgs.json';
import { normalize } from './answer';
import { AKTIF_BOLUM } from './bolum';
import { kancaliMi, type Card } from './types';

/**
 * Bir seferde tanisilan kelime sayisi.
 *
 * Gunluk TAVAN degil: paket bitince "5 kelime daha" ile devam edilebilir.
 * Birim 5 cunku bes kelime bir oturumda kodlanabilecek makul yuk;
 * fazlasi kancalari birbirine karistiriyor.
 */
export const BATCH = 5;

/**
 * Gunluk yeni kelime hedefi. Ayarlardan secilir, TAVAN asilamaz.
 *
 * Once tavan yoktu ve isteyen istedigi kadar ilerliyordu; sonucu tekrar
 * borcunun sessizce sismesiydi. Gunde 15'in ustu, ertesi gun kaldirilamayan
 * bir tekrar yigini demek — sinir pedagojik, keyfi degil.
 */
export const LIMIT_CHOICES = [5, 10, 15] as const;
export const LIMIT_DEFAULT = 10;
export const LIMIT_MAX = 15;

/** "Eski kelimeler" kapsami: bu kadar gun once tanisilmis olanlar. */
export const ESKI_GUN = 7;

/** Gunluk tavan. Birikmis borc kullaniciya HIC gosterilmez — bkz. Home. */
export const DAILY_REVIEW_CAP = 40;

/**
 * "Simdi tekrarla" partisi. Vadesi gelmemis kartlardan kac tanesi one alinir.
 * Kucuk tutuluyor: amac butun havuzu ogutmek degil, calismak isteyen
 * kullaniciya bir kapi acmak.
 */
export const AHEAD_BATCH = 10;

/**
 * Tekrar yuku bu sayiyi gecince ana ekranda "Önce tekrar et" satiri cikar.
 *
 * Ayri bir tekrar dugmesi ACILMADI (bkz. NOTLAR): tekrari atlanabilir
 * yapmak borcu buyutur. Bu satir yalnizca dersin ICINDEKI sirayi
 * degistiriyor, hicbir bolumu atlamiyor.
 */
export const AGIR_TEKRAR = 12;

const norm = (s: string) => s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü]/g, '');

/**
 * Kancasi kelimenin AYNISI olan kartlar (far ≈ far, put ≈ put).
 * Bunlar aslinda mnemonik degil, Turkceye gecmis kelimeler — yontemin
 * ne yaptigini GOSTERMIYORLAR. Kart olarak degerliler ama vitrin degiller.
 */
const zayifKanca = (c: Card) => !kancaliMi(c) || norm(c.en) === norm(c.hook);

/**
 * Kart gorselleri.
 * `src/assets/cards/<kart-id>.webp` koyulunca o kartin gorseli olur —
 * elle liste tutmaya, cards.json'a dokunmaya gerek yok. Kalan kartlar da
 * ayni sekilde eklenecek.
 */
const GORSEL_DOSYALARI = import.meta.glob('./assets/cards/*.{webp,png,jpg,jpeg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const GORSELLER = new Map(
  Object.entries(GORSEL_DOSYALARI).map(([yol, url]) => [
    yol.split('/').pop()!.replace(/\.[^.]+$/, ''),
    url,
  ]),
);

/*
  Sinif ("tutan" / "kurtarilabilir") artik sete girmeyi belirlemiyor; GORSEL
  belirliyor. 6 Ekim incelemesinde kurtarilabilir siniftaki kartlarin cogu
  "kalsin" cikti (key ≈ keyif, arm ≈ armut); gorseli uretilen kart sete
  girer. Kancasi zayif kartin gorseli zaten uretilmiyor (bkz.
  tools/kart-inceleme.mjs, gorsel sirasi).
*/
const frekansSirasi = (raw as Card[]).slice().sort((a, b) => a.order - b.order);

/**
 * v1 seti: GORSELI HAZIR olan kartlar — su an 100.
 *
 * Kapsami gorsel belirliyor, cunku gorsel bu urunde susleme degil yontemin
 * kendisi: kancayi kelimeye baglayan sey o tek resim. Gorseli olmayan kartta
 * ekranda brief metni duruyordu; o kart yontemi HIC anlatmiyor, sadece bir
 * kelime listesi oluyor.
 *
 * Kalan 200 kart cards.json'da duruyor ve beklemede: gorseli uretilip
 * `src/assets/cards/<id>.webp` olarak konulan kart kendiliginden sete girer —
 * burada elle liste tutulmuyor. "Kurtarilabilir" sinifi hala 2. set icin bekliyor.
 *
 * Siralama siklik sirasi — TEK istisna: ilk bes karta zayif kanca girmez.
 * Uygulamayi ilk acan insanin gordugu ilk on kart, yontemin ne yaptigini
 * anlatan kartlar olmali. Zayif kancalar ilk besin hemen arkasina kayar,
 * geri kalan her sey siklik sirasinda kalir.
 */
const v1Seti = frekansSirasi.filter((c) => GORSELLER.has(c.id));

/*
  LGS (20 Ekim). Kart metinleri `content/lgs.json`'da (uretici:
  tools/mufredat/lgs-icerik.mjs), gorseller `src/assets/cards-lgs/`.
  cards.json'a eklenmedi: o dosya Excel'den uretiliyor ve ek alanlar bir
  sonraki iceri aktarmada silinirdi.
*/
type LgsHam = {
  kartlar: (Card & { genel: boolean })[];
  /** Zaten Genel'de kart olan LGS kelimeleri ve uniteleri */
  mevcut: { id: string; unite: number }[];
  /** Genel kartlarinin seviyesi (Oxford CEFR) */
  seviye: Record<string, 'baslangic' | 'orta'>;
  /** Genel kartlarinin ornek cumlesi: [Ingilizce, Turkce] — kelime aynen geciyor */
  ornek: Record<string, [string, string]>;
};
const LGS = lgsHam as unknown as LgsHam;

const LGS_GORSEL_DOSYALARI = import.meta.glob('./assets/cards-lgs/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const LGS_GORSELLER = new Map(
  Object.entries(LGS_GORSEL_DOSYALARI).map(([yol, url]) => [yol.split('/').pop()!.replace(/\.[^.]+$/, ''), url]),
);

const MEVCUT_UNITE = new Map(LGS.mevcut.map((m) => [m.id, m.unite]));

/** Genel'in eski kartlari, gorseli ve seviyesiyle. */
const GENEL_ESKI: Card[] = (() => {
  const guclu = v1Seti.filter((c) => !zayifKanca(c));
  const zayif = v1Seti.filter(zayifKanca);
  const ilkGrup = guclu.slice(0, BATCH);
  const kalan = [...guclu.slice(BATCH), ...zayif].sort((a, b) => a.order - b.order);
  return [...ilkGrup, ...kalan].map((c, i) => ({
    ...c,
    order: i + 1,
    image: GORSELLER.get(c.id) ?? null,
    seviye: LGS.seviye[c.id] ?? 'baslangic',
    unite: MEVCUT_UNITE.get(c.id),
    ornek: LGS.ornek[c.id]?.[0],
    ornekTr: LGS.ornek[c.id]?.[1],
  }));
})();

/** LGS kartlari. Gorseli olmayan uc kart (dini yapilar) da destede: yuzu yalniz kelime. */
const LGS_KARTLARI: Card[] = LGS.kartlar.map(({ genel: _genel, ...c }) => ({
  ...c,
  image: LGS_GORSELLER.get(c.id) ?? null,
}));
const LGS_GENELE: Set<string> = new Set(LGS.kartlar.filter((k) => k.genel).map((k) => k.id));

const SEVIYE_SIRA = { baslangic: 0, orta: 1 } as const;

/**
 * GENEL destesi: eski kartlar + Genel'e uygun LGS kartlari (okula ozgu
 * olanlar haric — caravansary, catgut...). Gorseli olmayan kart girmez.
 *
 * Sira SEVIYEYE gore: once Baslangic, sonra Orta; kendi icinde eski siklik
 * sirasi, ardindan LGS'den gelenler. Ilk bes guclu kanca HER ZAMAN basta —
 * ilk dersi yontemi gosteren kartlar acmali (bkz. yukarida).
 *
 * `basla: 'orta'` (uyelikte "Orta seviye" diyen) Orta'yi one alir; seviye
 * yalnizca SIRAYI degistirir, kart ayni (KARARLAR 5).
 */
export function genelDestesi(basla: 'baslangic' | 'orta' = 'baslangic'): Card[] {
  const lgsden = LGS_KARTLARI.filter((c) => LGS_GENELE.has(c.id) && c.image);
  const ilk = GENEL_ESKI.slice(0, BATCH);
  const govde = [...GENEL_ESKI.slice(BATCH), ...lgsden];
  const sira = (c: Card) => {
    const s = SEVIYE_SIRA[c.seviye ?? 'baslangic'];
    return basla === 'orta' ? 1 - s : s;
  };
  // Array.sort kararli: ayni seviyede gelis sirasi korunur.
  return [...ilk, ...govde.sort((a, b) => sira(a) - sira(b))].map((c, i) => ({ ...c, order: i + 1 }));
}

/**
 * LGS destesi: unite unite. Her unitede once yeni LGS kartlari, sonra o
 * unitenin Genel'de zaten olan kelimeleri (busy, bake...).
 *
 * `aktifUnite` verilirse o unite basa alinir, ardindan sonraki uniteler,
 * en son oncekiler: unite bitince yeni kelime bir sonrakinden gelir.
 */
export function lgsDestesi(aktifUnite?: number): Card[] {
  const genelden = GENEL_ESKI.filter((c) => c.unite);
  const unitesi = (u: number) => [
    ...LGS_KARTLARI.filter((c) => c.unite === u),
    ...genelden.filter((c) => c.unite === u),
  ];
  const bas = aktifUnite && aktifUnite >= 1 && aktifUnite <= UNITE_SAYISI ? aktifUnite : 1;
  const sira = Array.from({ length: UNITE_SAYISI }, (_, i) => ((bas - 1 + i) % UNITE_SAYISI) + 1);
  return sira.flatMap(unitesi).map((c, i) => ({ ...c, order: i + 1 }));
}

export const UNITE_SAYISI = 10;

/** Bir unitenin kelimeleri (LGS destesindeki sirayla). */
export const uniteKartlari = (u: number): Card[] => lgsDestesi(u).filter((c) => c.unite === u);

/**
 * AKTIF DESTE — bolume gore (bkz. bolum.ts). Uygulamanin geri kalani
 * `CARDS`'i "setteki kartlar" olarak okuyor: sayaclar, kelime listesi,
 * secenek havuzu. Yeni kelimenin SIRASI ise App'te kullanicinin seviyesine
 * ya da unitesine gore kuruluyor (bkz. scheduler `nextBatch`).
 */
export const CARDS: Card[] = AKTIF_BOLUM === 'lgs' ? lgsDestesi() : genelDestesi();

export const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));

/**
 * Karsilama ekraninda gosterilen ornek kart.
 * Deste 1'in disindan secilir ki kullanici ayni karti iki kez "yeni" gormesin.
 */
export const SHOWCASE_CARD =
  CARDS.find((c) => c.id === 'snake' && c.order > BATCH) ??
  // LGS: yazilis cagrisimi — bizim farkimiz (deli + cious)
  CARDS.find((c) => c.id === 'delicious' && c.order > BATCH) ??
  CARDS.find((c, i) => i >= BATCH && kancaliMi(c) && c.image) ??
  CARDS[BATCH];

/**
 * Settekilerin ilerlemesi. Setten CIKMIS kartin kaydi elenir — SILINMEZ.
 *
 * Set degisince (once 100'den 26'ya indi, sonra 100'e cikti) daha once
 * kurulmus bir cihazda artik sette olmayan kartlarin — `turn`,
 * `put` gibi — ilerlemesi veritabaninda duruyor.
 * Elenmezse: tekrar kuyruguna girip derste sessizce atlaniyorlar (ana ekran
 * "5 tekrar" diyor, ders bos aciliyor), "26 kelimenin 40'i" gibi sayilar
 * cikiyor ve set daha ilk gun "bitmis" sayilabiliyor.
 *
 * Kayitlar duruyor cunku o kartlar 2. setle geri gelecek; FSRS gecmisleri ve
 * kanca kalite sinyalleri degerli. Yedege de tam haliyle giriyorlar.
 */
export function setteOlanlar<T extends { cardId: string }>(progress: readonly T[]): T[] {
  return progress.filter((p) => CARD_BY_ID.has(p.cardId));
}

/**
 * Setin tamami tanisildi mi. "Bitti" kelimesini tek yerde tanimliyoruz;
 * ana ekran ve ders bitisi ayni soruyu iki turlu cevaplamasin.
 */
export const setBittiMi = (progress: readonly { introduced: boolean }[]) =>
  progress.filter((p) => p.introduced).length >= CARDS.length;

/**
 * Tanisilan kartlarin kanca ciftleri, siklik sirasinda.
 * Paylasim panosunun icerigi bu — bkz. share.ts `renderHookBoard`.
 */
export function ogrenilenKancalar(progress: readonly { cardId: string; introduced: boolean }[]) {
  return progress
    .filter((p) => p.introduced)
    .map((p) => CARD_BY_ID.get(p.cardId))
    .filter((c): c is Card => Boolean(c) && kancaliMi(c!))
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ en: c.en, hook: c.hook }));
}


/**
 * Setteki tum Ingilizce kelimeler, normalize halde.
 * Yazilan cevabin "yazim hatasi mi, baska bir kelime mi" ayrimi icin —
 * bkz. answer.ts `judge`.
 */
export const EN_HAVUZ: ReadonlySet<string> = new Set(CARDS.map((c) => normalize(c.en, 'en')));

/** Ayni is, Turkce yonu icin — EN -> TR sorularinda kullanilir. */
export const TR_HAVUZ: ReadonlySet<string> = new Set(CARDS.map((c) => normalize(c.tr, 'tr')));
