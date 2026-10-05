import { useState } from 'react';
import { olay } from '../analitik';
import { profilAdiniGuncelle } from '../db';
import { Avatar } from './Avatar';
import { Secenekler } from './Giris';
import { GirisRozeti } from './HesapMenusu';
import { Button, Card } from './ui';
import {
  HEDEFLER,
  SEVIYELER,
  bilgiKaydet,
  uyeAdi,
  type Hedef,
  type Seviye,
  type Uye,
} from '../uyelik';
import type { Profil } from '../types';
import { t } from '../dil';

/**
 * "GIRIS YAPILDI" — her giristen sonra bir kez.
 *
 * Kullanici "giris yapildigi anlasilmiyor" dedi: pencere kapaniyor, ekran
 * oldugu gibi kaliyordu. Burada acikca soyleniyor — kim olarak, hangi
 * yolla girildi ve ilerlemenin hesaba baglandigi.
 *
 * BILGILER ISTEGE BAGLI. Once e-postayla gelen kullanici zorunlu bir
 * "Seni taniyalim" adimina dusuyordu. Kullanicinin istegi: "ister
 * doldursun ister doldurmasin". Ad, seviye ve hedef ayni ekranda ama
 * "Devam" hicbirini sart kosmuyor; yalnizca degisen sey kaydediliyor.
 */
export function GirisYapildi({
  uye,
  profil,
  onKapat,
}: {
  uye: Uye;
  profil?: Profil;
  onKapat: () => void;
}) {
  const ilkAd = uyeAdi(uye);
  /*
    Alan e-postadan uretilen adla DOLDURULMUYOR, yalnizca ipucu olarak
    gorunuyor: dokunmadan "Devam" diyen kullanicinin adi `hasanozdemiryz`
    olarak hesabina yazilmasin.
  */
  const baslangicAdi = uye.bilgi?.ad ?? uye.saglayiciAdi ?? '';
  const [ad, setAd] = useState(baslangicAdi);
  const [seviye, setSeviye] = useState<Seviye | null>(uye.bilgi?.seviye ?? null);
  const [hedef, setHedef] = useState<Hedef | null>(uye.bilgi?.hedef ?? null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  const degisti =
    ad.trim() !== baslangicAdi ||
    seviye !== (uye.bilgi?.seviye ?? null) ||
    hedef !== (uye.bilgi?.hedef ?? null);

  async function devam() {
    olay('giris_yapildi', { yol: uye.saglayici ?? 'bilinmiyor', bilgi: degisti });
    const temizAd = ad.trim() || ilkAd;
    if (degisti) {
      setKaydediliyor(true);
      const sonuc = await bilgiKaydet({
        ad: temizAd,
        ...(seviye ? { seviye } : {}),
        ...(hedef ? { hedef } : {}),
      });
      setKaydediliyor(false);
      if (!sonuc.oldu) {
        setHata(sonuc.hata ?? t('Kaydedilemedi.'));
        return;
      }
    }
    // Ana ekrandaki ad hesaptaki adla ayni olsun.
    await profilAdiniGuncelle(temizAd);
    onKapat();
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-ink/45 px-5 pb-8 backdrop-blur-sm sm:items-center sm:pb-0"
      role="dialog"
      aria-modal="true"
      aria-label={t('Giriş yapıldı')}
    >
      <Card className="rise w-full max-w-md p-6 max-h-[calc(100dvh-4rem)] overflow-y-auto">
        <div className="flex flex-col items-center text-center">
          <div className="pop grid h-16 w-16 place-items-center rounded-full bg-grow text-3xl font-extrabold text-white shadow-[0_10px_24px_-10px_rgba(43,196,138,0.9)]">
            ✓
          </div>
          <p className="word mt-3 text-2xl font-extrabold">{t('Giriş yapıldı')}</p>
          <div className="mt-3 flex items-center gap-2.5">
            {profil && <Avatar avatar={profil.avatar} cerceve={profil.cerceve} boyut="sm" />}
            <div className="min-w-0 text-left">
              <p className="truncate font-extrabold text-ink">{ilkAd}</p>
              {uye.eposta && <p className="truncate text-sm text-ink-soft">{uye.eposta}</p>}
              <GirisRozeti uye={uye} />
            </div>
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            {t('İlerlemen hesabına bağlandı. Hangi cihazdan girersen gir kaldığın yerden devam edersin.')}
          </p>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm font-bold text-ink">
            {t('İstersen kendini tanıt')}{' '}<span className="font-semibold text-ink-faint">{t('· isteğe bağlı')}</span>
          </p>
          <label className="mt-3 block">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">{t('Adın')}</span>
            <input
              type="text"
              autoComplete="given-name"
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder={ilkAd}
              className="mt-1.5 w-full rounded-2xl border border-line bg-sunken px-4 py-3 text-base text-ink outline-none focus:border-ink/30 focus:ring-2 focus:ring-ink/15"
            />
          </label>
          <Secenekler
            baslik={t('İngilizcen ne durumda?')}
            secenekler={SEVIYELER}
            secili={seviye}
            sec={setSeviye}
          />
          <Secenekler baslik={t('Niçin öğreniyorsun?')} secenekler={HEDEFLER} secili={hedef} sec={setHedef} />
        </div>

        {hata && <p className="mt-3 text-sm text-[#c2417f]">{hata}</p>}
        <div className="mt-5">
          <Button variant="spark" disabled={kaydediliyor} onClick={() => void devam()}>
            {kaydediliyor ? t('Kaydediliyor…') : t('Devam')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
