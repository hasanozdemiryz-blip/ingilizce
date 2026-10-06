import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { olcumHazirla, olay } from './analitik';
import { profilSagla } from './db';
import { geriHazirla } from './geri';
import { hatirlatmaHazirla } from './reminder';
import { telaffuzHazirla } from './speech';
import { uyelikHazirla } from './uyelik';

/**
 * Ilerleme yalnizca IndexedDB'de. Tarayicilar "best-effort" depolamayi
 * yer sikisinca — Safari'de 7 gun kullanilmayinca kosulsuz — silebiliyor.
 * Seri odakli bir uygulamada tatilden donen kullanicinin her seyini
 * kaybetmesi demek bu. persist() kaliciya cevirmeyi ister; verilmezse
 * hicbir sey bozulmaz, yedek alma zaten duruyor.
 */
void navigator.storage?.persist?.().catch(() => {});

/**
 * "Hafizada Ingilizce'yi yukle" bildirimi CIKMASIN.
 *
 * Manifest uygulamayi yuklenebilir kiliyor; Android Chrome da bunu gorunce
 * kendiliginden alttan bir yukleme seridi aciyordu. Kullanici istemedi:
 * sebebi belirsiz, araya giren bir bildirim. Olayi durdurmak seridi
 * kapatiyor; tarayici menusundeki "Ana ekrana ekle" yine calisiyor.
 */
window.addEventListener('beforeinstallprompt', (e) => e.preventDefault());

/**
 * Native kabukta (APK) tarayicinin ses sentezi YOK; cihazin TTS motoru
 * kopru uzerinden aranir. Web'de hemen doner, hicbir sey geciktirmez.
 * Bkz. speech.ts — motor bulununca arayuz kendiliginden acilir.
 */
void telaffuzHazirla();

/**
 * Gunluk hatirlatma da yalnizca native kabukta var; web'de bu cagri
 * hemen doner (bkz. reminder.ts).
 */
void hatirlatmaHazirla();

/**
 * Yerel profil ILK ACILISTA kendiliginden olusur — kullaniciya "adin ne"
 * diye sorulmaz. Kayit duvari yeni bir uygulamanin en pahali ekranidir;
 * isteyen Ayarlar'dan degistirir, istemeyen hic fark etmez.
 */
void profilSagla().then((state) => {
  /*
    Olcum profil KURULDUKTAN sonra basliyor: kullanici kimligi olarak
    `Profil.id` veriliyor — rastgele, kisisel veri degil, ve kullaniciyi
    disarida hicbir seye baglamiyor (bkz. analitik.ts).
  */
  olcumHazirla(state.olcum !== false, state.profil?.id);
  olay('uygulama_acildi');
});

// Donanim geri tusu — yalnizca native kabukta (bkz. geri.ts)
void geriHazirla();

/**
 * YENI SURUME GECIS.
 *
 * Servis calisani `autoUpdate` ile kuruluyor: yeni paket arkada iniyor ve
 * etkinlesiyor. Ama ACIK olan sayfa eski JavaScript'i calistirmaya devam
 * ediyor — kullanici yenilemedikce yeni surumu hic gormuyor.
 *
 * Bu teorik bir sorun degil: tanitim sayfasina `?giris=1` eklendikten
 * sonra sunucudaki paket dogru oldugu halde kullanici eski pakette kaldi
 * ve baglanti ise yaramadi. Hata kodda degil, surumde.
 *
 * `controllerchange` yeni calisan devrali alinca atiyor. Dinleyici
 * YALNIZCA zaten bir calisan varken kuruluyor: ilk ziyarette calisan
 * sifirdan kuruldugu icin olay yine atar ve sayfa gereksiz yere
 * yenilenirdi.
 */
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  let yenilendi = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (yenilendi) return;
    yenilendi = true;
    location.reload();
  });
}

/**
 * Uyelik durumu. SDK yalnizca GEREKIRSE iniyor — depoda oturum varsa ya da
 * giris baglantisindan donulduyse. Ilk kez gelen ziyaretciye tek bayt
 * inmiyor (bkz. uyelik.ts).
 */
void uyelikHazirla();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
