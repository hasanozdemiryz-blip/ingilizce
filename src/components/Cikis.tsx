import { useState } from 'react';
import { olay } from '../analitik';
import { cikisVeTemizle } from '../senkron';
import { Button, Card } from './ui';

/**
 * CIKIS ONAYI — hesap menusunden de Ayarlar'dan da ayni pencere.
 *
 * Cikis bir sure Ayarlar'in en dibinde, "Hesabi sil"in yaninda ve kirmizi
 * duruyordu; onayda da birincil dugme "Vazgec"ti. Kullanici "cikis cok zor"
 * dedi. Simdi iki dokunus: menu, "Cikis yap". Onayda birincil dugme cikisin
 * kendisi — geri donusu olan bir islem, veri hesapta duruyor.
 *
 * Tek istisna senkron tutmadiginda: o zaman son ilerleme kaybolabilir,
 * pencere bunu soyler ve karari kullaniciya birakir (bkz. senkron.ts).
 *
 * Cikista TANITIM SAYFASINA donuluyor ve tam yenileme yapiliyor: depo
 * bosaldi, React'teki eski durumla devam etmek karma bir ekran birakirdi.
 * Gelistirmede kok adres uygulamanin kendisi; davranis yenilemeye esdeger.
 */
export function CikisOnayi({ onKapat }: { onKapat: () => void }) {
  const [durum, setDurum] = useState<'soruyor' | 'calisiyor' | 'senkronYok'>('soruyor');

  async function cik(zorla = false) {
    setDurum('calisiyor');
    const sonuc = await cikisVeTemizle(zorla);
    if (sonuc === 'senkronOlmadi') {
      setDurum('senkronYok');
      return;
    }
    olay('cikis_yapildi');
    window.location.href = '/';
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-ink/45 px-5 pb-8 backdrop-blur-sm sm:items-center sm:pb-0"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && durum !== 'calisiyor') onKapat();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Çıkış"
    >
      <Card className="rise w-full max-w-md p-6">
        {durum === 'senkronYok' ? (
          <>
            <p className="word text-xl font-extrabold">Bağlanamadık</p>
            <p className="mt-2 text-sm text-ink-soft">
              Son ilerlemen hesabına <b>gönderilemedi</b>. Şimdi çıkarsan o kısım kaybolur.
              İnternetin gelince tekrar dene.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="spark" onClick={onKapat}>
                Vazgeç
              </Button>
              <Button variant="ghost" onClick={() => void cik(true)}>
                Yine de çık
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="word text-xl font-extrabold">Çıkış yapılsın mı?</p>
            <p className="mt-2 text-sm text-ink-soft">
              İlerlemen hesabında kalır, tekrar girince geri gelir.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button
                variant="primary"
                disabled={durum === 'calisiyor'}
                onClick={() => void cik()}
              >
                {durum === 'calisiyor' ? 'Çıkılıyor…' : 'Çıkış yap'}
              </Button>
              <Button variant="ghost" disabled={durum === 'calisiyor'} onClick={onKapat}>
                Vazgeç
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
