/**
 * UYELIK — hesabin tek kapisi.
 *
 * Uygulamanin geri kalani yalnizca `useUyelik()`, `girisBaglantisiGonder()`
 * ve `cikisYap()` cagiriyor. Saglayici degisirse degisen tek yer burasi —
 * `analitik.ts` ile ayni desen, ve o deseni bir kez Firebase'den Supabase'e
 * gecerken tek dosya degistirerek kullandik.
 *
 * NEDEN SDK VAR, OYSA OLCUMDE YOKTU. Olcumun ihtiyaci tek bir INSERT'ti;
 * `fetch` yetiyordu. Uyelikte ise oturum saklama, jeton tazeleme, baglanti
 * donusunu yakalama ve ileride OAuth/PKCE var. Bunlari elle yazmak
 * guvenlik hatasi uretmenin kisa yolu.
 *
 * NEDEN YINE DE PAKETE YUK BINMIYOR. SDK **dinamik** import ediliyor ve
 * yalnizca iki durumda iniyor: (1) depoda oturum jetonu varsa, (2) kullanici
 * giris akisini baslatirsa. Instagram'dan gelip ilk dersi yapan ve hesap
 * acmayan ziyaretciye tek bayt inmiyor. (`speech.ts`, `dosya.ts` ve
 * `geri.ts` ayni yolu izliyor.)
 *
 * NEDEN GIRIS KAPIDA DEGIL. Karsilama ve ilk ders uyeliksiz calisiyor;
 * hesap ancak "haa" aninden SONRA isteniyor. Tanimadigi bir uygulama icin
 * kimse hesap acmiyor — Duolingo'nun `/register` sayfasinda bile kayit
 * formu yok, once ders yaptiriyor.
 */
import { useSyncExternalStore } from 'react';
import type { SupabaseClient, Session } from '@supabase/supabase-js';

const ADRES = import.meta.env.VITE_SUPABASE_URL;
const ANAHTAR = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Yapilandirma yoksa uyelik arayuzu hic gosterilmez — olcumdeki kural. */
export const uyelikVarMi = (): boolean => Boolean(ADRES && ANAHTAR);

/**
 * SDK'nin oturumu sakladigi localStorage anahtari.
 *
 * Acilista SDK'yi indirmeden "bu kisi giris yapmis mi" sorusuna cevap
 * vermek icin bakiliyor. Supabase bu anahtari `sb-<proje>-auth-token`
 * olarak kuruyor; proje adi adresin alt alan adindan cikiyor.
 */
function oturumAnahtari(): string | null {
  try {
    const proje = new URL(ADRES).hostname.split('.')[0];
    return `sb-${proje}-auth-token`;
  } catch {
    return null;
  }
}

function depodaOturumVar(): boolean {
  const k = oturumAnahtari();
  if (!k) return false;
  try {
    return localStorage.getItem(k) !== null;
  } catch {
    // Gizli sekmede depo erisimi atabiliyor; oturum yok sayilir.
    return false;
  }
}

/**
 * Giris baglantisindan donuldu mu.
 *
 * Supabase jetonlari adresin DIYEZ kisminda geri gonderiyor
 * (`#access_token=...`). Bu durumda SDK acilista yuklenmeli, yoksa jeton
 * islenmeden sayfa yenilenince kaybolur.
 */
function baglantidanDonuldu(): boolean {
  if (typeof location === 'undefined') return false;
  return location.hash.includes('access_token=') || location.search.includes('code=');
}

// --- Durum -----------------------------------------------------------------

export type Uye = { id: string; eposta: string | null };

let istemci: SupabaseClient | null = null;
let uye: Uye | null = null;
let hazir = false;
const dinleyiciler = new Set<() => void>();

function haberVer(): void {
  dinleyiciler.forEach((f) => f());
}

const abone = (f: () => void) => {
  dinleyiciler.add(f);
  return () => {
    dinleyiciler.delete(f);
  };
};

function oturumdan(s: Session | null): Uye | null {
  if (!s?.user) return null;
  return { id: s.user.id, eposta: s.user.email ?? null };
}

/**
 * SDK'yi indirip istemciyi kurar. Birden fazla cagri tek indirme yapar.
 *
 * `detectSessionInUrl` acik: giris baglantisindan donuldugunde jetonlari
 * SDK kendisi okuyup adresi temizliyor.
 */
let kurulum: Promise<SupabaseClient | null> | null = null;

function istemciyiKur(): Promise<SupabaseClient | null> {
  if (istemci) return Promise.resolve(istemci);
  if (kurulum) return kurulum;
  if (!uyelikVarMi()) return Promise.resolve(null);

  kurulum = (async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      istemci = createClient(ADRES, ANAHTAR, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      const { data } = await istemci.auth.getSession();
      uye = oturumdan(data.session);
      istemci.auth.onAuthStateChange((_olay, oturum) => {
        uye = oturumdan(oturum);
        haberVer();
      });
      return istemci;
    } catch {
      // Ag yok ya da paket inemedi: uygulama uyeliksiz calismaya devam eder.
      return null;
    } finally {
      hazir = true;
      haberVer();
    }
  })();

  return kurulum;
}

/**
 * Acilista BIR KEZ (main.tsx).
 *
 * SDK'yi yalnizca gerekliyse indiriyor: depoda oturum varsa ya da giris
 * baglantisindan donulduyse. Ilk kez gelen ziyaretci icin hicbir sey
 * inmiyor ve `hazir` dogrudan true olup arayuz "giris yapilmamis" haliyle
 * aciliyor.
 */
export async function uyelikHazirla(): Promise<void> {
  if (!uyelikVarMi()) {
    hazir = true;
    return;
  }
  if (depodaOturumVar() || baglantidanDonuldu()) {
    await istemciyiKur();
    return;
  }
  hazir = true;
}

// --- Disariya acilan islemler ----------------------------------------------

/**
 * Giris baglantisi gonderir. Hesap yoksa kendiliginden olusur.
 *
 * Sifre YOK. Sifre demek unutma, sifirlama akisi ve destek yuku demek;
 * tek kullanimlik baglanti bunlarin hicbirini getirmiyor.
 */
export async function girisBaglantisiGonder(
  eposta: string,
): Promise<{ oldu: boolean; hata?: string }> {
  const c = await istemciyiKur();
  if (!c) return { oldu: false, hata: 'Şu an bağlanamıyoruz. Biraz sonra dene.' };

  /*
    Donus adresi UYGULAMANIN ADRESI, kok DEGIL.

    `window.location.origin` yalnizca `https://hafizada.com` veriyor; uygulama
    ise `/ingilizce/` altinda. Kok adres `/ingilizce/`ye yonlendiriyor ama
    yonlendirme adresin DIYEZ kismini dusuruyor — Supabase jetonlari tam
    orada gonderiyor. Yani baglantiya tiklayan kullanici uygulamaya varir
    ama oturumu acilmaz, hicbir hata da gormez.

    `BASE_URL` Vite'in derleme anindaki taban yolu: gelistirmede `/`,
    uretimde `/ingilizce/`.
  */
  const donus = new URL(import.meta.env.BASE_URL, window.location.origin).href;

  const { error } = await c.auth.signInWithOtp({
    email: eposta.trim(),
    options: { shouldCreateUser: true, emailRedirectTo: donus },
  });

  if (!error) return { oldu: true };

  /*
    Supabase hata metinleri Ingilizce ve teknik. En sik ikisi cevriliyor;
    gerisi genel mesaja dusuyor — kullaniciya "AuthApiError" gostermek
    hicbir sey anlatmiyor.
  */
  const m = error.message.toLowerCase();
  if (m.includes('rate') || m.includes('limit')) {
    return { oldu: false, hata: 'Çok fazla deneme oldu. Birkaç dakika sonra tekrar dene.' };
  }
  if (m.includes('invalid') && m.includes('email')) {
    return { oldu: false, hata: 'Bu e-posta adresi geçerli görünmüyor.' };
  }
  return { oldu: false, hata: 'Bağlantı gönderilemedi. Biraz sonra tekrar dene.' };
}

export async function cikisYap(): Promise<void> {
  const c = await istemciyiKur();
  await c?.auth.signOut();
  uye = null;
  haberVer();
}

/** Giris yapmis kullanicinin kimligi; yoksa null. Senkron okuma. */
export const uyeOku = (): Uye | null => uye;

/** Uyelik durumu okunabilir hale geldi mi (SDK indi ya da gerekmedi). */
export const uyelikHazirMi = (): boolean => hazir;

/**
 * Bilesenler bunu kullanir.
 *
 * SDK acilistan SONRA inebildigi icin duz cagri yetmiyor: oturum
 * bulundugunda yeniden cizim gerekiyor (`useTelaffuz` ile ayni sebep).
 */
export function useUyelik(): { uye: Uye | null; hazir: boolean } {
  return useSyncExternalStore(
    abone,
    () => durumPaketi(),
    () => BOS,
  );
}

/*
  `useSyncExternalStore` her cagrida AYNI nesneyi gormeli, yoksa sonsuz
  yeniden cizim olur. Paket yalnizca gercekten degisince yenileniyor.
*/
const BOS: { uye: Uye | null; hazir: boolean } = { uye: null, hazir: false };
let paket = BOS;

function durumPaketi(): { uye: Uye | null; hazir: boolean } {
  if (paket.uye?.id !== uye?.id || paket.hazir !== hazir) {
    paket = { uye, hazir };
  }
  return paket;
}
