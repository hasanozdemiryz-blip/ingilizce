import { useEffect, useState } from 'react';
import { Avatar } from './Avatar';
import { CikisOnayi } from './Cikis';
import { Card } from './ui';
import { uyeAdi, type Uye } from '../uyelik';
import type { Profil } from '../types';

/**
 * "Giris yapildi" isareti — yesil tik ve giris yolu.
 *
 * Kullanici "login oldugu anlasilmiyor" dedi: menude girisli de girissiz de
 * ayni "Hesabim" yaziyordu. Bu rozet girisli kullanicinin gordugu her yerde
 * (yan menu, ana ekran basligi, hesap menusu) ayni sekilde duruyor.
 */
export function GirisRozeti({ uye, kucuk = false }: { uye: Uye; kucuk?: boolean }) {
  const yol = uye.saglayici === 'google' ? 'Google ile' : 'E-posta ile';
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-grow-deep ${
        kucuk ? 'text-[11px]' : 'text-xs'
      }`}
    >
      <span
        aria-hidden
        className={`grid place-items-center rounded-full bg-grow text-white ${
          kucuk ? 'h-3.5 w-3.5 text-[9px]' : 'h-4 w-4 text-[10px]'
        }`}
      >
        ✓
      </span>
      {kucuk ? 'Giriş yapıldı' : `${yol} giriş yapıldı`}
    </span>
  );
}

/**
 * HESAP MENUSU — avatara dokununca.
 *
 * Once avatar dogrudan Ayarlar'a gidiyordu ve cikis o uzun sayfanin en
 * dibindeydi. Artik avatar bir menu aciyor: kim olarak girildigi, profil,
 * ayarlar ve cikis — her uygulamada profil resminin altinda duran sey.
 */
export function HesapMenusu({
  uye,
  profil,
  onProfil,
  onAyarlar,
  onKapat,
}: {
  uye: Uye;
  profil?: Profil;
  onProfil: () => void;
  onAyarlar: () => void;
  onKapat: () => void;
}) {
  const [cikisAcik, setCikisAcik] = useState(false);

  useEffect(() => {
    const tus = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onKapat();
    };
    window.addEventListener('keydown', tus);
    return () => window.removeEventListener('keydown', tus);
  }, [onKapat]);

  if (cikisAcik) return <CikisOnayi onKapat={onKapat} />;

  const sec = (f: () => void) => () => {
    onKapat();
    f();
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 px-5 pb-8 backdrop-blur-sm sm:items-center sm:pb-0"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onKapat();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Hesap menüsü"
    >
      <Card className="rise w-full max-w-sm p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          {profil && <Avatar avatar={profil.avatar} cerceve={profil.cerceve} boyut="sm" />}
          <div className="min-w-0">
            <p className="word truncate text-lg font-extrabold text-ink">{uyeAdi(uye)}</p>
            {uye.eposta && <p className="truncate text-sm text-ink-soft">{uye.eposta}</p>}
            <div className="mt-1">
              <GirisRozeti uye={uye} />
            </div>
          </div>
        </div>
        <div className="border-t border-line">
          <MenuSatiri onClick={sec(onProfil)}>Profili düzenle</MenuSatiri>
          <MenuSatiri onClick={sec(onAyarlar)}>Hesabım ve ayarlar</MenuSatiri>
          <MenuSatiri onClick={() => setCikisAcik(true)} vurgu>
            Çıkış yap
          </MenuSatiri>
        </div>
      </Card>
    </div>
  );
}

function MenuSatiri({
  children,
  onClick,
  vurgu = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  vurgu?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between border-b border-line px-5 py-4 text-left font-bold transition last:border-b-0 hover:bg-sunken active:bg-sunken ${
        vurgu ? 'text-[#c2417f]' : 'text-ink'
      }`}
    >
      {children}
      <span className="text-ink-faint" aria-hidden>
        ›
      </span>
    </button>
  );
}
