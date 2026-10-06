import { useRef, useState } from 'react';
import { TAB_SPACE } from '../components/TabBar';
import { Avatar } from '../components/Avatar';
import { Button, Card, Ikon, Screen } from '../components/ui';
import { CARDS, LIMIT_CHOICES } from '../content';
import { olay, olcumHazirla, olcumVarMi, olcumuKapat } from '../analitik';
import { exportProgress, importProgress, resetAll, setState, tercihKaydet } from '../db';
import {
  HATIRLATMA_VARSAYILAN,
  hatirlatmayiKapat,
  hatirlatmayiKur,
  useHatirlatma,
} from '../reminder';
import { useTelaffuz } from '../speech';
import { HEDEFLER, SEVIYELER, etiket, hesabiSil, useUyelik, uyelikVarMi } from '../uyelik';
import { Giris } from '../components/Giris';
import { CikisOnayi } from '../components/Cikis';
import { ayriliyorIsaretle } from '../senkron';
import { DilSecici } from '../components/DilSecici';
import { GirisRozeti } from '../components/HesapMenusu';
import { DevPanel } from './DevPanel';
import type { AppState } from '../types';
import { dosyayiVer, paylasilabilir, telefonaKaydet, yedekAdi, yol } from '../dosya';
import { t } from '../dil';
import { karsilamaIzniniSil } from '../karsilama';
import { DAVET_METNI } from '../davet';

/**
 * AYARLAR.
 *
 * Once ayarlar Ilerleme sekmesinin dibinde, istatistiklerin arasinda
 * duruyordu — bir seyi degistirmek icin once grafiklerden gecmek
 * gerekiyordu. Kendi sekmesine alindi; Ilerleme artik saf profil.
 */
export function Settings({
  state,
  progress,
  onProfil,
}: {
  state: AppState;
  progress: unknown[];
  onProfil: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [sifirlaSoruluyor, setSifirlaSoruluyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [girisAcik, setGirisAcik] = useState(false);
  /*
    Sifre degistirme giris sayfasinin `yeniSifre` kipini yeniden kullaniyor.
    Ayri bir form yazmak ayni kurali (en az 8 karakter) ve ayni hata
    metinlerini ikinci kez tanimlamak olurdu.
  */
  const [sifreAcik, setSifreAcik] = useState(false);
  const [bilgiAcik, setBilgiAcik] = useState(false);
  /* Cikis onayi ortak pencerede (bkz. Cikis.tsx) — hesap menusuyle ayni. */
  const [cikisAcik, setCikisAcik] = useState(false);
  /*
    HESAP SILME. Cikistan ayri ve geri donusu YOK: cikista veri hesapta
    kaliyor, burada hesabin kendisi gidiyor. Onay bu yuzden iki asamali
    degil ama metin acik.
  */
  const [silmeDurum, setSilmeDurum] = useState<'kapali' | 'soruyor' | 'calisiyor'>('kapali');
  const [silmeHata, setSilmeHata] = useState<string | null>(null);
  /*
    Onay icin KELIME YAZDIRILIYOR. Geri donusu olmayan bir islemde tek bir
    dugme yetmiyor: yanlis dugmeye basmak bir saniyelik hata, hesabi
    kaybetmek kalici. Yazmak kullaniciyi bir an durduruyor ve ne yaptigini
    okutuyor — bankalardan GitHub'a kadar standart olan kalip bu.
  */
  const [silOnay, setSilOnay] = useState('');
  const SIL_SOZ = t('SİL');

  /*
    Cikista ve hesap silmede TANITIM SAYFASINA donuluyor, uygulama
    yenilenmiyor: ikisinden sonra da kullanicinin uygulamada isi yok ve
    karsisina karsilama akisi cikmasi "silinmedi mi?" izlenimi veriyordu.

    Tam yenileme sart — depo bosaldi, React'teki eski durumla devam etmek
    karma bir ekran birakirdi.

    Kok adres gelistirmede uygulamanin kendisi, uretimde tanitim sayfasi
    (uygulama `/ingilizce/` altinda). Gelistirmede davranis yenilemeye
    esdeger oluyor, bir sey bozulmuyor.
  */
  const anaSayfayaDon = () => {
    karsilamaIzniniSil();
    // `replace`: geri tusu bosaltilmis uygulamaya (karsilamaya) donmesin
    window.location.replace('/');
  };

  async function hesabiKaldir() {
    setSilmeDurum('calisiyor');
    setSilmeHata(null);
    const sonuc = await hesabiSil();
    if (!sonuc.oldu) {
      setSilmeHata(sonuc.hata ?? t('Hesap silinemedi.'));
      setSilmeDurum('soruyor');
      return;
    }
    // Hesap gitti; cihazdaki kopya da gitmeli.
    ayriliyorIsaretle();
    await resetAll();
    anaSayfayaDon();
  }

  const { uye } = useUyelik();

  /**
   * Yedek paylas menusune verilebiliyor mu. Yalnizca METIN degistiriyor:
   * menu acilacaksa "Yedekle", dosya inecekse "Yedek al" demek dogru.
   * Kabuk render sirasinda degismedigi icin state'e gerek yok.
   */
  const paylasSecenegi = paylasilabilir();

  /**
   * Telefona dogrudan kaydetme yalnizca native kabukta var — tarayicide
   * "Belgeler" diye bir klasor yok. `yol()` blob'suz cagrilinca native
   * kabugu dogru soyluyor (bkz. dosya.ts).
   */
  const telefonSecenegi = yol() === 'native';
  const sesVar = useTelaffuz();
  const hatirlatmaVarMi = useHatirlatma();

  /**
   * Ayari SONUCA gore yaziyoruz: izin verilmezse anahtar acik gorunup
   * hicbir sey yapmamali.
   */
  async function hatirlatmayiAyarla(saat: number | null, dakika = 0) {
    /*
      Ayni deger iki kez gelirse hicbir sey yapma.

      Android'in saat secicisi `change`i IKI KEZ gonderiyor — uretimdeki
      olcumde goruldu: ayni saniyede iki `hatirlatma_degisti`, ayni veri.
      Zarar olcumle sinirli degil, bildirim de iki kez kuruluyordu.
    */
    const ayni = saat === state.reminderHour && (saat === null || dakika === (state.reminderMinute ?? 0));
    if (ayni) return;

    olay('hatirlatma_degisti', { saat: saat ?? 'kapali', dakika });
    if (saat === null) {
      await hatirlatmayiKapat();
      await tercihKaydet({ reminderHour: null });
      return;
    }
    if (await hatirlatmayiKur(saat, dakika))
      await tercihKaydet({ reminderHour: saat, reminderMinute: dakika });
  }

  return (
    <Screen>
      <header className="flex items-center h-14 shrink-0">
        <span className="word text-lg font-bold">{t('Ayarlar')}</span>
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        {/*
          Gunluk hedef GERCEK bir sinir, oneri degil. Tavani asmak ertesi
          gun kaldirilamayan bir tekrar yigini demek — o yuzden 15'in
          ustunde secenek yok.
        */}
        {/*
          PROFIL — en ustte, cunku "benim" olan tek kart bu.
          "Hesap" DEMIYOR: e-posta, sifre, giris yok. Hesap dendiginde
          insanlar verilerinin bulutta oldugunu sanip yedek almayi birakir.
        */}
        {state.profil && (
          <button
            onClick={onProfil}
            className="rise rounded-card bg-surface p-5 shadow-[var(--shadow-soft)] text-left transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-4">
              <Avatar avatar={state.profil.avatar} cerceve={state.profil.cerceve} boyut="md" />
              <span className="min-w-0 flex-1">
                <span className="word block text-lg font-extrabold truncate">
                  {state.profil.ad}
                </span>
                <span className="block text-sm text-ink-soft mt-0.5">
                  {uye ? t('Resmini ve çerçeveni seç') : t('Adını ve resmini değiştir')}
                </span>
              </span>
              <span className="text-xl text-ink-faint shrink-0">›</span>
            </div>
          </button>
        )}

        {/*
          HESAP. Uyelik yapilandirmasi yoksa satir hic acilmiyor — telaffuz
          ve hatirlatmadaki kural: calismayan bir anahtar gostermektense hic
          gostermemek. Giris KAPIDA degil; buradan ya da ilk ders sonrasindan
          yapiliyor.
        */}
        {uyelikVarMi() && (
          <Card className="rise">
            <h2 className="text-sm font-bold text-ink-soft mb-1">{t('Hesap')}</h2>
            {uye ? (
              <>
                <GirisRozeti uye={uye} />
                <p className="text-sm text-ink-soft mt-1 mb-1">
                  <b className="break-all">{uye.eposta}</b>{' '}{t('· İlerlemen hesabında saklanıyor.')}
                </p>
                <div className="mb-3">
                  <Satir ad={t('Ad')} deger={uye.bilgi?.ad ?? '—'} />
                  <Satir ad={t('Seviye')} deger={etiket(SEVIYELER, uye.bilgi?.seviye) ?? '—'} />
                  <Satir ad={t('Hedef')} deger={etiket(HEDEFLER, uye.bilgi?.hedef) ?? '—'} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Kucuk onClick={() => setBilgiAcik(true)}>{t('Bilgilerimi düzenle')}</Kucuk>
                  {/* Google ile girenin sifresi yok; dugme kafa karistiriyordu */}
                  {uye.saglayici !== 'google' && (
                    <Kucuk onClick={() => setSifreAcik(true)}>{t('Şifre değiştir')}</Kucuk>
                  )}
                  {/*
                    CIKIS BURADA, hesabin yaninda. Once sayfanin dibinde,
                    "Hesabi sil"in yaninda ve kirmiziydi; kullanici "cikis cok
                    zor" dedi. Ayni is ust menude de var (avatar).
                  */}
                  <Kucuk onClick={() => setCikisAcik(true)}>{t('Çıkış yap')}</Kucuk>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-soft mb-3">
                  {DAVET_METNI}
                </p>
                <Kucuk onClick={() => setGirisAcik(true)}>{t('Giriş yap')}</Kucuk>
              </>
            )}
          </Card>
        )}

        <Card className="rise delay-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-ink-soft">Dil · Language</h2>
            <DilSecici />
          </div>
        </Card>

        <Card className="rise delay-1">
          <h2 className="text-sm font-bold text-ink-soft mb-1">{t('Günlük hedef')}</h2>
          <p className="text-sm text-ink-soft mb-3">
            {t('Günde kaç yeni kelime öğrenmek istersin? Yeni kelimeler her gece 00:00\'da gelir.')}
          </p>
          <div className="flex gap-2">
            {LIMIT_CHOICES.map((n) => {
              const secili = state.dailyLimit === n;
              return (
                <button
                  key={n}
                  onClick={() => void tercihKaydet({ dailyLimit: n })}
                  className={`flex-1 rounded-2xl px-3 py-4 transition-all active:scale-95 ${
                    secili
                      ? 'bg-brand text-white shadow-[0_8px_18px_-8px_rgba(79,146,246,0.85)]'
                      : 'bg-sunken text-ink'
                  }`}
                >
                  <span className="word block text-2xl font-extrabold tabular-nums">{n}</span>
                  <span className="block text-xs mt-0.5 opacity-80">{t('kelime')}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {sesVar && (
          <Card className="rise delay-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t('Telaffuz sesi')}</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {t('Cevap açılınca kendiliğinden çalsın. Kapalıyken')}{' '}
                  <Ikon ad="ses" className="inline-block h-4 w-4 align-text-bottom" />{' '}{t('ile dinleyebilirsin.')}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={state.sound}
                aria-label={t('Telaffuz sesi')}
                onClick={() => void tercihKaydet({ sound: !state.sound })}
                className={`shrink-0 h-8 w-14 rounded-full p-1 transition-colors ${
                  state.sound ? 'bg-grow' : 'bg-line'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform ${
                    state.sound ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </Card>
        )}

        {/*
          Gunluk hatirlatma — yalnizca native kabukta (APK).
          Tarayicida bir PWA kapaliyken kendi kendine bildirim gonderemez;
          sunucu ister. Motor yoksa satir hic acilmiyor (bkz. reminder.ts).
        */}
        {hatirlatmaVarMi && (
          <Card className="rise delay-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t('Günlük hatırlatma')}</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {t('Seçtiğin saatte kısa bir bildirim. Kaçırırsan bir şey olmaz.')}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={state.reminderHour !== null}
                aria-label={t('Günlük hatırlatma')}
                onClick={() =>
                  void hatirlatmayiAyarla(
                    state.reminderHour === null ? HATIRLATMA_VARSAYILAN.saat : null,
                    state.reminderHour === null ? HATIRLATMA_VARSAYILAN.dakika : 0,
                  )
                }
                className={`shrink-0 h-8 w-14 rounded-full p-1 transition-colors ${
                  state.reminderHour !== null ? 'bg-grow' : 'bg-line'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform ${
                    state.reminderHour !== null ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {state.reminderHour !== null && (
              /*
                Dort sabit saat (9/13/19/21) yerine serbest secim.
                `type="time"` bilerek: Android WebView burada SISTEMIN kendi
                saat secicisini aciyor — kendi carkimizi cizmek hem daha
                kotu calisirdi hem cihazin 12/24 saat tercihini bilmezdi.
              */
              <label className="mt-4 flex items-center justify-between gap-3">
                <span className="text-sm text-ink-soft">{t('Saat')}</span>
                <input
                  type="time"
                  value={`${String(state.reminderHour).padStart(2, '0')}:${String(
                    state.reminderMinute ?? 0,
                  ).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [sa, dk] = e.target.value.split(':').map(Number);
                    // Bos birakilirsa tarayici "" donduruyor; NaN ile kurmayalim.
                    if (Number.isInteger(sa) && Number.isInteger(dk)) {
                      void hatirlatmayiAyarla(sa, dk);
                    }
                  }}
                  className="bg-sunken text-ink rounded-2xl px-4 py-3 text-base font-bold tabular-nums"
                />
              </label>
            )}
          </Card>
        )}

        {/*
          OLCUM ANAHTARI — yalnizca yapilandirilmissa gorunur.
          Yapilandirma yoksa (gelistirme, depoyu klonlayan) hicbir sey
          gonderilmiyor; olmayan bir seyi kapatan anahtar gostermek yanlis
          olurdu (telaffuz ve hatirlatma da ayni kurali izliyor).
        */}
        {olcumVarMi() && (
          <Card className="rise delay-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t('Kullanım istatistikleri')}</p>
                <p className="text-sm text-ink-soft mt-0.5">
                  {t('Hangi ekranların kullanıldığını anonim olarak ölçeriz. Adın, fotoğrafın ve cevapların')}{' '}<b>{t('gönderilmez')}</b>.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={state.olcum !== false}
                aria-label={t('Kullanım istatistikleri')}
                onClick={() => {
                  const yeni = state.olcum === false;
                  void tercihKaydet({ olcum: yeni });
                  if (yeni) olcumHazirla(true, state.profil?.id);
                  else olcumuKapat();
                }}
                className={`shrink-0 h-8 w-14 rounded-full p-1 transition-colors ${
                  state.olcum !== false ? 'bg-grow' : 'bg-line'
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white shadow-[var(--shadow-soft)] transition-transform ${
                    state.olcum !== false ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </Card>
        )}

        {/*
          VERILERIM yalnizca UYESIZ kullaniciya.

          Uye icin bu bolum hem gereksiz hem YANILTICI: "Sifirla" cihazi
          temizler, sonraki senkron her seyi sunucudan geri getirir ve
          kullanici neden silinmedigini anlamaz. Uyenin karsiligi Hesap
          bolumunde: "Cikis yap" cihazi temizler, "Hesabi sil" her seyi
          siler.

          Uyesizde ise tek koruma bu — ilerlemesi yalnizca cihazda ve
          yedek almazsa kaybolur.
        */}
        {!uye && (
          <Card className="rise delay-2">
            <h2 className="text-sm font-bold text-ink-soft mb-1">{t('Verilerim')}</h2>
            <p className="text-sm text-ink-soft mb-3">
              {t('İlerleme, profilin ve fotoğrafın yalnızca bu cihazda tutuluyor. Taşımak veya korumak için yedekle.')}
              {paylasSecenegi &&
                ` ${t("Açılan menüden Drive'a, e-postaya ya da istediğin yere gönderebilirsin.")}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {telefonSecenegi && (
                <Kucuk
                  onClick={() => {
                    setHata(null);
                    void telefonaYedekle(state.profil?.ad)
                      .then((nereye) => setBilgi(`Kaydedildi: ${nereye}`))
                      .catch(() => setHata(t('Telefona kaydedilemedi.')));
                  }}
                >
                  {t('Telefona kaydet')}
                </Kucuk>
              )}
              <Kucuk
                onClick={() => {
                  setBilgi(null);
                  void disaAktar(state.profil?.ad);
                }}
              >
                {telefonSecenegi ? t('Paylaş') : paylasSecenegi ? t('Yedekle') : t('Yedek al')}
              </Kucuk>
              <Kucuk onClick={() => fileRef.current?.click()}>{t('Geri yükle')}</Kucuk>
              <Kucuk tehlike onClick={() => setSifirlaSoruluyor(true)}>
                {t('Sıfırla')}
              </Kucuk>
            </div>
            {hata && <p className="text-sm text-[#c2417f] mt-3">{hata}</p>}
            {bilgi && <p className="text-sm text-ink-soft mt-3 break-all">{bilgi}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void iceAktar(f).catch(() => setHata(t('Yedek dosyası okunamadı.')));
              }}
            />
          </Card>
        )}

        {/*
          OTURUM ISLEMLERI EN ALTTA ve kirmizi.

          Ikisi de geri donusu olan islemler degil: cikis cihazi temizler,
          silme hesabi bitirir. Ayarlarin ortasinda, gunluk hedefin yaninda
          durmalari yanlisti — yanlislikla basilabilecek yerde olmamalilar.
        */}
        <Card className="rise delay-3">
          <h2 className="text-sm font-bold text-ink-soft mb-2">{t('Hakkında')}</h2>
          <Satir ad={t('Toplam kelime')} deger={String(CARDS.length)} />
          <Satir ad={t('Öğrendiğin')} deger={String(progress.length)} />
          <Satir ad={t('Sürüm')} deger={__APP_VERSION__} />
        </Card>

        {/*
          YASAL — en altta, cunku aranan bir sey degil ama BULUNABILIR
          olmasi gerekiyor. Play ve App Store gizlilik metnine uygulama
          icinden erisilmesini bekliyor.

          Metinler sitenin kendi sayfalarinda (site/yasal/, tools/site.mjs):
          ayni menu ve footer'la, "ayri bir site" gibi durmadan. Mutlak
          adres, cunku uygulama `/ingilizce/` altinda, site kokte.
        */}
        <Card className="rise delay-3">
          <h2 className="text-sm font-bold text-ink-soft mb-2">{t('Yasal ve iletişim')}</h2>
          <div className="flex flex-col">
            {[
              ['https://hafizada.com/gizlilik/', t('Gizlilik Politikası')],
              ['https://hafizada.com/kullanim-kosullari/', t('Kullanım Koşulları')],
              ['https://hafizada.com/kvkk/', t('KVKK Aydınlatma Metni')],
              ['https://hafizada.com/iletisim/', t('İletişim')],
            ].map(([adres, ad]) => (
              <a
                key={adres}
                href={adres}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-2.5 text-sm transition-opacity active:opacity-60"
              >
                <span className="font-semibold">{ad}</span>
                <span className="text-ink-faint">↗</span>
              </a>
            ))}
          </div>
        </Card>

        {/*
          HESAP SILME en altta ve kucuk. Once "Cikis yap"in hemen yanindaydi —
          geri donusu olan islemle olmayani yan yana koymak yanlis dugmeye
          basmayi davet ediyordu.
        */}
        {uye && (
          <button
            onClick={() => setSilmeDurum('soruyor')}
            className="mx-auto mt-1 px-3 py-2 text-xs font-bold text-ink-faint underline-offset-2 transition hover:text-[#c2417f] hover:underline"
          >
            {t('Hesabımı kalıcı olarak sil')}
          </button>
        )}

        {import.meta.env.DEV && <DevPanel />}
      </div>

      {/*
        Silme onayi kart ici. Tarayicinin `confirm()` kutusu PWA'da
        bloklayan bir sistem diyalogu; akisi donduruyor ve uygulamanin
        diline hic benzemiyor.
      */}
      {girisAcik && <Giris onKapat={() => setGirisAcik(false)} />}
      {sifreAcik && <Giris baslangicKip="yeniSifre" onKapat={() => setSifreAcik(false)} />}
      {bilgiAcik && <Giris baslangicKip="bilgi" onKapat={() => setBilgiAcik(false)} />}

      {silmeDurum !== 'kapali' && (
        <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-ink/45 px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-8 backdrop-blur-sm sm:items-center sm:pt-0 sm:pb-0">
          <Card className="rise w-full max-w-md p-6">
            <p className="word text-xl font-extrabold text-[#c2417f]">
              {t('Hesabını kalıcı olarak sil')}
            </p>
            <p className="mt-2 text-sm font-bold text-ink">
              {t('Bu işlemin geri dönüşü yok. Silinen hiçbir şey kurtarılamaz.')}
            </p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-ink-soft">
              <li>{t('• Öğrendiğin bütün kelimeler ve ilerlemen')}</li>
              <li>{t('• Serin ve bütün çalışma geçmişin')}</li>
              <li>{t('• Hesabın, e-posta adresin ve bilgilerin')}</li>
              <li>{t('• Bu cihazdaki kayıtlar')}</li>
            </ul>
            <p className="mt-3 text-sm text-ink-soft">
              {t('Vazgeçersen Çıkış yap da seçebilirsin; o zaman hesabın durur, yalnızca bu cihaz temizlenir.')}
            </p>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">
                {t('Onaylamak için {soz} yaz', { soz: SIL_SOZ })}
              </span>
              <input
                type="text"
                autoComplete="off"
                value={silOnay}
                onChange={(e) => setSilOnay(e.target.value)}
                placeholder={SIL_SOZ}
                className="mt-1.5 w-full rounded-2xl border border-line bg-sunken px-4 py-3 text-base text-ink outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/15"
              />
            </label>
            {silmeHata && <p className="mt-3 text-sm text-[#c2417f]">{silmeHata}</p>}
            <div className="mt-5 flex flex-col gap-2.5">
              <Button
                variant="spark"
                onClick={() => {
                  setSilmeDurum('kapali');
                  setSilOnay('');
                  setSilmeHata(null);
                }}
              >
                {t('Vazgeç, hesabım kalsın')}
              </Button>
              <Button
                variant="ghost"
                disabled={silmeDurum === 'calisiyor' || silOnay.trim() !== SIL_SOZ}
                onClick={() => void hesabiKaldir()}
              >
                {silmeDurum === 'calisiyor' ? t('Siliniyor…') : t('Hesabı kalıcı olarak sil')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {cikisAcik && <CikisOnayi onKapat={() => setCikisAcik(false)} />}

      {sifirlaSoruluyor && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 px-5 pb-8 backdrop-blur-sm">
          <div className="rise w-full max-w-md rounded-card bg-white p-6 shadow-[var(--shadow-lift)]">
            <p className="word text-xl font-extrabold">{t('Her şey silinecek')}</p>
            <p className="text-sm text-ink-soft mt-2">
              {t('Öğrendiğin {n} kelime, serin ve tüm geçmişin silinir. Bu geri alınamaz — önce yedek almak istersen şimdi iyi bir an.', { n: progress.length })}
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="brand" onClick={() => setSifirlaSoruluyor(false)}>
                {t('Vazgeç')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setSifirlaSoruluyor(false);
                  /*
                    Ilerleme sifirlaniyor, kullanici UYGULAMADA kaliyor:
                    karsilama (snake) yalnizca "Hemen basla"ya ait (bkz.
                    karsilama.ts). Ilk ders ana ekranda bekliyor.
                  */
                  const { dailyLimit } = state;
                  void resetAll().then(() => setState({ onboarded: true, dailyLimit }));
                }}
              >
                {t('Evet, sıfırla')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}


async function disaAktar(profilAdi?: string) {
  const blob = new Blob([await exportProgress()], { type: 'application/json' });
  const { yol, verildi } = await dosyayiVer(blob, yedekAdi(profilAdi), t('Hafızada İngilizce yedeği'));
  // Iptal eden kullanici yedek ALMAMISTIR; olay yalnizca dosya gercekten
  // verildiginde yaziliyor. `yol` ise "Android'de paylas menusu aciliyor mu"
  // sorusunu tek bir cihazdan degil, kullanimdan cevapliyor.
  if (verildi) olay('yedek_alindi', { yol });
}

async function telefonaYedekle(profilAdi?: string): Promise<string> {
  const blob = new Blob([await exportProgress()], { type: 'application/json' });
  const nereye = await telefonaKaydet(blob, yedekAdi(profilAdi));
  olay('yedek_alindi', { yol: 'telefon' });
  return nereye;
}

async function iceAktar(file: File) {
  await importProgress(await file.text());
  // Basarili olunca: hatali dosya `importProgress` icinde patliyor ve
  // cagiran taraf hatayi yakaliyor, yani buraya ancak yuklenmis yedek gelir.
  olay('yedek_yuklendi');
}

function Kucuk({
  children,
  onClick,
  tehlike,
}: {
  children: React.ReactNode;
  onClick: () => void;
  tehlike?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-bold transition-all active:scale-95 ${
        tehlike ? 'bg-blush-soft text-[#c2417f]' : 'bg-sunken text-ink'
      }`}
    >
      {children}
    </button>
  );
}

function Satir({ ad, deger }: { ad: string; deger: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-ink-soft">{ad}</span>
      <span className="font-bold tabular-nums">{deger}</span>
    </div>
  );
}
