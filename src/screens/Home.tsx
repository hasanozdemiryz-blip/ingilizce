import { Avatar } from '../components/Avatar';
import { Button, Card, Ikon, Screen, Streak } from '../components/ui';
import { SetFinale } from '../components/SetFinale';
import { TAB_SPACE } from '../components/TabBar';
import { UyelikSerit } from '../components/UyelikSerit';
import { uyelikVarMi, type Uye } from '../uyelik';
import { CARD_BY_ID, CARDS, ogrenilenKancalar, setBittiMi } from '../content';
import { relativeDue } from '../dates';
import type { AppState, Card as CardType, Progress } from '../types';

type Props = {
  progress: Progress[];
  state: AppState;
  /** Bugunun anahtari — gun donunce ekran da doner (bkz. today.ts) */
  bugun: string;
  /** Vadesi gelmis TUM kartlar — ham sayi ekranda ASLA gosterilmez */
  due: Progress[];
  newCards: CardType[];
  /** Bugun tanisilan kelime sayisi */
  todayCount: number;
  /** Bugun kac yeni kelime hakki kaldi */
  remaining: number;
  /** Gunluk hedef dolduysa tekrarlanacak, o gunun kartlari */
  todaysCount: number;
  /** Ayni kartlarin kendisi — hizli tekrar onizlemesi icin */
  todaysIds: string[];
  aheadCount: number;
  /** Tekrar yuku bunu gecince "Önce tekrar et" satiri gorunur */
  agirTekrar: number;
  onStart: () => void;
  onReviewFirst: () => void;
  onQuickReview: () => void;
  onPractice: () => void;
  /** Uyelik seridi buna basinca giris penceresini aciyor (bkz. App). */
  onUyelik: () => void;
  /**
   * Ustteki avatar + ad: girisliyse hesap menusu, degilse Ayarlar
   * (bkz. App). Cikis bu menude — iki dokunus.
   */
  onHesap: () => void;
  uye: Uye | null;
  uyelikHazir: boolean;
};

/**
 * ANA EKRAN — tek karar.
 *
 * Onceki surumde uc kart vardi (Tanis / Tekrarla / Deste testi) ve altinda
 * 20 numarali deste karesi; kullanici her acilista "hangisine basayim"
 * diye dusunuyordu. Artik tek dugme var ve ekranin ortasinda duruyor.
 *
 * "X / 100 kelime" cubugu kaldirildi: havuz buyudukce payda degisecek ve
 * yuzde bir sey ifade etmiyor. Yerine BUGUNUN hedefi gosteriliyor —
 * kullanicinin gercekten etkileyebildigi sayi bu.
 */
export function Home({
  progress,
  state,
  bugun,
  due,
  newCards,
  todayCount,
  remaining,
  todaysCount,
  todaysIds,
  aheadCount,
  agirTekrar,
  onStart,
  onReviewFirst,
  onQuickReview,
  onPractice,
  onUyelik,
  onHesap,
  uye,
  uyelikHazir,
}: Props) {
  const ogrenilen = progress.filter((p) => p.introduced).length;
  const tekrar = due.length;
  const limitDoldu = remaining === 0;
  const bosGun = tekrar === 0 && newCards.length === 0;
  const setBitti = setBittiMi(progress);

  /*
    Kahraman kartin uc yuzu var ve ayrimi BURADA yapiliyor:

      ilkDers  — havuz bos, kullanici karsilamadan yeni geldi
      yeniGun  — bugun henuz hic calisilmadi; gunun ACILDIGI an
      normal   — gun icinde ikinci, ucuncu giris

    `yeniGun` ozellikle bir AN, surekli bir etiket degil: ilk ders
    bitince `lastSessionDate` bugune donuyor ve kart normale geciyor.
    Boylece "yeni gun" sozu gun icinde tekrarlanip anlamini yitirmiyor.
  */
  const ilkDers = ogrenilen === 0;
  const yeniGun = !ilkDers && state.lastSessionDate !== bugun;

  /** Gunun paketi: tek satirda ne bekliyor. */
  const paket = [newCards.length > 0 && `${newCards.length} yeni`, tekrar > 0 && `${tekrar} tekrar`]
    .filter(Boolean)
    .join(' · ');

  const siradaki = progress
    .filter((p) => p.introduced)
    .map((p) => p.due)
    .sort((a, b) => a.getTime() - b.getTime())
    .find((d) => d.getTime() > Date.now());

  const sonKancalar = progress
    .filter((p) => p.introduced && p.introducedAt)
    .sort((a, b) => (a.introducedAt! < b.introducedAt! ? 1 : -1))
    .slice(0, 6)
    .map((p) => CARD_BY_ID.get(p.cardId))
    .filter((c): c is CardType => Boolean(c));

  const gunlukPct = Math.min(100, Math.round((todayCount / state.dailyLimit) * 100));

  /** Hizli tekrarda gelecek kelimeler — onizleme icin. */
  const bugununKelimeleri = todaysIds
    .map((id) => CARD_BY_ID.get(id))
    .filter((c): c is CardType => Boolean(c));

  /*
    Genis ekranda panelin alti bos kaliyordu — telefon icin tasarlanmis
    tek sutun, 900 piksellik bir ekranda ucte birini dolduruyor. Bosluga
    arkaya tasan bir kart cizimi konuyor: yeni bir ozellik degil, zaten
    sahip oldugumuz gorsellerden biri. Maske olmadan cizimin kendi acik
    zemini krem uzerinde dikdortgen bir leke birakiyor.

    Gun icinde degismesin diye bugunun anahtarindan seciliyor; her acilista
    baska bir cizim yanip sonse dikkat dagitirdi. Liste elle secili: rastgele
    kart cogu zaman soluk bir nesne cikariyor ve krem uzerinde leke gibi
    duruyor.
  */
  const SUS_KARTLAR = ['snake', 'fox', 'boat', 'cup', 'leaf', 'bad'];
  const susId = SUS_KARTLAR[[...bugun].reduce((t, c) => t + c.charCodeAt(0), 0) % SUS_KARTLAR.length];
  const susGorsel = CARD_BY_ID.get(susId)?.image ?? null;

  return (
    <Screen>
      {susGorsel && (
        <img
          src={susGorsel}
          alt=""
          aria-hidden
          className="pointer-events-none fixed -bottom-6 -right-6 hidden lg:block w-[30rem] opacity-90 [mask-image:radial-gradient(68%_68%_at_55%_45%,#000_45%,transparent_80%)]"
        />
      )}
      <header className="flex items-center justify-between h-[4.25rem] shrink-0">
        {/*
          Logo burada degil, acilis ekraninda (bkz. Splash). Yatay kilit bu
          boyutta okunmuyordu ve uygulamanin icindeyken hangi uygulamada
          oldugunu kimse merak etmiyor — o yuzden bu yuva uygulamanin adina
          degil KULLANICIYA ayrildi. Profil yoksa (eski kurulum, ilk
          milisaniyeler) uygulama adina duser.
        */}
        {state.profil ? (
          /*
            Avatar artik bir DUGME: kullanicinin kendi panelini aramasi
            gerekmemeli. Her uygulamada profil fotografina basinca ayarlar
            acilir; burada da oyle.
          */
          <button
            onClick={onHesap}
            className="flex items-center gap-3 min-w-0 rounded-2xl -ml-1 pl-1 pr-2 py-1 transition hover:bg-sunken/70 active:scale-[0.98]"
            aria-label={uye ? 'Hesap menüsü' : 'Hesabım ve ayarlar'}
          >
            <Avatar avatar={state.profil.avatar} cerceve={state.profil.cerceve} boyut="sm" />
            {/*
              Girisli oldugu burada YAZMIYOR — kullanici "surekli giris
              yapildi yazmasin" dedi. Isaret, girissizde sagda duran
              "Giris yap"in yoklugu; ayrinti hesap menusunde.
            */}
            <span className="word text-lg font-extrabold text-ink truncate">
              {state.profil.ad}
            </span>
          </button>
        ) : (
          <span className="word text-base font-extrabold text-ink-soft">Hafızada İngilizce</span>
        )}
        <span className="flex shrink-0 items-center gap-2">
          {state.streakCount > 0 && <Streak count={state.streakCount} />}
          {/* Girissize ustte de bir kapi; serit asagida kalabiliyor */}
          {uyelikVarMi() && uyelikHazir && !uye && (
            <button
              onClick={onUyelik}
              className="rounded-full bg-white px-3.5 py-1.5 text-sm font-bold text-brand-deep shadow-[var(--shadow-soft)] transition hover:bg-brand-soft active:scale-95"
            >
              Giriş yap
            </button>
          )}
        </span>
      </header>

      {/* Kahraman blok dikey ORTADA — ekran bos gorunmesin, karar tek olsun */}
      <div className={`flex-1 flex flex-col justify-center lg:justify-start lg:pt-2 gap-4 ${TAB_SPACE}`}>
        {/*
          Set bitince gunluk hedef cubugu YALAN soyluyor: yeni kelime
          kalmadigi icin "0 / 10" her gun boyle kalacak ve kullanici
          yapmadigi bir sey icin eksik gorunecek. Yerine setin kendisi.
        */}
        {/*
          Hedef de bir KART. Once cubuk sayfanin zemininde, kartlarin
          arasinda yuzer halde duruyordu — ekrandaki her sey bir yuzeyin
          uzerindeyken tek basina duran o satir eksik gorunuyordu.
          Cubugun zemini de `sunken`: beyaz kartin uzerinde `white/70`
          kayboluyor.
        */}
        <UyelikSerit ogrenilen={ogrenilen} onAc={onUyelik} />

        <Card className="rise !py-4">
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="text-sm font-bold text-ink-soft">
              {setBitti ? 'Set tamamlandı' : 'Bugünün hedefi'}
            </span>
            <span className="word text-sm font-extrabold tabular-nums">
              {setBitti
                ? `${CARDS.length} / ${CARDS.length}`
                : `${todayCount} / ${state.dailyLimit}`}
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-sunken overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                limitDoldu || setBitti ? 'bg-grow' : 'bg-spark'
              }`}
              style={{ width: `${setBitti ? 100 : gunlukPct}%` }}
            />
          </div>
        </Card>

        {limitDoldu ? (
          /*
            Gunluk hedef doldu: gun boyunca ekran BU kalir.
            Once `bosGun` once kontrol ediliyordu; hizli tekrar bitince
            vadesi gelen kart kalmadigi icin ekran "Bugunluk tamam ·
            Siradaki tekrar 1 dakika sonra"ya duserdi. Oysa hedef dolmus
            bir gunde soylenecek tek sey var: istedigin kadar pekistir.
          */
          <div className="rise rounded-card p-6 bg-gradient-to-br from-grow to-[#5fe0ad] text-white shadow-[0_16px_34px_-16px_rgba(43,196,138,0.95)]">
            <p className="text-sm font-medium text-white/85">Günlük hedef tamam ✓</p>
            <p className="word text-3xl font-extrabold mt-0.5 mb-1">Hızlı tekrar</p>
            <p className="text-sm text-white/80 mb-4">
              {todaysCount > 0
                ? `Bugünün ${todaysCount} kelimesini istediğin kadar çalış.`
                : 'Bekleyen tekrarlarını çalışabilirsin.'}{' '}
              Yeni kelimeler gece 00:00'da gelir.
            </p>
            {/*
              Onizleme burada da var: "Bugunun 10 kelimesi" demek neyin
              gelecegini soylemiyor. Yeni kelime kartindakiyle ayni mantik
              — fark su ki bunlar zaten TANISILMIS kelimeler, yani kanca
              saklanacak bir sir degil; yine de gosterilmiyor, tekrarin
              isi hatirlamak.
            */}
            {bugununKelimeleri.length > 0 && (
              <ul className="mb-4 flex flex-wrap gap-1.5">
                {bugununKelimeleri.slice(0, 8).map((c) => (
                  <li
                    key={c.id}
                    className="word rounded-full bg-white/25 px-3 py-1.5 text-sm font-bold text-white"
                  >
                    {c.en}
                  </li>
                ))}
                {bugununKelimeleri.length > 8 && (
                  <li className="rounded-full px-2 py-1.5 text-sm font-bold text-white/70">
                    +{bugununKelimeleri.length - 8}
                  </li>
                )}
              </ul>
            )}

            <Button variant="soft" onClick={todaysCount > 0 ? onQuickReview : onStart}>
              Hızlı tekrar
            </Button>
          </div>
        ) : bosGun && setBitti ? (
          /*
            Havuzun sonu: "Bugunluk tamam 🌿" burada YETMEZ. Kullanici
            setin sonuna geldi ve bunu bir daha hic gormeyecek — bkz.
            SetFinale. "Yine de tekrar et" kapisi altta acik kaliyor.
          */
          <div className="flex flex-col gap-3">
            <SetFinale kancalar={ogrenilenKancalar(progress)} variant="kart" />
            {aheadCount > 0 && (
              <Button variant="soft" onClick={onPractice}>
                Yine de tekrar et
              </Button>
            )}
          </div>
        ) : bosGun ? (
          <Card className="rise text-center py-10">
            <Ikon ad="ogren" className="h-14 w-14 mx-auto mb-3" />
            <p className="word text-2xl font-extrabold">Bugünlük tamam</p>
            <p className="text-ink-soft mt-2 text-sm">
              {siradaki ? `Sıradaki tekrar ${relativeDue(siradaki)}.` : 'Yarın görüşürüz.'}
            </p>
            {aheadCount > 0 && (
              <div className="mt-5">
                <Button variant="soft" onClick={onPractice}>
                  Yine de tekrar et
                </Button>
                <p className="text-xs text-ink-faint mt-2">
                  Sırada bekleyen {aheadCount} kartı öne alır.
                </p>
              </div>
            )}
          </Card>
        ) : (
          <div className="rise rounded-card p-6 bg-spark text-ink shadow-[0_14px_30px_-16px_rgba(240,184,0,0.9)]">
            <p className="text-sm font-bold text-ink/55">
              {ilkDers ? 'Hazır' : yeniGun ? 'Yeni gün' : 'Bugünün dersi'}
            </p>
            <p className="word text-3xl font-extrabold mt-0.5 mb-1">
              {ilkDers ? 'İlk dersin hazır' : yeniGun ? 'Yeni güne başla' : paket}
            </p>
            <p className="text-sm text-ink/65 mb-4">
              {ilkDers
                ? `${newCards.length} yeni kelime seni bekliyor.`
                : yeniGun
                  ? paket
                  : newCards.length > 0
                    ? 'Önce kelimeler, sonra öğrenme testi.'
                    : 'Bugün gelen kelimeler seni bekliyor.'}
            </p>
            {/*
              DERS ONIZLEMESI. Kart yalnizca "5 kelime" diyordu ve ekranin
              yarisi bos duruyordu; kullanici neye basacagini bilmeden
              basiyordu. Kelimeler goruldugunde ders somut bir sey oluyor.

              KANCA GOSTERILMIYOR — bilerek. Kanca dersin kendi ani; burada
              gosterilirse ilk karsilasmanin etkisi onizlemede harcanir.
            */}
            {newCards.length > 0 && (
              <ul className="mb-4 flex flex-col gap-1.5">
                {newCards.slice(0, 5).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-baseline gap-2 rounded-xl bg-white/55 px-3 py-2"
                  >
                    <span className="word font-extrabold text-ink">{c.en}</span>
                    <span className="text-sm text-ink/60">{c.tr}</span>
                  </li>
                ))}
              </ul>
            )}

            <Button onClick={onStart}>Başla</Button>

            {/*
              Ikinci bir HEDEF degil, ayni dersin sirasi. Yalnizca tekrar
              yuku agirken cikiyor: uzun bir derse girmeden once "sunlari
              halledeyim" demek mesru, ama tekrari atlamak degil.
            */}
            {newCards.length > 0 && tekrar >= agirTekrar && (
              <button
                onClick={onReviewFirst}
                className="mt-3 w-full text-center text-sm font-semibold text-ink/70 underline decoration-ink/30 underline-offset-4 transition-opacity active:opacity-60"
              >
                Önce {tekrar} tekrarı yap
              </button>
            )}
          </div>
        )}

        {/*
          Kanca ciftleri de kartin icinde. Yanindaki "12 kelime" sayaci
          kaldirildi: bu bolum bir OLCUM degil, son ogrenilenlere bakma
          yeri — sayilar zaten hemen ustteki hedefte ve Ilerleme'de.

          Cipler `sunken`: beyaz kartin uzerinde beyaz cip gorunmuyor.
        */}
        {sonKancalar.length > 0 && (
          <Card className="rise delay-2 !py-4">
            <h2 className="text-sm font-bold text-ink-soft mb-2.5">Son tanıştıkların</h2>
            <div className="flex flex-wrap gap-1.5">
              {sonKancalar.map((c) => (
                <span key={c.id} className="rounded-full bg-sunken px-3 py-1.5 text-sm">
                  <span className="word font-semibold">{c.en}</span>
                  <span className="text-ink-faint"> ≈ </span>
                  <span className="font-semibold text-ink bg-spark/55 rounded px-1">{c.hook}</span>
                </span>
              ))}
            </div>
          </Card>
        )}
      </div>
    </Screen>
  );
}
