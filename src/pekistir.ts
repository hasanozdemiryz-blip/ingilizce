/**
 * PEKISTIR — LGS ders sonu eki (31 Ekim, PLAN v3).
 *
 * Kelimeler aynen kaliyor; dersin sonuna 1–2 dakikalik bir ek geliyor: o
 * gunun kelimelerinin gectigi KALIPLAR ("Would you like to come to my
 * party?") ve unite ilerledikce kisa bir DIYALOG. Gramer anlatimi yok
 * (KARARLAR 7): kalip durumla gosteriliyor, sonra LGS'nin soru tipiyle
 * soruluyor ("Arkadasini partiye cagiriyorsun. Ne dersin?") ve kelime
 * kutularindan diziliyor.
 *
 * Bu dosya saf secim mantigi; ekran `screens/Pekistir.tsx`.
 */
import { kalipId, diyalogId, type UniteIcerik } from './lgs';

/** Ders sonunda en fazla bu kadar kalip — ek 1–2 dakikayi gecmesin. */
export const PEKISTIR_KALIP = 2;

/**
 * Cozulmus kalibin geri gelme araligi (gun), dogru sayisina gore.
 * Kelimelerdeki FSRS kadar ince degil; kaliplar az (unite basina ~10) ve
 * amac unutturmamak.
 */
const ARALIK_GUN = [1, 3, 7, 14, 30];

/**
 * Diyaloglarin acildigi esikler: unitenin kelimelerinin %20'si, %50'si,
 * %80'i ogrenilince sirayla. Kelimesini bilmedigi diyalogu dinletmek
 * anlamsiz; unite sonuna birakmak da diyalogu hic gostermemek demek.
 */
export const DIYALOG_ESIK = [0.2, 0.5, 0.8];

const kelimeler = (s: string): string[] => s.toLowerCase().match(/[a-z']+/g) ?? [];

/** Kalip cumlesi bu kelimelerden birini (cekimiyle) iceriyor mu. */
export function kelimeGeciyor(cumle: string, en: string): boolean {
  const c = ` ${kelimeler(cumle).join(' ')} `;
  const k = kelimeler(en);
  if (k.length === 0) return false;
  if (k.length > 1) return c.includes(` ${k.join(' ')} `);
  const w = k[0];
  // Cekim: invite → invited/inviting, party → parties. Kok en az 3 harf.
  const kok = w.length > 4 && /e$/.test(w) ? w.slice(0, -1) : w.replace(/y$/, '');
  return kelimeler(cumle).some((x) => x === w || (kok.length >= 3 && x.startsWith(kok) && x.length - kok.length <= 3));
}

export type Secim = { kaliplar: number[]; diyalog: number | null };

/**
 * Bu ders sonunda ne sorulacak.
 *
 * Kaliplar: once HIC cozulmemisler — bugunun kelimeleri gecenler onde —
 * sonra vadesi gelmis tekrarlar (en eskisi once). Diyalog: esigi gecilmis,
 * cozulmemis ilk diyalog; varsa kalip sayisi bire iner.
 */
export function pekistirSec(
  icerik: Pick<UniteIcerik, 'unite' | 'kaliplar' | 'diyaloglar'>,
  o: {
    bugunKelimeler: string[];
    kalip: Record<string, { d: number; t: number }> | undefined;
    diyalog: Record<string, number> | undefined;
    /** Unitenin ogrenilmis kelime orani, 0–1 */
    oran: number;
    /**
     * LGS DENEME DERSI (KARARLAR 18): ilk derste esik beklenmeden bir diyalog
     * gelir — ogrenci ilk 3 dakikada urunun kelime kartindan fazlasi oldugunu
     * gorsun. Bugunun kelimelerinin en cok gectigi diyalog secilir.
     */
    ilkDers?: boolean;
    simdi?: number;
  },
): Secim {
  const simdi = o.simdi ?? Date.now();
  const durum = (i: number) => o.kalip?.[kalipId(icerik.unite, i)];
  const sira = icerik.kaliplar.map((k, i) => ({ i, k, d: durum(i) }));

  const yeni = sira
    .filter((x) => !x.d || x.d.d === 0)
    .map((x) => ({ ...x, bugun: o.bugunKelimeler.some((w) => kelimeGeciyor(x.k.en, w)) }))
    .sort((a, b) => Number(b.bugun) - Number(a.bugun) || a.i - b.i);
  const vadeli = sira
    .filter((x) => x.d && x.d.d > 0)
    .filter((x) => x.d!.t + ARALIK_GUN[Math.min(x.d!.d, ARALIK_GUN.length) - 1] * 864e5 <= simdi)
    .sort((a, b) => a.d!.t - b.d!.t);

  let diyalog: number | null = null;
  for (let i = 0; i < icerik.diyaloglar.length; i++) {
    const esik = DIYALOG_ESIK[Math.min(i, DIYALOG_ESIK.length - 1)];
    if (!o.diyalog?.[diyalogId(icerik.unite, i)] && o.oran >= esik) {
      diyalog = i;
      break;
    }
  }
  if (diyalog === null && o.ilkDers && icerik.diyaloglar.length > 0) {
    const puan = (i: number) =>
      icerik.diyaloglar[i].satirlar.filter((st) => o.bugunKelimeler.some((w) => kelimeGeciyor(st.en, w))).length;
    diyalog = icerik.diyaloglar.map((_, i) => i).sort((a, b) => puan(b) - puan(a) || a - b)[0];
  }
  const adet = diyalog === null ? PEKISTIR_KALIP : 1;
  return { kaliplar: [...yeni, ...vadeli].slice(0, adet).map((x) => x.i), diyalog };
}

/**
 * "It tastes salty. / It smells delicious." gibi iki bicimli kaliplarda
 * dizme adimi YALNIZ ilk bicimle: "/" bir kelime kutusu olmamali.
 */
export const ilkBicim = (en: string): string => en.split(/\s+\/\s+/)[0].trim();

/**
 * Soru ekranindaki durum etiketi. "Davet etmek" kalir; "Sıralama: First",
 * "How about + fiil-ing" gibi cevabi ele veren etiketlerde Ingilizce kisim
 * kalibin icinde geciyorsa yalniz Turkce bas kalir, o da yoksa hic gosterilmez.
 */
export function durumEtiketi(not: string | undefined, en: string): string | null {
  if (!not) return null;
  const cumle = ` ${kelimeler(en).join(' ')} `;
  const ele = (s: string) => kelimeler(s).some((w) => w.length >= 2 && /^[a-z']+$/.test(w) && cumle.includes(` ${w} `));
  if (!ele(not)) return not;
  const bas = not.split(':')[0].trim();
  return bas && !ele(bas) ? bas : null;
}

/** Tohumlu karistirma — ayni soru her acilista ayni sirada. */
export function tohumluKaristir<T>(dizi: readonly T[], tohum: string): T[] {
  let h = 0;
  for (const ch of tohum) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const j = (h >>> 16) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Diyalogda bosaltilacak satir: ilk satir degil (soruyu acan o), en az
 * uc kelimeli satirlar arasindan en uzunu — tek kelimelik "Then?" tahmin
 * edilebilir, ogretmez.
 */
export function bosSatir(satirlar: { en: string }[]): number {
  let en = 1;
  for (let i = 1; i < satirlar.length; i++) {
    if (kelimeler(satirlar[i].en).length > kelimeler(satirlar[en].en).length) en = i;
  }
  return en;
}
