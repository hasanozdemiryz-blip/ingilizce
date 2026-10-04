import { useEffect, useRef, useState } from 'react';
import { Button } from './ui';
import type { Hedef, Seviye } from '../uyelik';
import {
  HEDEFLER,
  SEVIYELER,
  SIFRE_EN_AZ,
  bilgiKaydet,
  googleAcikMi,
  googleIleGiris,
  sifreBelirle,
  sifreSifirlamaGonder,
  sifreyleGiris,
  sifreyleKayit,
  uyeOku,
} from '../uyelik';

/**
 * UYELIK — giris, kayit, sifre sifirlama.
 *
 * NEREDE CIKAR. Kapida DEGIL. Karsilama ve ilk ders uyeliksiz calisiyor; bu
 * sayfa ancak "haa" aninin ardindan aciliyor (bkz. SessionDone, Settings) ya
 * da tanitim sayfasindan `?giris=1` ile dogrudan cagriliyor. Tanimadigi bir
 * uygulamaya kimse hesap acmiyor.
 *
 * NEDEN HEPSI TEK BILESEN. Dort kip de ayni iki alani kullaniyor ve
 * aralarinda surekli gidip geliniyor ("sifren yok mu" → kayit → "zaten var"
 * → giris). Ayri bilesenlere bolununce metinler ve dogrulama kurallari
 * sessizce ayrisiyor.
 *
 * E-POSTA YALNIZCA DOGRULAMA ICIN. Bir sure "sifre yerine baglanti gonder"
 * secenegi de vardi; kaldirildi. Iki ayri giris yolu sunmak kullaniciya
 * hangisini kullandigini hatirlatmak zorunda birakiyor ve "gecen sefer
 * nasil girmistim" sorusunu uretiyor.
 *
 * Sihirli baglantiyla acilmis ESKI hesaplarin sifresi yok; onlar
 * "Sifremi unuttum" ile bir tane belirliyor. `uyelik.ts` icindeki hata
 * cevirisi onlari oraya yonlendiriyor.
 *
 * IKI BICIM. Telefonda alttan acilan sayfa (basparmak menzili), genis
 * ekranda ortada pencere.
 */
type Kip = 'giris' | 'kayit' | 'unuttum' | 'yeniSifre' | 'bilgi';



/** Islem bitti ve kullanicinin yapacagi baska bir is var. */
type Bitis = { baslik: string; metin: string; ipucu?: string };

export function Giris({
  onKapat,
  baslangicKip = 'giris',
  zorunlu = false,
  baslik,
  aciklama,
  onBilgiKaydedildi,
}: {
  onKapat: () => void;
  /** Sifre sifirlama donusunde 'yeniSifre' geliyor (bkz. App). */
  baslangicKip?: Kip;
  /**
   * Kapatilamaz. YALNIZCA sifirlama donusunde: kullanici yeni sifresini
   * belirlemeden cikarsa oturumu acik ama sifresiz kalir ve ne oldugunu
   * anlamaz. Ayarlar'dan acilan sifre degistirmede kapatilabilir olmali —
   * kipe bakip karar vermek ikisini birbirine karistiriyordu.
   */
  zorunlu?: boolean;
  baslik?: string;
  aciklama?: string;
  /**
   * Bilgi adimi bitince cagrilir. Yerel profilin adi da guncellenmeli,
   * yoksa kullanici adini yazdigi halde ana ekranda `Şen Balık` gormeye
   * devam eder (bkz. profil.ts).
   */
  onBilgiKaydedildi?: (ad: string) => void;
}) {
  const [kip, setKip] = useState<Kip>(baslangicKip);
  const [eposta, setEposta] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreAcik, setSifreAcik] = useState(false);
  /*
    Ayarlar'dan "bilgilerimi duzenle" ile gelindiginde alanlar MEVCUT
    degerlerle dolu gelmeli; bos form kullaniciya her seyi yeniden
    yazdirir ve bir alani bos birakirsa eskisini siler.
  */
  const [ad, setAd] = useState(() => uyeOku()?.bilgi?.ad ?? '');
  const [seviye, setSeviye] = useState<Seviye | null>(() => uyeOku()?.bilgi?.seviye ?? null);
  const [hedef, setHedef] = useState<Hedef | null>(() => uyeOku()?.bilgi?.hedef ?? null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bitis, setBitis] = useState<Bitis | null>(null);
  const alan = useRef<HTMLInputElement>(null);

  /*
    Escape ile kapanma. Pencere acilinca odak ilk alana gidiyor:
    kullanicinin buraya gelme sebebi bir sey yazmak.
  */
  const kapatilabilir = !zorunlu;
  useEffect(() => {
    alan.current?.focus();
    if (!kapatilabilir) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKapat();
    };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  }, [onKapat, kapatilabilir]);

  function kipDegistir(yeni: Kip) {
    setKip(yeni);
    setHata(null);
    setSifre('');
  }

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (gonderiliyor) return;
    setHata(null);
    setGonderiliyor(true);

    const sonuc =
      kip === 'giris'
        ? await sifreyleGiris(eposta, sifre)
        : kip === 'kayit'
          ? await sifreyleKayit(eposta, sifre)
          : kip === 'unuttum'
            ? await sifreSifirlamaGonder(eposta)
            : kip === 'bilgi'
              ? await bilgiKaydet({
                  ad,
                  ...(seviye ? { seviye } : {}),
                  ...(hedef ? { hedef } : {}),
                })
              : await sifreBelirle(sifre);

    setGonderiliyor(false);

    if (!sonuc.oldu) {
      setHata(sonuc.hata ?? 'Bir şeyler ters gitti.');
      return;
    }

    // Kayitta dogrulama bekleniyorsa oturum henuz ACILMADI — "girdin" deme.
    if (kip === 'kayit' && sonuc.dogrulamaBekliyor) {
      setBitis({
        baslik: 'Adresini doğrula',
        metin: `${eposta} adresine bir doğrulama bağlantısı yolladık. Aç, dokun, geri dön.`,
        ipucu: 'Gelmediyse spam klasörüne bak. Birkaç dakika sürebiliyor.',
      });
      return;
    }
    /*
      Dogrulama KAPALIYSA kayit oturumu hemen aciyor; o zaman bilgi adimi
      buradan devam ediyor. Acikken kullanici e-postadaki baglantiyla
      donunce App adimi aciyor (bkz. App `girisKip`).
    */
    if (kip === 'kayit') {
      kipDegistir('bilgi');
      return;
    }
    if (kip === 'bilgi') {
      onBilgiKaydedildi?.(ad.trim());
      onKapat();
      return;
    }
    if (kip === 'unuttum') {
      setBitis({
        baslik: 'Sıfırlama bağlantısı yolda',
        metin: `${eposta} adresine şifre belirleme bağlantısı gönderdik.`,
        ipucu: 'Gelmediyse spam klasörüne bak.',
      });
      return;
    }

    // Giris, Google ve yeni sifre: oturum acildi, yapacak bir sey kalmadi.
    onKapat();
  }

  async function google() {
    setHata(null);
    const sonuc = await googleIleGiris();
    // Basariliysa sayfa zaten Google'a gitti; buraya yalnizca hata doner.
    if (!sonuc.oldu) setHata(sonuc.hata ?? 'Google ile girilemedi.');
  }

  const metinler: Record<Kip, { baslik: string; aciklama: string; dugme: string }> = {
    giris: {
      baslik: baslik ?? 'Tekrar hoş geldin',
      aciklama: aciklama ?? 'İlerlemen hesabında duruyor; kaldığın yerden devam edersin.',
      dugme: 'Giriş yap',
    },
    kayit: {
      baslik: baslik ?? 'İlerlemeni kaydet',
      aciklama:
        aciklama ??
        'Telefonunu değiştirsen de, tarayıcını temizlesen de kaldığın yerden devam edersin.',
      dugme: 'Hesap aç',
    },
    unuttum: {
      baslik: 'Şifreni mi unuttun?',
      aciklama: 'Adresini yaz, yeni şifre belirleme bağlantısı gönderelim.',
      dugme: 'Bağlantı gönder',
    },
    yeniSifre: {
      baslik: 'Yeni şifreni belirle',
      aciklama: 'Bundan sonra bu şifreyle gireceksin.',
      dugme: 'Şifreyi kaydet',
    },
    bilgi: {
      baslik: 'Seni tanıyalım',
      aciklama: 'Üyeliğin bununla tamamlanıyor. Otuz saniye sürer.',
      dugme: 'Tamamla',
    },
  };
  const m = metinler[kip];
  const sifreVar = kip === 'giris' || kip === 'kayit' || kip === 'yeniSifre';
  const epostaVar = kip === 'giris' || kip === 'kayit' || kip === 'unuttum';

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 px-5 pb-8 backdrop-blur-sm sm:items-center sm:pb-0"
      /*
        Disariya tiklayinca kapanir — ama YALNIZCA zemine. Kartin icinde
        baslayan bir secim hareketi disarida biterse pencere kapanmasin diye
        hedef kontrol ediliyor.
      */
      onMouseDown={(e) => {
        if (kapatilabilir && e.target === e.currentTarget) onKapat();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={m.baslik}
    >
      <div className="rise w-full max-w-md rounded-card bg-surface p-6 shadow-[var(--shadow-lift)]">
        {bitis ? (
          <>
            <p className="word text-xl font-extrabold">{bitis.baslik}</p>
            <p className="mt-2 text-sm text-ink-soft">{bitis.metin}</p>
            {bitis.ipucu && <p className="mt-3 text-xs text-ink-faint">{bitis.ipucu}</p>}
            <div className="mt-5">
              <Button variant="spark" onClick={onKapat}>
                Tamam
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={gonder}>
            <p className="word text-xl font-extrabold">{m.baslik}</p>
            <p className="mt-2 text-sm text-ink-soft">{m.aciklama}</p>

            {googleAcikMi() && (kip === 'giris' || kip === 'kayit') && (
              <>
                <button
                  type="button"
                  onClick={google}
                  className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-2xl border border-line bg-surface px-5 py-3.5 font-bold text-ink transition active:scale-[0.97]"
                >
                  <GoogleIsareti />
                  Google ile devam et
                </button>
                <div className="my-4 flex items-center gap-3 text-xs font-bold text-ink-faint">
                  <span className="h-px flex-1 bg-line" />
                  veya
                  <span className="h-px flex-1 bg-line" />
                </div>
              </>
            )}

            {kip === 'bilgi' && (
              <>
                <label className="mt-4 block">
                  <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                    Adın
                  </span>
                  <input
                    ref={alan}
                    type="text"
                    required
                    autoComplete="given-name"
                    value={ad}
                    onChange={(e) => setAd(e.target.value)}
                    placeholder="Adın"
                    className="mt-1.5 w-full rounded-2xl border border-line bg-sunken px-4 py-3 text-base text-ink outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/15"
                  />
                </label>

                <Secenekler
                  baslik="İngilizcen ne durumda?"
                  secenekler={SEVIYELER}
                  secili={seviye}
                  sec={setSeviye}
                />
                <Secenekler
                  baslik="Niçin öğreniyorsun?"
                  secenekler={HEDEFLER}
                  secili={hedef}
                  sec={setHedef}
                />
              </>
            )}

            {epostaVar && (
              <label className="mt-4 block first:mt-0">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                  E-posta
                </span>
                <input
                  ref={epostaVar ? alan : undefined}
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={eposta}
                  onChange={(e) => setEposta(e.target.value)}
                  placeholder="ornek@eposta.com"
                  className="mt-1.5 w-full rounded-2xl border border-line bg-sunken px-4 py-3 text-base text-ink outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/15"
                />
              </label>
            )}

            {sifreVar && (
              <label className="mt-3 block">
                <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                  Şifre
                </span>
                <span className="relative mt-1.5 block">
                  <input
                    ref={epostaVar ? undefined : alan}
                    type={sifreAcik ? 'text' : 'password'}
                    required
                    minLength={kip === 'giris' ? undefined : SIFRE_EN_AZ}
                    autoComplete={kip === 'giris' ? 'current-password' : 'new-password'}
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-line bg-sunken py-3 pl-4 pr-14 text-base text-ink outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/15"
                  />
                  <button
                    type="button"
                    onClick={() => setSifreAcik((v) => !v)}
                    className="absolute inset-y-0 right-0 px-4 text-xs font-bold text-ink-faint"
                    aria-label={sifreAcik ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  >
                    {sifreAcik ? 'Gizle' : 'Göster'}
                  </button>
                </span>
              </label>
            )}

            {(kip === 'kayit' || kip === 'yeniSifre') && (
              <p className="mt-2 text-xs text-ink-faint">En az {SIFRE_EN_AZ} karakter.</p>
            )}

            {hata && <p className="mt-3 text-sm text-[#c2417f]">{hata}</p>}

            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="spark" type="submit" disabled={gonderiliyor}>
                {gonderiliyor ? 'Gönderiliyor…' : m.dugme}
              </Button>
              {kapatilabilir && (
                <Button variant="ghost" onClick={onKapat}>
                  {kip === 'bilgi' ? 'Sonra doldururum' : 'Şimdi değil'}
                </Button>
              )}
            </div>

            {/* --- Kipler arasi gecisler --- */}
            {kip === 'giris' && (
              <div className="mt-4 flex flex-col items-center gap-1.5 text-sm">
                <span>
                  <Baglanti onClick={() => kipDegistir('unuttum')}>Şifremi unuttum</Baglanti>
                </span>
                <span className="text-ink-faint">
                  Hesabın yok mu?{' '}
                  <Baglanti onClick={() => kipDegistir('kayit')}>Hesap aç</Baglanti>
                </span>
              </div>
            )}
            {kip === 'kayit' && (
              <p className="mt-4 text-center text-sm text-ink-faint">
                Hesabın var mı? <Baglanti onClick={() => kipDegistir('giris')}>Giriş yap</Baglanti>
              </p>
            )}
            {kip === 'unuttum' && (
              <p className="mt-4 text-center text-sm">
                <Baglanti onClick={() => kipDegistir('giris')}>Girişe dön</Baglanti>
              </p>
            )}
            {kip === 'bilgi' && (
              <p className="mt-4 text-center text-xs text-ink-faint">
                Seviye ve hedefi sonra Ayarlar&apos;dan da değiştirebilirsin.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

/**
 * Tek secimli secenek grubu. Radyo dugmesi degil dokunulabilir hap:
 * telefonda 16 piksellik bir daireyi isaretlemek zor, hapin tamami hedef.
 */
function Secenekler<T extends string>({
  baslik,
  secenekler,
  secili,
  sec,
}: {
  baslik: string;
  secenekler: { deger: T; yazi: string }[];
  secili: T | null;
  sec: (d: T) => void;
}) {
  return (
    <div className="mt-4">
      <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">{baslik}</span>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {secenekler.map((o) => {
          const acik = secili === o.deger;
          return (
            <button
              key={o.deger}
              type="button"
              aria-pressed={acik}
              onClick={() => sec(o.deger)}
              className={`rounded-2xl border px-3.5 py-2 text-sm font-bold transition active:scale-[0.97] ${
                acik
                  ? 'border-spark bg-spark text-ink'
                  : 'border-line bg-sunken text-ink-soft'
              }`}
            >
              {o.yazi}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Baglanti({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-bold text-ink underline decoration-ink/25 underline-offset-4 transition active:opacity-60"
    >
      {children}
    </button>
  );
}

/** Google'in resmi renkli "G" isareti — marka kurallari baska bicime izin vermiyor. */
function GoogleIsareti() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A13.2 13.2 0 0 1 11 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}
