import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, Ikon, Screen, Streak } from '../components/ui';
import { getAnswers } from '../db';
import { TAB_SPACE } from '../components/TabBar';
import { FREEZE_MAX } from '../dates';
import { CARDS } from '../content';
import { PENCERELER, abilities, activeDays, successRate, type Pencere } from '../score';
import type { AppState, Cevap, Progress as ProgressRow } from '../types';
import { t } from '../dil';

/**
 * Saglam sayilan basamak: 5 ve ustu, yani kelimeyi BASTAN YAZABILIYOR
 * (bkz. exercise.ts, uretim bolgesi).
 */
const SAGLAM_ADIM = 5;

/**
 * ILERLEME — profil.
 *
 * Once burada 12 haftalik bir isi haritasi vardi. Kaldirildi:
 *   · Serinin zaten soyledigi seyi 84 kareyle tekrar ediyordu
 *   · "Seri: odul var, ceza yok" ilkesine aykiriydi — bos kareler bir
 *     kacirilan gunler defteriydi, yeni baslayan biri hiclik duvari goruyordu
 *   · Telefon genisligine sigmiyor, kenarlari kirpiliyordu
 *
 * 7 Ekim: ayni sayi uc kez yaziyordu ("%87", "30 alistirmanin 26'si",
 * "5 kelime · 30 cevap · 4 yanlis"), ilk gun "%20 kalicilik" gibi moral
 * bozan bir yuzde ve aciklama dipnotlari vardi. Artik ekran uc soruya
 * cevap veriyor: setin ne kadari bende, ne kadar dogru yapiyorum, neyi
 * yapabiliyorum.
 */
export function ProgressScreen({
  state,
  progress,
  onWords,
}: {
  state: AppState;
  progress: ProgressRow[];
  onWords: () => void;
}) {
  const [pencere, setPencere] = useState<Pencere>('hafta');

  /*
    Cevaplar burada okunuyor, App'te degil: gunluk buyuyen tek tablo bu ve
    ana ekranin her ciziminde bastan okunmasinin anlami yok.
  */
  const cevaplar = useLiveQuery(getAnswers, [], [] as Cevap[]);

  const ogrenilen = progress.filter((p) => p.introduced).length;
  const saglam = progress.filter((p) => p.introduced && p.step >= SAGLAM_ADIM).length;
  const setPct = CARDS.length > 0 ? Math.round((ogrenilen / CARDS.length) * 100) : 0;

  const basari = successRate(cevaplar, pencere);
  const duzen = activeDays(state.days, pencere);
  const yetenek = abilities(progress, cevaplar);

  return (
    <Screen>
      <header className="flex items-center justify-between h-14 shrink-0">
        <span className="word text-lg font-bold">{t('İlerleme')}</span>
        {state.streakCount > 0 && <Streak count={state.streakCount} />}
      </header>

      <div className={`flex-1 flex flex-col gap-3 ${TAB_SPACE}`}>
        {/* --- Setin ne kadari: tek buyuk sayi --- */}
        <button
          onClick={onWords}
          className="rise rounded-card bg-gradient-to-br from-ink to-[#2c3d5c] p-5 text-left text-white shadow-[var(--shadow-lift)] transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <Ikon ad="kartlar" ters className="h-8 w-8 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="word block text-2xl font-extrabold tabular-nums">
                {t('{a} / {b} kelime', { a: ogrenilen, b: CARDS.length })}
              </span>
              <span className="block text-sm text-white/70 mt-0.5">
                {saglam > 0
                  ? t('{n} kelimeyi sağlam biliyorsun', { n: saglam })
                  : t('Öğrendiğin kelimeler ve kancaları')}
              </span>
            </span>
            <span className="text-xl text-white/60">›</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-white/15 overflow-hidden mt-4">
            <div
              className="h-full rounded-full bg-spark transition-[width] duration-700"
              style={{ width: `${setPct}%` }}
            />
          </div>
        </button>

        {/* --- Dogruluk: donemsel, tek satir --- */}
        <Card className="rise delay-1">
          <h2 className="text-sm font-bold text-ink-soft mb-2.5">{t('Doğruluk')}</h2>
          {/* Dort pencere tek satira sigmiyordu; grid esit boler */}
          <div className="grid grid-cols-4 gap-1 rounded-full bg-sunken p-1 mb-4">
            {PENCERELER.map((p) => (
              <button
                key={p.id}
                onClick={() => setPencere(p.id)}
                className={`rounded-full py-1.5 text-xs font-bold transition-all ${
                  pencere === p.id ? 'bg-white text-ink shadow-[var(--shadow-soft)]' : 'text-ink-faint'
                }`}
              >
                {p.ad}
              </button>
            ))}
          </div>

          {basari ? (
            <>
              <p className="word text-center text-3xl font-extrabold tabular-nums leading-none">
                {t('{dogru} / {toplam} doğru', { dogru: basari.dogru, toplam: basari.toplam })}
              </p>
              <div className="h-2.5 w-full rounded-full bg-sunken overflow-hidden mt-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-[#7db2ff] transition-[width] duration-700"
                  style={{ width: `${basari.percent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-ink-faint py-4">{t('Bu dönemde henüz cevap yok.')}</p>
          )}

          <p className="text-center text-xs text-ink-faint mt-3">
            {pencere === 'gun'
              ? duzen.calisilan > 0
                ? t('Bugün çalıştın.')
                : t('Bugün henüz çalışmadın.')
              : duzen.toplam === null
                ? t('Toplam {calisilan} gün çalıştın.', { calisilan: duzen.calisilan })
                : t('Son {toplam} günde {calisilan} gün çalıştın.', { toplam: duzen.toplam, calisilan: duzen.calisilan })}
          </p>
        </Card>

        {/* --- Neler yapabiliyorsun: BIRIKIMLI --- */}
        {yetenek.toplam > 0 && (
          <Card className="rise delay-2">
            <h2 className="text-sm font-bold text-ink-soft mb-3">{t('Neler yapabildin')}</h2>
            {/*
              Panel MERDIVEN konumunu degil YAPILANI sayiyor (bkz. score.ts
              `abilities`); kancaya bakmadan yapilanlar.
            */}
            <div className="flex flex-col gap-3">
              <Yetenek ad={t('Tanıştım')} sayi={yetenek.taniyor} toplam={yetenek.toplam} renk="bg-brand" />
              <Yetenek
                ad={t('Türkçesinden seçtim')}
                sayi={yetenek.seciyor}
                toplam={yetenek.toplam}
                renk="bg-spark"
              />
              <Yetenek ad={t('Baştan yazdım')} sayi={yetenek.yaziyor} toplam={yetenek.toplam} renk="bg-grow" />
            </div>
          </Card>
        )}

        <Card className="rise delay-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">{t('Seri koruma')}</p>
              <p className="text-sm text-ink-soft mt-0.5">
                {t('Bir gün kaçırırsan seriyi korur. 7 günde bir kazanılır.')}
              </p>
            </div>
            <div className="flex gap-1 shrink-0 ml-3">
              {Array.from({ length: FREEZE_MAX }, (_, i) => (
                <Ikon
                  key={i}
                  ad="koruma"
                  className={`h-7 w-7 ${i < state.freezes ? '' : 'opacity-25 saturate-0'}`}
                />
              ))}
            </div>
          </div>
        </Card>
      </div>
    </Screen>
  );
}

/**
 * Birikimli beceri satiri. Ust basamaktaki kelime alttakileri de
 * yapabildigi icin cubuklar ic ice dolar — asagi indikce kisalir.
 */
function Yetenek({
  ad,
  sayi,
  toplam,
  renk,
}: {
  ad: string;
  sayi: number;
  toplam: number;
  renk: string;
}) {
  const pct = toplam > 0 ? Math.round((sayi / toplam) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className="text-sm font-bold">{ad}</span>
        <span className="text-sm tabular-nums shrink-0">
          <span className="font-extrabold">{sayi}</span>
          <span className="text-ink-faint"> / {toplam}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-sunken overflow-hidden">
        <div className={`h-full rounded-full ${renk} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
