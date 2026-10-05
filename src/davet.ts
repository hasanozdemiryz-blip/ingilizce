import type { Kazanim } from './cerceveler';
import { t } from './dil';

/**
 * UYELIK DAVETININ ZAMANLAMASI.
 *
 * Davet her ders sonunda cikiyordu ve bu iki sekilde yanlisti: hicbir sey
 * ogrenmemis kisiye "ilerlemeni kaybetme" demek bossa, her gun ayni seyi
 * demek de yildiriyor.
 *
 * Artik yalnizca ANLAMLI anlarda cikiyor ve metni o ana ait. Kullanici
 * "sonra" dediginde o ESIK susuyor, seans degil: ayni esigi her acilista
 * tekrar gostermek "sonra" demeyi anlamsizlastirir.
 *
 * Esikler `Kazanim`dan besleniyor (bkz. cerceveler.ts) — cerceve
 * kilitleriyle ayni uc sayi. Paralel bir ilerleme olcusu kurmak ikisinin
 * sessizce ayrismasi demekti.
 */
export type Davet = {
  /** Kalici kimlik; `uyelikDavetGorulen` bunu saklıyor. */
  id: string;
  baslik: string;
  metin: string;
};

type Esik = Davet & { kosul: (k: Kazanim) => boolean };

/**
 * Sira onemli: ustteki once denenir, yani en TAZE kilometre tasi kazanir.
 * Ayni derste hem 10. kelime hem 3. gun dolduysa kullanici bir tane davet
 * gorur, iki tane degil.
 */
const ESIKLER: Esik[] = [
  {
    id: 'set',
    kosul: (k) => k.setBitti,
    baslik: t('Seti bitirdin'),
    metin: t('Bu kadar emeğin tek bir cihazda durmasın. Üye ol, nereden açarsan aç yanında olsun.'),
  },
  {
    id: 'seri3',
    kosul: (k) => k.seri >= 3,
    baslik: t('{p0} gündür aralıksız', { p0: 3 }),
    metin: t('Alışkanlık oluşuyor. Üye olursan bu seri tarayıcını temizlesen de bozulmaz.'),
  },
  {
    id: 'kelime10',
    kosul: (k) => k.ogrenilen >= 10,
    baslik: t('10 kelime oldu'),
    metin: t('Onu da kancasıyla öğrendin. Üye ol ki bu liste bu cihaza bağlı kalmasın.'),
  },
  {
    id: 'ilk',
    kosul: (k) => k.ogrenilen >= 1,
    baslik: t('İlk kelimelerin hazır'),
    metin: t('İlerlemen şu an yalnızca bu cihazda. Hesap açarsan kaybolmaz.'),
  },
];

/**
 * Gosterilecek davet, yoksa null.
 *
 * @param gorulen Daha once gosterilip "sonra" denen esiklerin kimlikleri.
 */
export function siradakiDavet(kazanim: Kazanim, gorulen: readonly string[]): Davet | null {
  const e = ESIKLER.find((x) => !gorulen.includes(x.id) && x.kosul(kazanim));
  if (!e) return null;
  return { id: e.id, baslik: e.baslik, metin: e.metin };
}
