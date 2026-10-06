/**
 * KARSILAMA (SNAKE) KIME GORUNUR.
 *
 * Yalnizca tanitim sayfasindaki "Hemen basla"ya basana. O dugme
 * `/ingilizce/?basla=1`e gidiyor. Baska her yoldan — geri tusu, cikistan
 * sonra geri donmek, adresi elle yazmak, eski bir baglanti — gelen ve henuz
 * baslamamis kullanici tanitim sayfasina yollaniyor (bkz. App).
 *
 * Once uygulamaya giren HER baslamamis kullanici karsilamayi goruyordu:
 * cikis yapip geri tusuna basan da, hesabini silip geri donen de snake'le
 * karsilaniyordu.
 *
 * Izin sekme boyunca `sessionStorage`da tutuluyor: karsilamanin ortasinda
 * sayfayi yenileyen yine karsilamayi gormeli, adresteki `basla=1` ise
 * hemen siliniyor (adreste kalirsa geri tusu onu da geri getirir).
 *
 * Telefon uygulamasinda (APK), ana ekrana eklenmis uygulamada ve
 * gelistirmede tanitim sayfasi yok — orada karsilama her zaman acik.
 */
const ANAHTAR = 'karsilama-izni';

function tanitimSayfasiYok(): boolean {
  if (import.meta.env.BASE_URL === '/') return true;
  const w = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (w.Capacitor?.isNativePlatform?.() === true) return true;
  return window.matchMedia?.('(display-mode: standalone)').matches === true;
}

function geriIleriMi(): boolean {
  const gezinti = performance.getEntriesByType?.('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  return gezinti?.type === 'back_forward';
}

/** Acilista BIR KEZ (App'in baslangic degeri). Adresteki `basla=1`i siler. */
export function karsilamaIzniOku(): boolean {
  if (tanitimSayfasiYok()) return true;
  const adres = new URL(window.location.href);
  const basla = adres.searchParams.get('basla') === '1';
  if (basla) {
    adres.searchParams.delete('basla');
    history.replaceState(null, '', adres.pathname + adres.search + adres.hash);
  }
  // Geri/ileri tusuyla gelen asla: gecmisteki sayfa bir "Hemen basla" degil.
  if (geriIleriMi()) return false;
  try {
    if (basla) sessionStorage.setItem(ANAHTAR, '1');
    return basla || sessionStorage.getItem(ANAHTAR) === '1';
  } catch {
    return basla;
  }
}

/** Karsilama bitti ya da kullanici ayriliyor: izin bir daha kullanilmasin. */
export function karsilamaIzniniSil(): void {
  try {
    sessionStorage.removeItem(ANAHTAR);
  } catch {
    // Depo yoksa silinecek bir sey de yok.
  }
}

/**
 * Tanitim sayfasina yolla — ama DONGUYE girmeden.
 *
 * Kok adres bir gun yine uygulamaya cikarsa (yerel onizleme tam olarak
 * bunu yapiyor) yonlendirme sonsuza dek doner. Son birkac saniyede zaten
 * yollandiysak bu sefer yollamiyoruz; `false` donerse karsilama gosterilir.
 */
export function tanitimaYolla(): boolean {
  const ANAHTAR_YOL = 'karsilama-yollandi';
  try {
    const son = Number(sessionStorage.getItem(ANAHTAR_YOL) ?? 0);
    if (Date.now() - son < 5000) return false;
    sessionStorage.setItem(ANAHTAR_YOL, String(Date.now()));
  } catch {
    return false;
  }
  window.location.replace('/');
  return true;
}
