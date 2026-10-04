import { useState } from 'react';
import { Button, Card } from './ui';
import { girisBaglantisiGonder } from '../uyelik';

/**
 * GIRIS SAYFASI — e-posta ile, sifresiz.
 *
 * Sifre yok: unutma, sifirlama akisi ve destek yuku getiriyor. Tek
 * kullanimlik baglanti bunlarin hicbirini getirmiyor ve kullanicinin
 * aklinda tutacagi bir sey kalmiyor.
 *
 * NEREDE CIKAR. Kapida DEGIL. Karsilama ve ilk ders uyeliksiz calisiyor;
 * bu ekran ancak "haa" aninin ardindan, ilerlemeyi kaydetmek icin
 * aciliyor. Tanimadigi bir uygulamaya kimse hesap acmiyor.
 *
 * Metin bu yuzden "kaydol" demiyor: kullaniciya ne kazandigini soyluyor
 * — ilerlemesinin kaybolmamasi.
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
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 px-5 pb-8 backdrop-blur-sm">
      <Card className="rise w-full max-w-md p-6">
        {durum === 'gonderildi' ? (
          /*
            Basari ekrani kapanmiyor ve "tamam" demiyor: kullanicinin
            yapacagi is burada bitmiyor, e-postasina gitmesi gerekiyor.
            Hangi adrese gonderildigini yaziyoruz — yanlis yazdiysa
            beklemesin.
          */
          <>
            <p className="word text-xl font-extrabold">Bağlantıyı gönderdik</p>
            <p className="text-sm text-ink-soft mt-2">
              <b className="break-all">{eposta}</b> adresine bir giriş bağlantısı yolladık.
              Aç, dokun, geri dön — hepsi bu.
            </p>
            <p className="text-xs text-ink-faint mt-3">
              Gelmediyse spam klasörüne bak. Birkaç dakika sürebiliyor.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="brand" onClick={onKapat}>
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
            <p className="text-sm text-ink-soft mt-2">{aciklama}</p>

            <label className="block mt-4">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                E-posta
              </span>
              <input
                id="giris-eposta"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={eposta}
                onChange={(e) => setEposta(e.target.value)}
                placeholder="ornek@eposta.com"
                className="mt-1.5 w-full rounded-2xl bg-sunken px-4 py-3 text-base text-ink outline-none focus:ring-2 focus:ring-brand"
              />
            </label>

            {/* Sifre istemedigimizi SOYLUYORUZ — beklenen alan yok, sasirmasin */}
            <p className="text-xs text-ink-faint mt-2">
              Şifre yok. Sana tek kullanımlık bir giriş bağlantısı gönderiyoruz.
            </p>

            {hata && <p className="text-sm text-[#c2417f] mt-3">{hata}</p>}

            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="brand" type="submit" disabled={durum === 'gonderiliyor'}>
                {durum === 'gonderiliyor' ? 'Gönderiliyor…' : 'Giriş bağlantısı gönder'}
              </Button>
              <Button variant="ghost" onClick={onKapat}>
                Şimdi değil
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
