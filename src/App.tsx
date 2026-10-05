import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { olay } from './analitik';
import { TabBar, type Tab } from './components/TabBar';
import {
  AGIR_TEKRAR,
  AHEAD_BATCH,
  DAILY_REVIEW_CAP,
  ogrenilenKancalar,
  setBittiMi,
  setteOlanlar,
} from './content';
import { db, getState, setState, tercihKaydet } from './db';
import {
  aheadQueue,
  dueQueue,
  introducedToday,
  nextBatch,
  spareCards,
  remainingToday,
  todaysCards,
} from './scheduler';
import { Home } from './screens/Home';
import { Lesson } from './screens/Lesson';
import { Practice } from './screens/Practice';
import { ProgressScreen } from './screens/Progress';
import { SessionDone } from './screens/SessionDone';
import { Welcome } from './screens/Welcome';
import { Settings } from './screens/Settings';
import { ProfilDuzenle } from './screens/ProfilDuzenle';
import { Giris } from './components/Giris';
import { oturumVarGibi, sifirlamaDonusuMu, useUyelik, uyeOku, uyelikVarMi } from './uyelik';
import { senkronla } from './senkron';
import { gecerliCerceve, type Kazanim } from './cerceveler';
import { uygulamadanCik, useGeri } from './geri';
// `Card` adi types.ts'teki KART tipiyle cakisiyor; arayuz bileseni takma adla.
import { Button, Card as Kutu } from './components/ui';
import { profilDuzelt } from './profil';
import { Splash } from './screens/Splash';
import { useToday } from './today';
import { WordList } from './screens/WordList';
import type { Card, Progress } from './types';

/** Sekmeli ekranlarin disindaki akis — alt menu burada gizli. */
type Flow =
  | {
      name: 'ders';
      yeni: Card[];
      /** "Biliyorum" denince yerine kayacak kartlar */
      yedek: Card[];
      tekrar: Progress[];
      eslestirmesiz?: boolean;
      tekrarOnce?: boolean;
    }
  | {
      name: 'done';
      count: number;
      streak: number;
      dogru: number;
      toplam: number;
      ilerleyen: number;
      yeni: number;
    }
  | { name: 'kelimeler' }
  | { name: 'profil' }
  | null;

export default function App() {
  const [tab, setTab] = useState<Tab>('ogren');
  const [flow, setFlow] = useState<Flow>(null);
  const [egzersizde, setEgzersizde] = useState(false);
  const [cikisSoruluyor, setCikisSoruluyor] = useState(false);

  /*
    Uyelik sayfasi iki yoldan ACILISTA acilabiliyor:

      ?giris=1   — tanitim sayfasindaki "Giris yap" buraya getiriyor.
                   Once hem o baglanti hem "Hemen basla" ayni adrese
                   gidiyordu; giris yapmak isteyen kendini derste buluyordu.

      type=recovery — sifre sifirlama baglantisindan donus. Yakalanmazsa
                   kullanici oturumu acilmis ama ne yapacagini bilmez halde
                   ana ekrana duser; oysa yapmasi gereken yeni sifre
                   belirlemek. `uyelik.ts` bunu SDK adresi temizlemeden ONCE
                   okuyor.

    Baslangic degeri bir kez hesaplaniyor ve `?giris=1` adresten siliniyor:
    kalirsa kullanici sayfayi her yenilediginde giris sayfasi yeniden acilir.
  */
  /*
    Giris penceresi TANITIM SAYFASINDAN mi acildi.

    Acildiysa kapatmak uygulamaya birakmamali: kullanici "Giris yap"a
    basti, giris yapmadi — iceride isi yok, geldigi yere donmeli. Icerideki
    bir dugmeyle acilan ayni pencere ise kapaninca yerinde kalmali.

    Kurulum fonksiyonunun icinde isaretleniyor; o yalnizca bir kez
    calisiyor ve karar oracikta veriliyor.
  */
  const disaridanGiris = useRef(false);
  const [girisKip, setGirisKip] = useState<'giris' | 'yeniSifre' | 'bilgi' | null>(() => {
    if (!uyelikVarMi()) return null;
    if (sifirlamaDonusuMu()) return 'yeniSifre';
    const adres = new URL(window.location.href);
    if (adres.searchParams.get('giris') !== '1') return null;
    adres.searchParams.delete('giris');
    history.replaceState(null, '', adres.pathname + adres.search + adres.hash);
    /*
      Zaten girisliyse giris formu gostermek anlamsiz: tanitim
      sayfasindaki "Giris yap" o kisiyi dogruca uygulamaya birakmali.
      Depoya bakiliyor cunku SDK bu noktada henuz inmemis olabilir.
    */
    if (oturumVarGibi()) return null;
    disaridanGiris.current = true;
    return 'giris';
  });

  /*
    BILGI ADIMI. E-posta onayi tek basina uyelik vermiyor; ad girilene kadar
    kullanici uye sayilmiyor (bkz. uyelik.ts `uyelikTamamMi`).

    Acilista hesaplanamiyor: uyelik SDK'si asenkron iniyor ve oturum ancak
    o zaman biliniyor. Bu yuzden efekt — `hazir` olunca bir kez bakiliyor.

    `soruldu` bayragi olmadan kullanici "Sonra doldururum" dedigi anda efekt
    yeniden calisip pencereyi geri aciyor; kapatilamaz bir donguye donuyor.
    Kapatan kisi uye sayilmamaya devam ediyor ve serit onu hatirlatiyor.

    Google ile girende bu hic tetiklenmiyor: ad saglayicidan geldigi icin
    `bilgi` zaten dolu.
  */
  const { uye, hazir: uyelikHazir } = useUyelik();
  const bilgiSoruldu = useRef(false);
  useEffect(() => {
    if (!uyelikHazir || bilgiSoruldu.current) return;
    if (!uye || uye.bilgi) return;
    bilgiSoruldu.current = true;
    setGirisKip((o) => o ?? 'bilgi');
  }, [uyelikHazir, uye]);

  /*
    ILERLEME SENKRONU. Oturum hazir olur olmaz bir kez: sunucudaki paket
    cekiliyor, cihazdakiyle birlestiriliyor, sonuc iki tarafa da yaziliyor
    (bkz. senkron.ts).

    Burada olmasi onemli — giristen hemen SONRA degil. Kullanici zaten
    oturumu acik halde baska bir cihazdan gelmis olabilir; her acilista
    cekmezsek o cihazdaki ilerleme hic inmez.

    Bekleyen yok: senkron bir kolaylik, ag yoksa uygulama cihazdaki
    veriyle calismaya devam ediyor.
  */
  const senkronKimlik = useRef<string | null>(null);
  useEffect(() => {
    if (!uyelikHazir || !uye || senkronKimlik.current === uye.id) return;
    senkronKimlik.current = uye.id;
    void senkronla();
  }, [uyelikHazir, uye]);

  /*
    Gunun degistigini fark eden yer BURASI (bkz. today.ts). Onceden
    `new Date()` yalnizca render aninda okunuyordu ve render de ancak
    veritabani degisince oluyordu: uygulama acik dururken gece yarisi
    gecilince ekran dunun durumunda donuyordu. Anahtar sorgunun bagimliligi
    oldugu icin gun donunce kuyruklar da bastan hesaplanir.
  */
  const bugun = useToday();

  /**
   * DONANIM GERI TUSU — en dis katman (oncelik 0).
   *
   * Ic ekranlar (ders, egzersiz) kendi isleyicilerini daha yuksek oncelikle
   * kaydediyor ve once onlar soruluyor; buraya ancak onlar "ele almadim"
   * dediginde dusuluyor.
   *
   * Sira: acik bir akis varsa kapat -> sekme ana sekme degilse oraya don ->
   * ana ekranda cikis onayi. Yani geri tusu tek tek geriye yuruyor,
   * uygulamayi bir anda kapatmiyor.
   *
   * Kanca KOSULSUZ cagrilmali; asagidaki `if (!data)` erken donusunden
   * once duruyor.
   */
  useGeri(() => {
    if (cikisSoruluyor) {
      setCikisSoruluyor(false);
      return true;
    }
    if (flow) {
      setFlow(null);
      return true;
    }
    if (tab !== 'ogren') {
      setTab('ogren');
      return true;
    }
    // Ana ekranda: yanlislikla basip disari dusmek en sik sikayet.
    setCikisSoruluyor(true);
    return true;
  }, 0);

  const data = useLiveQuery(async () => {
    const [hepsi, state] = await Promise.all([db.progress.toArray(), getState()]);
    // Setten cikmis kartlarin kaydi burada elenir; tek kapi (bkz. content.ts)
    return { progress: setteOlanlar(hepsi), state };
  }, [bugun]);

  /*
    TERCIH DEGISINCE SENKRON. Senkron yalnizca acilista ve ders sonunda
    calisiyordu; avatar ya da gunluk hedef degistiren kullanicinin
    degisikligi bir sonraki derse kadar cihazda bekliyordu. Kisa bir
    bekleme var: Ayarlar'da art arda dokunulan uc secenek tek gonderim olsun.
    Ilk deger atlaniyor — o acilistaki durum, degisiklik degil.
  */
  const tercihDamgasi = data?.state.tercihDegisti;
  const veriVar = data !== undefined;
  const ilkDamga = useRef<number | undefined | null>(null);
  useEffect(() => {
    if (!veriVar) return;
    if (ilkDamga.current === null) {
      ilkDamga.current = tercihDamgasi;
      return;
    }
    if (tercihDamgasi === ilkDamga.current) return;
    ilkDamga.current = tercihDamgasi;
    const t = setTimeout(() => void senkronla(), 1500);
    return () => clearTimeout(t);
  }, [veriVar, tercihDamgasi]);

  if (!data) return <Splash />;

  const { progress, state: kayitliState } = data;
  const kapat = () => {
    setFlow(null);
    // Ders bitti: kazanilan ilerleme bu cihazda kalmasin.
    void senkronla();
  };

  /**
   * Cerceve kilitlerini acan uc sayi (bkz. cerceveler.ts).
   * Ilerleme sekmesindeki sayilarla AYNI kaynaktan okunuyor.
   */
  const kazanim: Kazanim = {
    ogrenilen: progress.filter((p) => p.introduced).length,
    // Kirilan seri kazanilmis cerceveyi geri almasin (bkz. types.ts)
    seri: kayitliState.bestStreak ?? kayitliState.streakCount,
    setBitti: setBittiMi(progress),
  };

  /**
   * Hak edilmemis cerceve OKURKEN duzeltilir.
   *
   * Yedek baska bir cihazdan geri yuklenebilir ya da ilerleme sifirlanmis
   * olabilir; o zaman profilde hala "Kraliyet" yazar ama kosul saglanmaz.
   * Kayda dokunulmuyor — kosul yeniden saglanirsa cerceve geri gelsin.
   */
  const state = kayitliState.profil
    ? {
        ...kayitliState,
        profil: {
          ...profilDuzelt(kayitliState.profil),
          cerceve: gecerliCerceve(kayitliState.profil, kazanim),
        },
      }
    : kayitliState;

  // Sifirlama sonrasi da buraya dusulur — kullaniciyi kaldigi sekmede
  // degil, basa dondurmek gerek.
  /*
    Giris penceresi HEM karsilama ekraninda hem ana akista gorunmeli.
    Karsilama erken donuyor; pencere yalnizca sondaki donuse konsaydi
    hesabi olup bu cihaza ilk kez gelen kullanici "Giris yap"a bastiginda
    giris yerine tanitim akisini gorurdu — oysa o baglantinin hedef kitlesi
    tam olarak bu kisi.
  */
  const girisPenceresi = girisKip ? (
    <Giris
      baslangicKip={girisKip}
      zorunlu={girisKip === 'yeniSifre'}
      onKapat={(girisYapildi) => {
        /*
          Tanitim sayfasindan gelip GIRMEDIYSE geldigi yere donuyor;
          girdiyse uygulamada kaliyor — zaten gelmek istedigi yer burasi.

          `uye` yerine `uyeOku()`: bu kapanis, giris aninda olusan eski
          render'in kapanisi olabiliyor ve oradaki `uye` hala null.
        */
        const disaridan = disaridanGiris.current;
        // Tek kullanimlik: sonra Ayarlar'dan acilan ayni pencere
        // kapaninca kullaniciyi uygulamadan atmasin.
        disaridanGiris.current = false;
        if (disaridan && !girisYapildi && !uyeOku()) {
          window.location.href = '/';
          return;
        }
        setGirisKip(null);
      }}
    />
  ) : null;

  if (!state.onboarded) {
    return (
      <>
        <Welcome
        onDone={() => {
          /*
            Bir sure DOGRUDAN ilk derse giriliyordu — bir karar eksiltmek
            icin. Kotu tarafi: kullanici hazir olup olmadigi sorulmadan
            derse dusuyordu ve geri cikmanin yolu "dersi yarida birak"
            uyarisiydi. Artik ana ekrana dusuyor; ilk ders orada kendi
            karti olarak bekliyor (bkz. Home, `ilkDers`), baslatan o.
          */
          setTab('ogren');
        }}
        />
        {girisPenceresi}
      </>
    );
  }

  if (flow?.name === 'ders') {
    return (
      <Lesson
        yeniKartlar={flow.yeni}
        yedekKartlar={flow.yedek}
        tekrarKuyrugu={flow.tekrar}
        sound={state.sound}
        eslestirmesiz={flow.eslestirmesiz}
        tekrarOnce={flow.tekrarOnce}
        onExit={kapat}
        onFinish={(ozet) => setFlow({ name: 'done', ...ozet })}
      />
    );
  }
  if (flow?.name === 'kelimeler') {
    return <WordList progress={progress} onExit={kapat} />;
  }
  if (flow?.name === 'profil' && state.profil) {
    return (
      <ProfilDuzenle
        profil={state.profil}
        kazanim={kazanim}
        onKapat={kapat}
        onKaydet={(profil) => {
          void tercihKaydet({ profil });
          // Adin kendisi GONDERILMIYOR — yalnizca neyin degistigi.
          olay('profil_degisti', { avatar: profil.avatar.tip, cerceve: profil.cerceve });
          kapat();
        }}
      />
    );
  }
  if (flow?.name === 'done') {
    if (flow.yeni > 0 && setBittiMi(progress)) olay('set_bitti', { kelime: progress.length });
    return (
      <SessionDone
        count={flow.count}
        streak={flow.streak}
        dogru={flow.dogru}
        toplam={flow.toplam}
        ilerleyen={flow.ilerleyen}
        /*
          Final YALNIZCA seti bitiren derste. Yeni kelime getirmeyen bir
          tekrar dersi de "set bitmis" durumda biter; her seferinde kutlarsa
          kutlama anlamini yitirir.
        */
        setBitti={flow.yeni > 0 && setBittiMi(progress)}
        kancalar={ogrenilenKancalar(progress)}
        kazanim={kazanim}
        davetGorulen={state.uyelikDavetGorulen ?? []}
        onDavetKapandi={(id) =>
          void setState({
            uyelikDavetGorulen: [...(state.uyelikDavetGorulen ?? []), id],
          })
        }
        onHome={kapat}
      />
    );
  }

  const due = dueQueue(progress);
  const newCards = nextBatch(progress, state.dailyLimit);
  /* "Bunu biliyorum" denince yerine kayacak kartlar (bkz. Lesson) */
  const yedekKartlar = spareCards(progress, newCards);
  const bugununKartlari = todaysCards(progress);
  const ahead = aheadQueue(progress, AHEAD_BATCH);

  return (
    <>
      {tab === 'ogren' && (
        <Home
          progress={progress}
          state={state}
          bugun={bugun}
          due={due}
          newCards={newCards}
          todayCount={introducedToday(progress)}
          remaining={remainingToday(progress, state.dailyLimit)}
          todaysCount={bugununKartlari.length}
          todaysIds={bugununKartlari.map((p) => p.cardId)}
          aheadCount={ahead.length}
          agirTekrar={AGIR_TEKRAR}
          onStart={() =>
            setFlow({ name: 'ders', yeni: newCards, yedek: yedekKartlar, tekrar: due.slice(0, DAILY_REVIEW_CAP) })
          }
          /* Ayni ders, yalnizca tekrar bolumu basta — bkz. AGIR_TEKRAR */
          onReviewFirst={() =>
            setFlow({
              name: 'ders',
              yeni: newCards,
              yedek: yedekKartlar,
              tekrar: due.slice(0, DAILY_REVIEW_CAP),
              tekrarOnce: true,
            })
          }
          onQuickReview={() =>
            setFlow({ name: 'ders', yeni: [], yedek: [], tekrar: bugununKartlari, eslestirmesiz: true })
          }
          onUyelik={() => setGirisKip(uye ? 'bilgi' : 'giris')}
          onAyarlar={() => setTab('ayarlar')}
          onPractice={() => setFlow({ name: 'ders', yeni: [], yedek: [], tekrar: ahead })}
        />
      )}
      {tab === 'egzersiz' && (
        <Practice progress={progress} sound={state.sound} onRunning={setEgzersizde} />
      )}
      {tab === 'ilerleme' && (
        <ProgressScreen
          state={state}
          progress={progress}
          onWords={() => setFlow({ name: 'kelimeler' })}
        />
      )}
      {tab === 'ayarlar' && (
        <Settings
          state={state}
          progress={progress}
          onProfil={() => setFlow({ name: 'profil' })}
        />
      )}

      {/* Egzersiz kosarken menu gizlenir: tam ekran odak, ve dugmeler menunun altinda kalmaz */}
      {!egzersizde && <TabBar active={tab} onChange={setTab} profil={state.profil} />}

      {girisPenceresi}

      {/*
        Cikis onayi. Ana ekranda geri tusuna basilinca cikiyor — kullanici
        "genelde yanlislikla basiyorum" dedi. Varsayilan secenek KALMAK:
        birincil dugme "Vazgec", cikis ikincil. (Ayarlar'daki sifirlama
        onayiyla ayni duzen.)
      */}
      {cikisSoruluyor && (
        <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/40 px-5 pb-8 backdrop-blur-sm">
          <Kutu className="rise w-full max-w-md p-6">
            <p className="word text-xl font-extrabold">Çıkmak istiyor musun?</p>
            <p className="text-sm text-ink-soft mt-2">
              İlerlemen kayıtlı, kaldığın yerden devam edebilirsin.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <Button variant="brand" onClick={() => setCikisSoruluyor(false)}>
                Vazgeç
              </Button>
              <Button variant="ghost" onClick={() => void uygulamadanCik()}>
                Çık
              </Button>
            </div>
          </Kutu>
        </div>
      )}
    </>
  );
}
