import { useState } from 'react';
import { SetFinale } from '../components/SetFinale';
import { Giris } from '../components/Giris';
import { Button, Ikon, Screen, Streak } from '../components/ui';
import { useUyelik, uyelikVarMi } from '../uyelik';
import { siradakiDavet } from '../davet';
import { CARD_BY_ID } from '../content';
import type { Kazanim } from '../cerceveler';
import { t } from '../dil';

/**
 * Ders bitisi.
 *
 * ONE CIKAN SEY OGRENILEN KELIMELER. Once ekranin ortasinda buyuk bir
 * "%87" ve "26 dogru · 4 yanlis" duruyordu; sinav kagidi gibiydi ve
 * kullanicinin eline ne gectigini gostermiyordu. Artik yeni kelimeler
 * gorselleri ve kancalariyla listeleniyor; dogru sayisi tek satir.
 *
 * `ilerleyen` hala gosteriliyor ama sade dille ("daha saglam"): yardimsiz
 * dogru gerekiyor (bkz. scheduler.ts), kancaya basip dogru bilen ilerlemez.
 */
export function SessionDone({
  count,
  streak,
  dogru,
  toplam,
  ilerleyen,
  yeniIdler,
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
  /** Bu derste tanisilan kelimeler */
  yeniIdler: readonly string[];
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
  const yeniKelimeler = yeniIdler.map((id) => CARD_BY_ID.get(id)).filter((c) => c !== undefined);

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
      <div className="flex-1 flex flex-col justify-center items-center gap-3 text-center py-2">
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
            <Ikon ad="ogren" className="pop h-11 w-11 mx-auto" />

            <div className="rise delay-1">
              <h1 className="word text-3xl font-bold">{t('Ders bitti')}</h1>
              <p className="text-ink-soft mt-1.5 tabular-nums">
                {yeniKelimeler.length > 0
                  ? t('{n} yeni kelime öğrendin', { n: yeniKelimeler.length })
                  : t('{n} kelime tekrar ettin', { n: count })}
              </p>
            </div>

            {yeniKelimeler.length > 0 && (
              <ul className="rise delay-2 w-full max-w-sm flex flex-col gap-1.5 text-left">
                {yeniKelimeler.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-surface p-1.5 pr-3.5 shadow-[var(--shadow-soft)]">
                    {c.image ? (
                      <img src={c.image} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover bg-sunken" />
                    ) : (
                      <span className="h-10 w-10 shrink-0 rounded-xl bg-sunken" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="word block font-extrabold leading-tight">{c.en}</span>
                      <span className="block text-sm text-ink-soft truncate">{c.tr}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-spark-soft px-2.5 py-1 text-sm font-bold">
                      {`≈ ${c.hook}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {toplam > 0 && (
              <p className="rise delay-3 text-sm text-ink-soft tabular-nums">
                {t('{dogru} / {toplam} doğru', { dogru, toplam })}
                {/*
                  Sifirsa gosterilmiyor: yeni kelimelerden olusan derste
                  merdiven oynamaz, "0 kelime" yazmak yaniltici olurdu.
                */}
                {ilerleyen > 0 && (
                  <>
                    <br />
                    <span className="font-bold text-[#128a5f]">
                      {t('{n} kelime daha sağlam', { n: ilerleyen })}
                    </span>
                  </>
                )}
              </p>
            )}
          </>
        )}

        {streak > 0 && (
          <div className="rise delay-3 flex items-center gap-2">
            <Streak count={streak} />
            <span className="text-sm text-ink-faint">
              {streak === 1 ? t('İlk günün') : t('{streak} gündür aralıksız', { streak })}
            </span>
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
