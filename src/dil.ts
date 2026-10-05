/**
 * ARAYUZ DILI — Turkce (kaynak) ve Ingilizce.
 *
 * ANAHTAR TURKCE METNIN KENDISI. `t('Devam')` Turkcede oldugu gibi doner,
 * Ingilizcede sozlukten (`dil/en.ts`) karsiligi gelir. Kod okunur kaliyor
 * ve yeni bir metin yazan kisi ayri bir anahtar uydurmak zorunda kalmiyor.
 * Sozlukte karsiligi olmayan metin Turkce gorunur; `dil.test.ts` bunu
 * derlemeden once yakaliyor.
 *
 * ICERIK CEVRILMIYOR. Kartin Turkce anlami ve Turkce ses kancasi yontemin
 * kendisi; Ingilizce arayuzde de ayni kaliyor. Cevrilen yalnizca menu,
 * yonerge ve aciklamalar.
 *
 * DEGISINCE SAYFA YENILENIYOR. Modul duzeyindeki listeler (sekmeler,
 * seviyeler) yuklenirken bir kez ceviriliyor; canli gecis icin her birini
 * tepkisel yapmak yerine dil degisince uygulama bastan aciliyor — nadir bir
 * islem, ve ilerleme cihazda oldugu icin hicbir sey kaybolmuyor.
 */
import { EN } from './dil/en';

export type Dil = 'tr' | 'en';

const ANAHTAR = 'hafizada-dil';

/**
 * Ilk dil: daha once secildiyse o, yoksa TURKCE.
 *
 * Tarayici diline gore otomatik secim bilincli olarak YOK: tarayicisi
 * Ingilizce olan cok sayida Turk kullanici var ve guncellemeyle bir anda
 * Ingilizce arayuzle karsilasirlardi. Urunun kitlesi Turkce konusanlar;
 * Ingilizce, karsilama ekranindan ve Ayarlar'dan secilen bir secenek.
 */
function ilkDil(): Dil {
  try {
    const kayitli = localStorage.getItem(ANAHTAR);
    if (kayitli === 'tr' || kayitli === 'en') return kayitli;
  } catch {
    // Gizli sekmede depo atabiliyor; Turkceye dusulur.
  }
  return 'tr';
}

let dil: Dil = ilkDil();
if (typeof document !== 'undefined') document.documentElement.lang = dil;

export const dilOku = (): Dil => dil;

/** Dili kaydeder ve uygulamayi yeniden acar (bkz. dosya basi). */
export function dilDegistir(yeni: Dil): void {
  if (yeni === dil) return;
  try {
    localStorage.setItem(ANAHTAR, yeni);
  } catch {
    // Kaydedilemezse bu oturum icin yine de degisir.
  }
  dil = yeni;
  window.location.reload();
}

/**
 * Cevir. `{ad}` gibi yer tutucular `degerler`den doldurulur:
 *   t('{n} kelime', { n: 5 })  →  "5 kelime" / "5 words"
 */
export function t(tr: string, degerler?: Record<string, string | number>): string {
  let s = dil === 'en' ? (EN[tr] ?? tr) : tr;
  if (degerler) s = s.replace(/\{(\w+)\}/g, (_, k: string) => String(degerler[k] ?? `{${k}}`));
  return s;
}
