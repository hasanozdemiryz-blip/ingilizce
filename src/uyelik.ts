/**
 * UYELIK — hesabin tek kapisi.
 *
 * Uygulamanin geri kalani yalnizca bu modulu cagiriyor. Saglayici degisirse degisen tek yer burasi —
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
 * Depoda oturum jetonu var mi — SDK inmeden, esanli cevap.
 *
 * Acilista "bu kisi zaten girisli mi" sorusuna cevap vermek icin:
 * tanitim sayfasindaki "Giris yap" girisli kullaniciyi giris formuna
 * degil dogrudan uygulamaya goturmeli.
 *
 * Jetonun GECERLI oldugunu soylemiyor, yalnizca var oldugunu. Suresi
 * dolmussa SDK sonradan oturumu kapatiyor ve arayuz kendiliginden
 * "girisli degil" haline doner.
 */
export const oturumVarGibi = (): boolean => depodaOturumVar();

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

/**
 * Uyenin kendi girdigi bilgiler. Supabase'in `user_metadata` alaninda
 * duruyor — AYRI TABLO YOK.
 *
 * Gerekce: bu bilgi oturumla BIRLIKTE geliyor, yani "bu kisi uyeligini
 * tamamlamis mi" sorusu acilista ek istek olmadan cevaplaniyor. Ayri tablo
 * her acilista bir sorgu ve bir RLS politikasi demekti. Ilerleme senkronu
 * geldiginde zaten bir tablo gerekecek; bilgi o zaman oraya tasinabilir.
 */
export type UyeBilgi = {
  ad: string;
  /** Google ile girende bos kalir; Ayarlar'dan sonra doldurulabilir. */
  seviye?: 'yok' | 'biraz' | 'orta';
  hedef?: 'is' | 'seyahat' | 'sinav' | 'kendim';
  tamam: true;
};

export type Uye = { id: string; eposta: string | null; bilgi: UyeBilgi | null };

export type Seviye = NonNullable<UyeBilgi['seviye']>;
export type Hedef = NonNullable<UyeBilgi['hedef']>;

/** Tek liste: giris formu da Ayarlar da buradan okuyor, yoksa ayrisirlar. */
export const SEVIYELER: { deger: Seviye; yazi: string }[] = [
  { deger: 'yok', yazi: 'Hiç bilmiyorum' },
  { deger: 'biraz', yazi: 'Biraz anlıyorum' },
  { deger: 'orta', yazi: 'Orta seviye' },
];

export const HEDEFLER: { deger: Hedef; yazi: string }[] = [
  { deger: 'is', yazi: 'İş' },
  { deger: 'seyahat', yazi: 'Seyahat' },
  { deger: 'sinav', yazi: 'Sınav' },
  { deger: 'kendim', yazi: 'Kendim için' },
];

export const etiket = <T extends string>(
  liste: { deger: T; yazi: string }[],
  deger: T | undefined,
): string | null => liste.find((x) => x.deger === deger)?.yazi ?? null;

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

type HamKullanici = { id: string; email?: string | null; user_metadata?: unknown };

function uyeden(k: HamKullanici | null | undefined): Uye | null {
  if (!k) return null;
  const ham = k.user_metadata as Partial<UyeBilgi> | undefined;
  return {
    id: k.id,
    eposta: k.email ?? null,
    // `tamam` yoksa bilgi girilmemis demektir; yarim metadata'yi bilgi sayma.
    bilgi: ham?.tamam && ham.ad ? (ham as UyeBilgi) : null,
  };
}

const oturumdan = (s: Session | null): Uye | null => uyeden(s?.user);

/**
 * Google ile girende uyelik ILK ANDA tamamdir: ad zaten geliyor, bilgi
 * adimi hic gosterilmiyor. Sosyal giris tek dokunus olmasaydi tercih
 * edilme sebebi kalmazdi.
 *
 * Yazma bir kez: `updateUser` kendisi bir USER_UPDATED olayi tetikliyor ve
 * bayrak olmadan bu kendini cagiran bir donguye donuyor.
 */
let googleAdiYazildi = false;

async function googleAdiniYaz(c: SupabaseClient, s: Session | null): Promise<void> {
  if (googleAdiYazildi || !s?.user) return;
  if (s.user.app_metadata?.provider !== 'google') return;
  const ham = s.user.user_metadata as Record<string, unknown> | undefined;
  if (ham?.tamam) return;
  const ad = (ham?.full_name ?? ham?.name) as string | undefined;
  if (!ad) return;
  googleAdiYazildi = true;
  await c.auth.updateUser({ data: { ad, tamam: true } });
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
      void googleAdiniYaz(istemci, data.session);

      /*
        Depodaki oturum kullanicinin ESKI halini tasiyabiliyor: bilgi baska
        bir cihazda ya da baska bir sekmede girildiyse burada hala eksik
        gorunur ve kullaniciya doldurdugu halde "uyeligini tamamla" denir.
        `getUser` sunucudan okuyor, `getSession` depodan.

        Beklenmiyor: acilisi geciktirmesin. Cevap gelince arayuz
        kendiliginden tazeleniyor.
      */
      if (data.session) {
        void istemci.auth.getUser().then(({ data: taze }) => {
          if (!taze.user) return;
          uye = uyeden(taze.user);
          haberVer();
        });
      }
      istemci.auth.onAuthStateChange((_olay, oturum) => {
        uye = oturumdan(oturum);
        haberVer();
        if (istemci) void googleAdiniYaz(istemci, oturum);
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
    ADRES ZATEN KAYITLIYSA SUPABASE HATA DONDURMUYOR.

    Kullanici sayimini (email enumeration) engellemek icin basarili gibi
    cevap veriyor ve HICBIR e-posta gondermiyor. Tek isaret: donen
    kullanicinin `identities` dizisi bos.

    Yakalanmazsa kullanici "dogrulama postasi yolladik" yazisini okuyup
    hic gelmeyecek bir postayi bekliyor — bu tam olarak yasandi.
  */
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    return {
      oldu: false,
      hata: 'Bu adres zaten kayıtlı. "Giriş yap" ile devam et; şifreni bilmiyorsan "Şifremi unuttum" de.',
    };
  }

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
    /*
      `select_account`: Google tarayicida acik hesapla sormadan giriyordu.
      Iki hesabi olan kisi hangisiyle girdigini secemiyor, yanlis hesapla
      girdigini de fark etmiyordu.
    */
    options: { redirectTo: donusAdresi(), queryParams: { prompt: 'select_account' } },
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

/**
 * Uyelik TAMAM mi.
 *
 * E-posta onayi tek basina yetmiyor: hesap acilmis ama kullaniciya dair
 * hicbir sey bilmiyorsak uyelik yarim. Kural tek — elimizde bir ad varsa
 * tamamdir. Google ile girende ad saglayicidan geliyor, e-posta ile
 * girende bilgi adiminda soruluyor.
 */
export const uyelikTamamMi = (): boolean => Boolean(uye?.bilgi?.tamam);

/** Bilgi adiminin kaydi. Seviye ve hedef bos birakilabilir. */
export async function bilgiKaydet(bilgi: Omit<UyeBilgi, 'tamam'>): Promise<Sonuc> {
  const ad = bilgi.ad.trim();
  if (!ad) return { oldu: false, hata: 'Adını yazman gerekiyor.' };

  const c = await istemciyiKur();
  if (!c) return BAGLANAMADI;

  const { data, error } = await c.auth.updateUser({ data: { ...bilgi, ad, tamam: true } });
  if (error) return { oldu: false, hata: cevir(error.message) };

  /*
    `updateUser` oturumu dondurmuyor, yalnizca kullaniciyi. Olay zinciri
    uyeyi tazeleyecek ama cagiranin HEMEN sonra `uyelikTamamMi()` sormasi
    cok muhtemel (serit gizlenecek) — o yuzden yerel kopya burada
    guncelleniyor.
  */
  if (data.user && uye) {
    uye = { ...uye, bilgi: { ...bilgi, ad, tamam: true } };
    haberVer();
  }
  return { oldu: true };
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

/**
 * Hesabi tamamen siler — geri donusu yok.
 *
 * Silme islemi sunucuda (`hesap-sil` edge function): kullanici silmek
 * yonetici yetkisi istiyor ve o anahtar tarayiciya konulamaz. Silinecek
 * kimlik govdeden degil JETONDAN okunuyor, yoksa biri baskasinin
 * kimligini gonderip onu silerdi.
 *
 * `ilerleme` satiri veritabaninda `on delete cascade` ile gidiyor;
 * cihazdaki kopyayi cagiran temizliyor (bkz. senkron.ts).
 */
export async function hesabiSil(): Promise<Sonuc> {
  const c = await istemciyiKur();
  if (!c) return BAGLANAMADI;
  const { data } = await c.auth.getSession();
  const jeton = data.session?.access_token;
  if (!jeton) return { oldu: false, hata: 'Önce giriş yapman gerekiyor.' };

  try {
    const { error } = await c.functions.invoke('hesap-sil', { method: 'POST' });
    if (error) return { oldu: false, hata: 'Hesap silinemedi. Biraz sonra tekrar dene.' };
  } catch {
    return { oldu: false, hata: 'Hesap silinemedi. Biraz sonra tekrar dene.' };
  }

  await c.auth.signOut();
  uye = null;
  haberVer();
  return { oldu: true };
}

export async function cikisYap(): Promise<void> {
  const c = await istemciyiKur();
  await c?.auth.signOut();
  uye = null;
  haberVer();
}

/**
 * Kurulu Supabase istemcisi — `senkron.ts` icin.
 *
 * Disariya aciliyor cunku senkron da ayni oturumu ve ayni dinamik
 * indirmeyi kullanmali; ikinci bir istemci kurmak ikinci bir oturum
 * yonetimi demekti.
 */
export const istemciAl = (): Promise<SupabaseClient | null> => istemciyiKur();

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
  /*
    Kimlige degil NESNEYE bakiliyor. Kimlik karsilastirilirken bilgi adimi
    kaydedildiginde (ayni kisi, yeni `bilgi`) paket yenilenmiyor ve ekran
    sayfa yenilenene kadar "uyeligini tamamla" demeye devam ediyordu.
    `uye` yalnizca gercek bir degisiklikte yeniden ataniyor.
  */
  if (paket.uye !== uye || paket.hazir !== hazir) {
    paket = { uye, hazir };
  }
  return paket;
}
