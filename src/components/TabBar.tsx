import { Avatar } from './Avatar';
import { GirisRozeti } from './HesapMenusu';
import type { Uye } from '../uyelik';
import { Ikon, Logo } from './ui';
import type { IkonAd } from '../icons';
import type { Profil } from '../types';

export type Tab = 'ogren' | 'egzersiz' | 'ilerleme' | 'ayarlar';

/**
 * Her sekmenin kendi rengi var — dordu de ayni mavi pille isaretlenince
 * hangi sekmede oldugu ancak yazi okunarak anlasiliyordu. Renk sabit:
 * sekme nereye giderse gitsin ayni rengi tasiyor.
 *
 * Ikon adi sekme adiyla birebir ayni (bkz. icons.ts) — ayri bir alan
 * tutulmuyor, cunku ikisi ayrisirsa sessizce yanlis ikon cikar.
 */
const TABS: { id: Tab & IkonAd; ad: string; renk: string }[] = [
  { id: 'ogren', ad: 'Öğren', renk: 'bg-brand' },
  { id: 'egzersiz', ad: 'Egzersiz', renk: 'bg-grow' },
  { id: 'ilerleme', ad: 'İlerleme', renk: 'bg-ink' },
  { id: 'ayarlar', ad: 'Ayarlar', renk: 'bg-ink-soft' },
];

/**
 * Alt menunun kaplayacagi yer — icerik altinda kalmasin diye.
 * Genis ekranda menu yana gectigi icin bu bosluk gerekmiyor.
 */
export const TAB_SPACE = 'pb-28 lg:pb-8';

/** Yan menunun genisligi. `Screen` ayni sayidan besleniyor. */
export const YAN_MENU = 'w-60';

/**
 * Gezinme.
 *
 * Iki bicimi var ve ayni bilesen ikisini de veriyor:
 *
 *   dar ekran  — altta yuzen hap (telefon; basparmak menzili)
 *   genis ekran — solda sabit yan menu (bilgisayar; panel gorunumu)
 *
 * Ayri iki bilesen yazmak sekme listesini ikiye bolerdi ve biri
 * digerinden sessizce ayrisirdi. Liste tek, kabuk iki.
 *
 * Yan menude secili ogenin isareti SAG KENARDAKI renk cubugu — dolu
 * zemin yerine. Dolu zemin dar menude ikonu bogup yaziyi ezerken,
 * kenar cubugu sekmenin kendi rengini koruyor.
 */
export function TabBar({
  active,
  onChange,
  profil,
  uye = null,
  girisVar = false,
  onHesap,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  /** Yan menunun dibindeki kullanici satiri. Dar ekranda yer yok. */
  profil?: Profil;
  /** Girisliyse satir "Giris yapildi" der ve hesap menusunu acar. */
  uye?: Uye | null;
  /** Uyelik acik ve durum biliniyor — girissize "Giris yap" gosterilsin mi. */
  girisVar?: boolean;
  onHesap?: () => void;
}) {
  return (
    <>
      {/* --- Telefon: alttaki hap --- */}
      <nav className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="mx-auto flex max-w-md gap-1 rounded-full bg-white/90 p-1.5 shadow-[var(--shadow-lift)] backdrop-blur">
          {TABS.map((t) => {
            const secili = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={`flex-1 rounded-full py-2 text-[11px] font-bold transition-all active:scale-95 ${
                  secili ? `${t.renk} text-white` : 'text-ink-faint'
                }`}
              >
                {/*
                  Secili sekmenin zemini dolu renk; lacivert ikon orada
                  kayboluyor, o yuzden ters (krem) varyant cikiyor.
                  Secili olmayan sekmenin YAZISI soluyor ama ikonu tam
                  renginde duruyor: dort ikon her zaman okunur kalsin diye.
                */}
                <Ikon ad={t.id} ters={secili} className="mx-auto mb-0.5 h-6 w-6" />
                {t.ad}
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- Bilgisayar: soldaki yan menu --- */}
      <nav
        className={`hidden lg:flex fixed inset-y-0 left-0 z-10 ${YAN_MENU} flex-col gap-6 border-r border-line bg-surface py-5`}
      >
        <span className="flex items-center gap-2.5 px-5">
          <Logo className="h-9" />
          {/*
            Iki kelime TEK kilit gibi durmali: aradaki bosluk kapatildi ve
            alttaki yazi harf araligiyla ustekinin genisligine oturtuldu.
            Ayri ayri duran iki satir marka degil, etiket gibi goruluyordu.
          */}
          <span className="leading-none">
            <span className="word block text-base font-extrabold leading-none text-ink">
              Hafızada
            </span>
            <span className="-mt-px block text-[0.58rem] font-bold uppercase leading-none tracking-[0.3em] text-ink-faint">
              İngilizce
            </span>
          </span>
        </span>

        <div className="flex flex-col">
          {TABS.map((t) => {
            const secili = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                aria-current={secili ? 'page' : undefined}
                className={`relative flex items-center gap-3 px-5 py-3 text-left text-sm font-bold transition-colors ${
                  secili ? 'bg-sunken text-ink' : 'text-ink-soft hover:bg-sunken/60'
                }`}
              >
                <Ikon ad={t.id} className="h-6 w-6 shrink-0" />
                {t.ad}
                {secili && (
                  <span
                    className={`absolute inset-y-1.5 right-0 w-1.5 rounded-l ${t.renk}`}
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>

        {/*
          KULLANICI SATIRI. Girisli kisinin kendi panelini aramasi
          gerekmemeli; her uygulamada fotografin durdugu yer burasi ve
          basinca ayarlar aciliyor. Dar ekranda yok — orada ayni is
          ustteki avatara dusuyor (bkz. Home).
        */}
        {/*
          Alt satir girisli kullaniciya "Giris yapildi" (yesil tik) diyor ve
          hesap menusunu aciyor; girissize "Giris yap" diyor. Once ikisine
          de "Hesabim" yaziyordu ve girisin olup olmadigi anlasilmiyordu.
        */}
        {profil && (
          <button
            onClick={() => (onHesap && (uye || girisVar) ? onHesap() : onChange('ayarlar'))}
            className="mt-auto mx-3 flex items-center gap-2.5 rounded-2xl border border-line bg-paper px-3 py-2.5 text-left transition hover:bg-sunken active:scale-[0.98]"
            aria-label={uye ? 'Hesap menüsü' : 'Giriş yap'}
          >
            <Avatar avatar={profil.avatar} cerceve={profil.cerceve} boyut="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-ink">{profil.ad}</span>
              {uye ? (
                <GirisRozeti uye={uye} kucuk />
              ) : girisVar ? (
                <span className="block text-xs font-bold text-brand-deep">Giriş yap ›</span>
              ) : (
                <span className="block text-xs font-bold text-ink-faint">Ayarlar</span>
              )}
            </span>
          </button>
        )}
      </nav>
    </>
  );
}
