import type { ReactNode } from 'react';
import { seslendir, useTelaffuz } from '../speech';
import { ikonUrl, type IkonAd } from '../icons';
import kilit from '../assets/brand/kilit.webp';
import isaret from '../assets/brand/isaret.webp';

/**
 * Arayuz ikonu — markanin cizim setinden (bkz. icons.ts).
 *
 * `alt=""`: ikonlar HER YERDE bir yazinin yaninda duruyor, tek baslarina
 * bilgi tasimiyorlar. Ekran okuyucuya iki kez "Ayarlar" dedirtmek yerine
 * susuyorlar; yazisiz tek kullanim (telaffuz dugmesi) kendi
 * `aria-label`'ini tasiyor.
 *
 * Kaynak 64 piksel: 32'ye kadar retinada net, ustunde yumusuyor. Bos
 * ekranlardaki buyuk kullanimlar bu yuzden 56'da duruyor.
 */
export function Ikon({
  ad,
  ters = false,
  className = 'h-6 w-6',
}: {
  ad: IkonAd;
  /** Koyu zeminde mi duruyor — murekkep kreme doner. */
  ters?: boolean;
  className?: string;
}) {
  return <img src={ikonUrl(ad, ters)} alt="" aria-hidden className={`${className} object-contain`} />;
}

/**
 * Marka kilidi: isaret + isim.
 * brand/kilit-kaynak.png'den uretiliyor — uygulama simgesiyle ayni isaret.
 */
/**
 * Marka.
 *
 * `mark` — yalnizca kare isaret. Uygulama ici baslik icin TEK dogru bicim:
 * yatay kilit (isaret + isim) 28px yuksekliğe sikistiginda yazi ~10px'e
 * duser ve telefonda okunmaz, isaret de ezilir. Kilitler ~40px altinda
 * calismaz. Uygulamanin icindeyken zaten hangi uygulamada oldugu belli.
 *
 * `full` — kilidin tamami. Yalnizca yer olan yerde (karsilama) ve buyuk.
 */
export function Logo({
  variant = 'mark',
  className,
}: {
  variant?: 'mark' | 'full';
  className?: string;
}) {
  const mark = variant === 'mark';
  return (
    <img
      src={mark ? isaret : kilit}
      alt="Hafızada İngilizce"
      className={`${className ?? (mark ? 'h-9' : 'h-12')} w-auto`}
    />
  );
}

/**
 * Ekran kabugu.
 *
 * Telefonda tek sutun, ortada, en fazla `max-w-md`. Genis ekranda sol
 * yan menu (bkz. TabBar) icin yer aciliyor ve sutun biraz genisliyor —
 * ama SINIRSIZ degil: 2xl bir monitorde tam genislige yayilan bir ders
 * ekrani okunmuyor, satirlar cok uzuyor.
 *
 * Soldaki bosluk yan menuyle AYNI sayidan beslenmeli; ikisi ayrisirsa
 * icerik menunun altina kayar.
 */
export function Screen({
  children,
  yanMenusuz = false,
}: {
  children: ReactNode;
  /**
   * Yan menu gorunmuyorken true. Ders, egzersiz, karsilama ve profil
   * ekranlari menuyu gizliyor (bkz. App `egzersizde` ve erken donusler);
   * bosluk yine de ayrilirsa icerik bos bir seridin saginda kalir.
   */
  yanMenusuz?: boolean;
}) {
  return (
    <div className={`min-h-full flex justify-center ${yanMenusuz ? '' : 'lg:pl-60'}`}>
      <div className="w-full max-w-md lg:max-w-2xl px-5 lg:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] flex flex-col">
        {children}
      </div>
    </div>
  );
}

/**
 * Ust serit.
 *
 * Yukseklik geri dugmesiyle AYNI (48px): once 44px'ti ve dugme 48'e
 * cikinca serit onu tutamayip alttaki ilerleme cubuguyla cakisiyordu.
 * Ikisi tek sayidan beslenmeli, yoksa biri degisince digeri sessizce
 * tasar.
 */
export function TopBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between h-12 mb-1 shrink-0 text-sm font-medium text-ink-soft">
      <div>{left}</div>
      <div className="tabular-nums">{right}</div>
    </div>
  );
}

/**
 * Geri dugmesi.
 *
 * Ok TIPOGRAFIK degil CIZIM: `←` karakteri yazi tipinin kendi cizgisiyle
 * geliyor ve ince kaliyordu — kullanici "bulamiyorum" dedi, haklıydi.
 * SVG'nin kalinligi ikon setiyle ayni (2.5 birim, yuvarlak uc) ve her
 * boyutta ayni kaliyor.
 *
 * Dugme 48x48 ve DOLU beyaz — yarı saydam degil. Onerilen dokunma hedefi
 * 44px; burada biraz uzerine cikildi cunku sikayet "bulamiyorum"du, yani
 * sorun yalnizca dokunulabilirlik degil GORUNURLUK. Ust seritte tek basina
 * duran bir nesne oldugu icin cevresindeki bosluk onu zaten ayiriyor;
 * eksik olan kontrasttı.
 *
 * Gecmisi: once `←` karakteri 36x36 icinde. Karakterin cizgisi yazi
 * tipinden geliyordu ve inceydi. Sonra 48x48 ve `-ml-2` ile kenara
 * yaslanmisti; bu sefer "cok buyuk ve yapisik" dendi. Simdi 40x40,
 * kenardan ve alttaki seritten bosluklu — dolu beyaz zemin ve kalin ok
 * gorunurlugu tasimaya devam ediyor.
 */
export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-10 w-10 rounded-full bg-white text-ink shadow-[0_6px_16px_-4px_rgba(22,35,58,0.28)] ring-1 ring-black/5 grid place-items-center hover:bg-white active:scale-95 transition"
      aria-label="Geri"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
    </button>
  );
}

/** Kart: beyaz, yuvarlak, yumusak golgeli bir nesne. */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-card bg-surface p-5 shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </article>
  );
}

type Variant = 'primary' | 'brand' | 'spark' | 'soft' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white shadow-[0_4px_12px_-6px_rgba(22,35,58,0.45)]',
  /*
    Sari birincil — BEYAZ yuzeyin uzerinde. Kanca sarisiyla ayni renk ve
    bu bilincli: kancanin gorunmedigi ekranlarda (uyelik, ana sayfa)
    rengin yarisacagi bir sey yok. Ders ve kart ekranlarinda kullanilmaz.
  */
  spark: 'bg-spark text-ink shadow-[0_4px_12px_-6px_rgba(214,163,0,0.6)]',
  brand: 'bg-brand text-white shadow-[0_4px_12px_-6px_rgba(79,146,246,0.6)]',
  soft: 'bg-white text-ink shadow-[var(--shadow-soft)]',
  ghost: 'text-ink-soft hover:bg-white/60',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  /**
   * Varsayilan `button`, bilerek. HTML'de form icindeki tipsiz dugme
   * SUBMIT sayiliyor — yani bir formun icine konan "Vazgec" dugmesi
   * formu gonderiyor. Varsayilani `button` yapmak o tuzagi kapatiyor;
   * gonderen dugme tipini aciktan yaziyor.
   */
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl px-5 py-4 font-bold transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Progressbar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="h-2.5 w-full rounded-full bg-white/70 overflow-hidden shrink-0">
      <div
        className="h-full rounded-full bg-spark transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Egzersizin sorusu: "Ne duyuyorsun?", "Türkçesi hangisi?"...
 *
 * Kucuk ve soluktu (14px, en acik gri) — kullanici "cok zayif, gorunmuyor"
 * dedi. Ekranda o an ne yapilacagini soyleyen tek cumle bu; kelimenin
 * kendisinden sonra en okunur sey olmali.
 */
export function Yonerge({ children }: { children: ReactNode }) {
  return <span className="text-lg font-extrabold text-ink-soft text-center">{children}</span>;
}

/**
 * Ses kancasi — urunun imzasi.
 * Fosforlu kalem izi: kanca zaten "isaretlenmis" seydir.
 */
export function HookChip({ children, big = false }: { children: ReactNode; big?: boolean }) {
  return (
    <span
      className={`marker word font-bold text-ink ${big ? 'text-xl' : 'text-base'}`}
    >
      {children}
    </span>
  );
}

/**
 * Telaffuz dugmesi.
 *
 * Kancanin ogretemedigi tek sey dogru telaffuz; bu dugme onu verir.
 * NEREDE gorunecegine cagiran karar verir — kart yuzlerinde yalnizca
 * kanca ekrandan kalkarken (L1/L0) cikar, bkz. speech.ts.
 */
export function SpeakButton({
  word,
  size = 'normal',
}: {
  word: string;
  size?: 'normal' | 'small';
}) {
  const sesVar = useTelaffuz();
  if (!sesVar) return null;
  const kucuk = size === 'small';
  return (
    <button
      type="button"
      aria-label={`${word} nasil okunur`}
      onClick={(e) => {
        e.stopPropagation(); // kart yuzunde "cevabi goster"i tetiklemesin
        seslendir(word);
      }}
      className={`shrink-0 inline-flex items-center justify-center rounded-full bg-sunken transition-all active:scale-90 hover:bg-brand-soft ${
        kucuk ? 'h-11 w-11' : 'h-14 w-14'
      }`}
    >
      <Ikon ad="ses" className={kucuk ? 'h-6 w-6' : 'h-8 w-8'} />
    </button>
  );
}

export function Streak({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-bold shadow-[var(--shadow-soft)]">
      <Ikon ad="seri" className="bob h-4 w-4" />
      <span className="tabular-nums">{count}</span>
    </span>
  );
}
