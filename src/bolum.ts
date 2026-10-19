/**
 * AKTIF BOLUM — Genel ya da LGS (20 Ekim; Cocuk "yakinda").
 *
 * Bolum kart destesini belirliyor (bkz. content.ts). Deste modul yuklenirken
 * bir kez kuruluyor; bolum degisince sayfa yeniden yukleniyor. Bunun
 * nedeni: `CARDS` ve `CARD_BY_ID` uygulamanin her yerinde sabit olarak
 * okunuyor; hepsini canli yapmak her ekrani elden gecirmek demekti, oysa
 * bolum gunde bir kez bile degismiyor.
 *
 * Cihazda (localStorage) tutuluyor, hesapta degil: ayni kisi telefonda LGS,
 * bilgisayarda Genel calisabilir. Ilerleme ise iki bolumde de ORTAK ve
 * senkronlu — ayni kelime (share, invite) iki destede ayni kayitla durur.
 *
 * Tanitim sitesi `?bolum=lgs` ile getiriyor (bkz. tools/site.mjs
 * `baslaYol`); adresten okunup siliniyor, yoksa yenileyen hep oraya doner.
 */
export type Bolum = 'genel' | 'lgs';

const ANAHTAR = 'hafizada.bolum';

const gecerli = (b: string | null): b is Bolum => b === 'genel' || b === 'lgs';

function oku(): Bolum {
  try {
    const adres = new URL(window.location.href);
    const istenen = adres.searchParams.get('bolum');
    if (adres.searchParams.has('bolum')) {
      adres.searchParams.delete('bolum');
      history.replaceState(history.state, '', adres.pathname + adres.search + adres.hash);
    }
    if (gecerli(istenen)) {
      localStorage.setItem(ANAHTAR, istenen);
      return istenen;
    }
    const kayitli = localStorage.getItem(ANAHTAR);
    return gecerli(kayitli) ? kayitli : 'genel';
  } catch {
    // Gizli sekme / engelli depolama: Genel'le devam.
    return 'genel';
  }
}

export const AKTIF_BOLUM: Bolum = typeof window === 'undefined' ? 'genel' : oku();

/** Bolumu degistirir ve desteyi yeniden kurmak icin sayfayi yeniler. */
export function bolumDegistir(b: Bolum): void {
  if (b === AKTIF_BOLUM) return;
  try {
    localStorage.setItem(ANAHTAR, b);
  } catch {
    /* depolama yoksa yalnizca bu acilis icin */
  }
  window.location.reload();
}
