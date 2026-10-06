import { useEffect } from 'react';

/**
 * KLAVYE ACILINCA EKRAN DARALSIN MI.
 *
 * `interactive-widget=resizes-content` sayfanin tamamina yaziliydi: telefonda
 * klavye acilinca TUM ekran klavyenin ustune sikisiyordu. Profil adi, giris
 * formu gibi yerlerde ekran ortadan bolunmus gibi kaliyordu.
 *
 * Bu davranis yalnizca DERSTEKI YAZMA SORULARINDA isteniyor: orada soru ve
 * yazma kutusu klavyenin ustunde, birlikte gorunmeli (bkz. Runner,
 * CardFace'teki kisa ekran kurallari). Geri kalan her yerde tarayicinin
 * varsayilani (`resizes-visual`): klavye sayfanin USTUNE acilir, sayfa
 * boyutu degismez.
 *
 * Chrome meta etiketindeki degisikligi canli okuyor; Safari bu ayari hic
 * tanimiyor, orada bir sey degismiyor.
 */
const TABAN = 'width=device-width, initial-scale=1.0, viewport-fit=cover';

function ayarla(daralsin: boolean): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
  if (!meta) return;
  meta.content = daralsin ? `${TABAN}, interactive-widget=resizes-content` : TABAN;
}

/** Bilesen ekrandayken (ve `aktif` iken) klavye icerigi daraltir. */
export function useKlavyeDaraltsin(aktif = true): void {
  useEffect(() => {
    if (!aktif) return;
    ayarla(true);
    return () => ayarla(false);
  }, [aktif]);
}
