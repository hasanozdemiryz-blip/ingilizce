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

/**
 * Sifre sifirlama baglantisindan mi donuldu.
 *
 * MODUL YUKLENIRKEN okunuyor, fonksiyon icinde degil: SDK
 * `detectSessionInUrl` ile jetonlari isleyip adresi TEMIZLIYOR, sonra
 * sorulursa diyez bos cikar. Yakalanmazsa kullanici oturumu acilmis ama ne
 * yapacagini bilmez halde ana ekrana duser — oysa yapmasi gereken yeni bir
 * sifre belirlemek.
 */
const sifirlamaDonusu =
  typeof location !== 'undefined' && location.hash.includes('type=recovery');

export const sifirlamaDonusuMu = (): boolean => sifirlamaDonusu;

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

// --- Ortak yardimcilar -----------------------------------------------------

/**
 * Supabase'in geri donecegi adres: UYGULAMANIN adresi, kok DEGIL.
 *
 * `window.location.origin` yalnizca `https://hafizada.com` veriyor; uygulama
 * ise `/ingilizce/` altinda. Kok adres `/ingilizce/`ye yonlendiriyor ama
 * yonlendirme adresin DIYEZ kismini dusuruyor — Supabase jetonlari tam orada
 * gonderiyor. Yani baglantiya tiklayan kullanici uygulamaya varir ama oturumu
 * acilmaz, hicbir hata da gormez.
 *
 * Giris baglantisi, sifre sifirlama ve Google donusu ayni adresi kullanmali;
 * uclu ayrisirsa biri sessizce bozulur.
 *
 * `BASE_URL` Vite'in derleme anindaki taban yolu: gelistirmede `/`, uretimde
 * `/ingilizce/`.
 */
function donusAdresi(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

/** En az bu kadar karakter. Supabase varsayilani 6; kisa sifre istemiyoruz. */
export const SIFRE_EN_AZ = 8;

/**
 * Supabase hatalari Ingilizce ve teknik. Kullaniciya "AuthApiError" gostermek
 * hicbir sey anlatmiyor; sik gorulenler tek tek cevriliyor.
 *
 * `invalid login credentials` ozel bir durum: sihirli baglantiyla acilmis
 * hesaplarin sifresi YOK ve kullanici neden giremedigini anlamiyor. Metin
 * bunu soyluyor.
 */
function cevir(mesaj: string): string {
  const m = mesaj.toLowerCase();
  if (m.includes('rate') || m.includes('limit')) {
    return 'Çok fazla deneme oldu. Birkaç dakika sonra tekrar dene.';
  }
  if (m.includes('invalid login credentials')) {
    return 'E-posta ya da şifre hatalı. Daha önce e-posta bağlantısıyla girdiysen şifren yok — "Şifremi unuttum" ile bir tane oluştur.';
  }
  if (m.includes('already registered') || m.includes('already exists')) {
    return 'Bu adres zaten kayıtlı. Giriş yapmayı dene.';
  }
  if (m.includes('email not confirmed')) {
    return 'Adresini henüz doğrulamadın. Kayıt e-postandaki bağlantıya dokun.';
  }
  if (m.includes('password') && (m.includes('weak') || m.includes('short') || m.includes('least'))) {
    return `Şifre en az ${SIFRE_EN_AZ} karakter olmalı.`;
  }
  if (m.includes('invalid') && m.includes('email')) {
    return 'Bu e-posta adresi geçerli görünmüyor.';
  }
  return 'Bir şeyler ters gitti. Biraz sonra tekrar dene.';
}

export type Sonuc = {
  oldu: boolean;
  hata?: string;
  /** Kayit basarili ama oturum ACILMADI: once e-posta dogrulanacak. */
  dogrulamaBekliyor?: boolean;
};

const BAGLANAMADI: Sonuc = { oldu: false, hata: 'Şu an bağlanamıyoruz. Biraz sonra dene.' };

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

  const { error } = await c.auth.signInWithOtp({
    email: eposta.trim(),
    options: { shouldCreateUser: true, emailRedirectTo: donusAdresi() },
  });

  return error ? { oldu: false, hata: cevir(error.message) } : { oldu: true };
}

/**
 * Sifreyle kayit. Supabase'de "Confirm email" acik oldugu icin hesap
 * dogrulama e-postasi gonderiliyor ve oturum ancak dogrulamadan sonra
 * aciliyor — `dogrulamaBekliyor` bunu soyluyor ki arayuz "girdin" demesin.
 */
export async function sifreyleKayit(eposta: string, sifre: string): Promise<Sonuc> {
  if (sifre.length < SIFRE_EN_AZ) {
    return { oldu: false, hata: `Şifre en az ${SIFRE_EN_AZ} karakter olmalı.` };
  }
  const c = await istemciyiKur();
  if (!c) return BAGLANAMADI;

  const { data, error } = await c.auth.signUp({
    email: eposta.trim(),
    password: sifre,
    options: { emailRedirectTo: donusAdresi() },
  });
  if (error) return { oldu: false, hata: cevir(error.message) };

  /*
    Dogrulama acikken `session` null doner, `user` dolu gelir. Kapaliysa
    oturum hemen acilir. Ikisini de destekliyoruz ki panel ayari degisince
    arayuz bozulmasin.
  */
  return { oldu: true, dogrulamaBekliyor: !data.session };
}

/** Sifreyle giris. */
export async function sifreyleGiris(eposta: string, sifre: string): Promise<Sonuc> {
  const c = await istemciyiKur();
  if (!c) return BAGLANAMADI;
  const { error } = await c.auth.signInWithPassword({ email: eposta.trim(), password: sifre });
  return error ? { oldu: false, hata: cevir(error.message) } : { oldu: true };
}

/**
 * Google ile giris.
 *
 * Tarayici Google'a gidip geri donuyor; bu cagri basariliysa sayfa zaten
 * terk ediliyor, yani donus degeri yalnizca HATA icin anlamli.
 *
 * Saglayici Supabase panelinde kapaliyken dugme hic gosterilmiyor
 * (bkz. `googleAcikMi`), yoksa kullanici tiklar ve hata sayfasi gorur.
 */
export async function googleIleGiris(): Promise<Sonuc> {
  const c = await istemciyiKur();
  if (!c) return BAGLANAMADI;
  const { error } = await c.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: donusAdresi() },
  });
  return error ? { oldu: false, hata: cevir(error.message) } : { oldu: true };
}

/**
 * Google dugmesi gosterilsin mi.
 *
 * Saglayicinin acik olup olmadigini istemciden ogrenmenin yolu yok; derleme
 * zamani bayragi kullaniliyor. Supabase panelinde Google acildiginda
 * `VITE_GOOGLE_GIRIS=1` ekleniyor (Actions secret) ve dugme beliriyor.
 */
export const googleAcikMi = (): boolean =>
  uyelikVarMi() && import.meta.env.VITE_GOOGLE_GIRIS === '1';

/** Sifre sifirlama baglantisi gonderir. */
export async function sifreSifirlamaGonder(eposta: string): Promise<Sonuc> {
  const c = await istemciyiKur();
  if (!c) return BAGLANAMADI;
  const { error } = await c.auth.resetPasswordForEmail(eposta.trim(), {
    redirectTo: donusAdresi(),
  });
  return error ? { oldu: false, hata: cevir(error.message) } : { oldu: true };
}

/** Yeni sifre belirler — sifirlama donusunde ya da Ayarlar'dan. */
export async function sifreBelirle(yeniSifre: string): Promise<Sonuc> {
  if (yeniSifre.length < SIFRE_EN_AZ) {
    return { oldu: false, hata: `Şifre en az ${SIFRE_EN_AZ} karakter olmalı.` };
  }
  const c = await istemciyiKur();
  if (!c) return BAGLANAMADI;
  const { error } = await c.auth.updateUser({ password: yeniSifre });
  return error ? { oldu: false, hata: cevir(error.message) } : { oldu: true };
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
