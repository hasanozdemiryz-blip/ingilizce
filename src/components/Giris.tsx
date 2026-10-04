import { useEffect, useRef, useState } from 'react';
import { Button } from './ui';
import { girisBaglantisiGonder } from '../uyelik';

/**
 * UYELIK — e-posta ile, sifresiz.
 *
 * Sifre yok: unutma, sifirlama akisi ve destek yuku getiriyor. Tek
 * kullanimlik baglanti bunlarin hicbirini getirmiyor ve kullanicinin
 * aklinda tutacagi bir sey kalmiyor.
 *
 * NEREDE CIKAR. Kapida DEGIL. Karsilama ve ilk ders uyeliksiz calisiyor;
 * bu sayfa ancak "haa" aninin ardindan, ilerlemeyi kaydetmek icin
 * aciliyor (bkz. SessionDone, Settings). Tanimadigi bir uygulamaya kimse
 * hesap acmiyor.
 *
 * Metin bu yuzden "kaydol" demiyor: kullaniciya ne kazandigini soyluyor
 * — ilerlemesinin kaybolmamasi.
 *
 * IKI BICIM. Telefonda alttan acilan sayfa (basparmak menzili), genis
 * ekranda ortada pencere. Once her yerde alttan aciliyordu; bilgisayarda
 * 1440 piksellik bir ekranin dibine yapisan kart yanlis duruyordu.
 */
export function Giris({
  onKapat,
  baslik = 'İlerlemeni kaydet',
  aciklama = 'Telefonunu değiştirsen de, tarayıcını temizlesen de kaldığın yerden devam edersin.',
}: {
  onKapat: () => void;
  baslik?: string;
  aciklama?: string;
}) {
  const [eposta, setEposta] = useState('');
  const [durum, setDurum] = useState<'form' | 'gonderiliyor' | 'gonderildi'>('form');
  const [hata, setHata] = useState<string | null>(null);
  const alan = useRef<HTMLInputElement>(null);

  /*
    Escape ile kapanma. Pencere acilinca odak e-posta alanina gidiyor:
    kullanicinin buraya gelme sebebi tek bir sey yazmak.
  */
  useEffect(() => {
    alan.current?.focus();
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKapat();
    };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  }, [onKapat]);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    if (durum === 'gonderiliyor') return;
    setHata(null);
    setDurum('gonderiliyor');
    const sonuc = await girisBaglantisiGonder(eposta);
    if (sonuc.oldu) {
      setDurum('gonderildi');
    } else {
      setHata(sonuc.hata ?? 'Bir şeyler ters gitti.');
      setDurum('form');
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 px-5 pb-8 backdrop-blur-sm sm:items-center sm:pb-0"
      /*
        Disariya tiklayinca kapanir — ama YALNIZCA zemine. Kartin icinde
        baslayan bir secim hareketi disarida biterse pencere kapanmasin
        diye hedef kontrol ediliyor.
      */
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onKapat();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={baslik}
    >
      <div className="rise w-full max-w-md rounded-card bg-surface p-6 shadow-[var(--shadow-lift)]">
        {durum === 'gonderildi' ? (
          /*
            Basari ekrani kapanmiyor ve "tamam" demiyor: kullanicinin
            yapacagi is burada bitmiyor, e-postasina gitmesi gerekiyor.
            Hangi adrese gonderildigini yaziyoruz — yanlis yazdiysa
            beklemesin.
          */
          <>
            <p className="word text-xl font-extrabold">Bağlantıyı gönderdik</p>
            <p className="mt-2 text-sm text-ink-soft">
              <b className="break-all">{eposta}</b> adresine bir giriş bağlantısı yolladık.
              Aç, dokun, geri dön — hepsi bu.
            </p>
            <p className="mt-3 text-xs text-ink-faint">
              Gelmediyse spam klasörüne bak. Birkaç dakika sürebiliyor.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="spark" onClick={onKapat}>
                Tamam
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setDurum('form');
                  setHata(null);
                }}
              >
                Başka adres kullan
              </Button>
            </div>
          </>
        ) : (
          <form onSubmit={gonder}>
            <p className="word text-xl font-extrabold">{baslik}</p>
            <p className="mt-2 text-sm text-ink-soft">{aciklama}</p>

            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                E-posta
              </span>
              <input
                ref={alan}
                id="giris-eposta"
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

            {/* Sifre istemedigimizi SOYLUYORUZ — beklenen alan yok, sasirmasin */}
            <p className="mt-2 text-xs text-ink-faint">
              Şifre yok. Sana tek kullanımlık bir giriş bağlantısı gönderiyoruz.
            </p>

            {hata && <p className="mt-3 text-sm text-[#c2417f]">{hata}</p>}

            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="spark" type="submit" disabled={durum === 'gonderiliyor'}>
                {durum === 'gonderiliyor' ? 'Gönderiliyor…' : 'Giriş bağlantısı gönder'}
              </Button>
              <Button variant="ghost" onClick={onKapat}>
                Şimdi değil
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
