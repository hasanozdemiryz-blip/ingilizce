import { useState } from 'react';
import { SetFinale } from '../components/SetFinale';
import { Giris } from '../components/Giris';
import { Button, Ikon, Screen, Streak } from '../components/ui';
import { useUyelik, uyelikVarMi } from '../uyelik';
import { siradakiDavet } from '../davet';
import type { Kazanim } from '../cerceveler';
import { t } from '../dil';

/**
 * Ders bitisi.
 *
 * Iki sayi gosterir ve ikincisi daha onemli:
 *   yuzde     — bu seans nasil gecti
 *   ilerleyen — bu seans ne KAZANDIRDI
 *
 * Dogru cevap vermek ilerlemek demek degil: merdivende yukari cikmak icin
 * YARDIMSIZ dogru gerekiyor (bkz. scheduler.ts). Kanca ipucuna basip dogru
 * bilen kullanici %100 alir ama hicbir kelime ilerlemez — bunu gormesi
 * lazim, yoksa yuzde yaniltir.
 */
export function SessionDone({
  count,
  streak,
  dogru,
  toplam,
  ilerleyen,
  setBitti,
  kancalar,
  kazanim,
  davetGorulen,
  onDavetKapandi,
  onHome,
}: {
  count: number;
  streak: number;
  dogru: number;
  toplam: number;
  /** Bu seansta bir basamak yukari cikan kelime sayisi */
  ilerleyen: number;
  /** Bu ders setin SON kelimelerini getirdiyse true — bir kez yasanan an */
  setBitti: boolean;
  kancalar: { en: string; hook: string }[];
  /** Davet esikleri bundan besleniyor (bkz. davet.ts). */
  kazanim: Kazanim;
  davetGorulen: readonly string[];
  /** "Sonra" denince o ESIK susuyor — seans degil. */
  onDavetKapandi: (id: string) => void;
  onHome: () => void;
}) {
  const yuzde = toplam > 0 ? Math.round((dogru / toplam) * 100) : null;

  /*
    Uyelik daveti BURADA, kapida degil. Kayit ekrani ilk acilista cikarsa
    kullanici urunu gormeden karar vermek zorunda kalir; ders bitince
    elinde korunmaya deger bir sey var ve teklif anlam kazaniyor.

    Her derste DEGIL, yalnizca kilometre taslarinda (bkz. davet.ts) —
    her gun ayni seyi demek yildiriyor. Zaten uye olana ve uyelik
    kapaliyken hic cikmiyor.
  */
  const { uye, hazir } = useUyelik();
  const [girisAcik, setGirisAcik] = useState(false);
  const [kapatildi, setKapatildi] = useState(false);
  const davet =
    // `hazir` olmadan girisli kullaniciya da "uye ol" gorunup kayboluyordu
    uyelikVarMi() && hazir && !uye && !kapatildi
      ? siradakiDavet(kazanim, davetGorulen)
      : null;

  return (
    <Screen yanMenusuz>
      <div className="flex-1 flex flex-col justify-center items-center gap-5 text-center">
        {/*
          Seti bitiren ders: seans yuzdesi geri cekiliyor. O an "%80 aldin"
          degil "bitirdin" ani; iki basligi yan yana koymak ikisini de
          kuculturdu. Yuzde zaten Ilerleme'de duruyor.
        */}
        {setBitti ? (
          <div className="rise">
            <SetFinale kancalar={kancalar} variant="ekran" />
          </div>
        ) : (
          <>
            <Ikon ad="ogren" className="pop h-16 w-16 mx-auto" />

            <div className="rise delay-1">
              <h1 className="word text-3xl font-bold">{t('Ders bitti')}</h1>
              <p className="text-ink-soft mt-2">{t('{n} kelime çalıştın.', { n: count })}</p>
            </div>
          </>
        )}

        {!setBitti && yuzde !== null && (
          <div className="rise delay-2 w-full max-w-[16rem]">
            <p className="word text-5xl font-extrabold tabular-nums leading-none">%{yuzde}</p>
            <p className="text-sm text-ink-soft mt-2">
              {t('{dogru} doğru · {yanlis} yanlış', { dogru, yanlis: toplam - dogru })}
            </p>
            <div className="h-2.5 w-full rounded-full bg-white/70 overflow-hidden mt-3">
              <div
                className="h-full rounded-full bg-spark transition-[width] duration-700"
                style={{ width: `${yuzde}%` }}
              />
            </div>
          </div>
        )}

        {/*
          Sifirsa hic gosterilmiyor: yeni kelimelerden olusan bir derste
          ogrenme testi merdiveni oynatmaz, "0 kelime ilerledi" yazmak
          dogru ama yaniltici olurdu.
        */}
        {ilerleyen > 0 && (
          <p className="rise delay-3 text-sm font-bold text-[#128a5f] bg-grow-soft rounded-full px-4 py-2">
            {t('{n} kelime bir basamak ilerledi', { n: ilerleyen })}
          </p>
        )}

        {streak > 0 && (
          <div className="rise delay-3">
            <Streak count={streak} />
            <p className="text-sm text-ink-faint mt-2">
              {streak === 1 ? t('İlk günün') : t('{streak} gündür aralıksız', { streak })}
            </p>
          </div>
        )}
      </div>

      <div className="shrink-0 rise delay-3 flex flex-col gap-3">
        {davet && (
          <div className="rounded-card bg-surface px-5 py-4 text-left shadow-[var(--shadow-soft)]">
            <p className="text-sm font-bold">{davet.baslik}</p>
            <p className="mt-1 text-sm text-ink-soft">{davet.metin}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setGirisAcik(true)}
                className="rounded-2xl bg-spark px-4 py-2 text-sm font-bold text-ink active:scale-95 transition"
              >
                {uye ? t('Tamamla') : t('Hesap aç')}
              </button>
              <button
                onClick={() => {
                  setKapatildi(true);
                  onDavetKapandi(davet.id);
                }}
                className="rounded-full px-3 py-2 text-sm font-semibold text-ink-faint active:scale-95 transition"
              >
                {t('Sonra')}
              </button>
            </div>
          </div>
        )}
        <Button onClick={onHome}>{t('Ana ekran')}</Button>
      </div>

      {girisAcik && (
        <Giris baslangicKip={uye ? 'bilgi' : 'kayit'} onKapat={() => setGirisAcik(false)} />
      )}
    </Screen>
  );
}
