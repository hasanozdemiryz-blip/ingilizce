import { useState } from 'react';
import { UniteGorseli } from './UniteGorseli';
import { Button, Card } from './ui';
import { lgsyeKalanGun, UNITE_SAYILARI, uniteBittiMi, uniteKalipDurumu, UNITELER } from '../lgs';
import { uniteKartlari } from '../content';
import type { AppState, Progress } from '../types';
import { t } from '../dil';

type Props = {
  progress: Progress[];
  yil: 2027 | 2028;
  unite?: number;
  lgsKalip?: AppState['lgsKalip'];
  lgsDiyalog?: AppState['lgsDiyalog'];
  lgsTest?: AppState['lgsTest'];
  onUnite: (no: number) => void;
  /** Unite sayfasini ac (kaliplar, diyaloglar, test) */
  onUniteAc: (no: number) => void;
};

/**
 * LGS ANA PANELI — ana ekranin ustunde, ders kartinin hemen uzerinde.
 *
 * Sira: "Okulda hangi ünitedesin?" (bir kez), sonra calisilan unitenin
 * karti. Yil sorusu 10 Kasim 2026'da kalkti (kullanici: herkese sade akis);
 * yil 2027 varsayiliyor. Uniteler
 * KILITSIZ: her an baska uniteye gecilebilir; secim yalnizca yeni
 * kelimelerin hangi uniteden gelecegini belirliyor.
 */
export function LgsPanel({ progress, yil, unite, lgsKalip, lgsDiyalog, lgsTest, onUnite, onUniteAc }: Props) {
  const [uniteSeciliyor, setUniteSeciliyor] = useState(false);

  const ogrenilen = new Set(progress.filter((p) => p.introduced || p.bilinen).map((p) => p.cardId));
  const durum = (no: number) => {
    const kartlar = uniteKartlari(no);
    return { bitti: kartlar.filter((c) => ogrenilen.has(c.id)).length, toplam: kartlar.length };
  };

  if (!unite || uniteSeciliyor) {
    return (
      <Card className="rise">
        <p className="word text-2xl font-extrabold">{t('Okulda hangi ünitedesin?')}</p>
        <p className="text-sm text-ink-soft mt-1 mb-4">
          {yil === 2028
            ? t('2028 Maarif programının kitapları çıkınca o üniteler gelecek. Şimdilik 8. sınıf ünitelerini çalışabilirsin; kelimelerin çoğu ortak.')
            : t('Yeni kelimeler önce bu üniteden gelir. İstediğin zaman değiştirebilirsin.')}
        </p>
        <ul className="grid gap-2">
          {UNITELER.map((u) => {
            const d = durum(u.no);
            return (
              <li key={u.no}>
                <button
                  type="button"
                  onClick={() => {
                    onUnite(u.no);
                    setUniteSeciliyor(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] ${
                    u.no === unite ? 'bg-brand text-white' : 'bg-sunken hover:bg-brand-soft'
                  }`}
                >
                  <UniteGorseli no={u.no} className="h-11 w-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold opacity-70">{t('{n}. ünite', { n: u.no })}</span>
                    <span className="word block font-extrabold leading-tight">{u.ad}</span>
                    <span className="block text-sm opacity-75">{u.tr}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums opacity-80">
                    {uniteBittiMi(d.bitti, d.toplam, lgsTest?.[String(u.no)]) ? '✓ ' : ''}
                    {d.bitti}/{d.toplam}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {unite && (
          <Button variant="ghost" className="mt-2" onClick={() => setUniteSeciliyor(false)}>
            {t('Vazgeç')}
          </Button>
        )}
      </Card>
    );
  }

  const u = UNITELER[unite - 1];
  const d = durum(unite);
  const pct = d.toplam ? Math.round((d.bitti / d.toplam) * 100) : 0;
  const kd = uniteKalipDurumu(unite, lgsKalip, lgsDiyalog);
  const say = UNITE_SAYILARI[unite];
  const kalanGun = lgsyeKalanGun();
  return (
    <Card className="rise !py-4 overflow-hidden">
      {/* LGS'ye kalan gun (PLAN v3): LGS'li icin her gunun anlami bu sayi */}
      {kalanGun > 0 && (
        <div className="-mx-5 -mt-4 mb-3 flex items-center justify-between bg-[#16233a] px-5 py-2 text-white">
          <span className="text-xs font-bold text-white/75">{t('LGS 2027')}</span>
          <span className="text-sm font-extrabold">
            <span className="text-spark tabular-nums">{kalanGun}</span> {t('gün kaldı')}
          </span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <UniteGorseli no={u.no} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-ink-soft">
            {t('{n}. ünite', { n: u.no })} · {u.tr}
          </p>
          <p className="word text-xl font-extrabold leading-tight">
            {u.ad}
            {uniteBittiMi(d.bitti, d.toplam, lgsTest?.[String(u.no)]) && (
              <span className="ml-2 align-middle rounded-full bg-grow-soft px-2 py-0.5 text-[11px] font-extrabold text-grow-deep">
                ✓ {t('tamamlandı')}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setUniteSeciliyor(true)}
          className="shrink-0 rounded-full bg-sunken px-3 py-1.5 text-xs font-bold text-ink-soft transition hover:bg-brand-soft active:scale-95"
        >
          {t('Değiştir')}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2.5 flex-1 rounded-full bg-sunken overflow-hidden">
          <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold tabular-nums text-ink-soft">
          {t('{a}/{b} kelime', { a: d.bitti, b: d.toplam })}
        </span>
      </div>
      {/* Kalip ve diyalog: ders sonu "Pekistir"de ilerliyor (PLAN v3) */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold text-ink-soft">
        <span className="rounded-xl bg-sunken px-3 py-1.5 tabular-nums">
          {t('Kalıp {a}/{b}', { a: kd.kalip, b: say.kalip })}
        </span>
        <span className="rounded-xl bg-sunken px-3 py-1.5 tabular-nums">
          {t('Diyalog {a}/{b}', { a: kd.diyalog, b: say.diyalog })}
        </span>
      </div>
      <Button variant="soft" className="mt-3 !py-3" onClick={() => onUniteAc(unite)}>
        {t('Kalıplar, diyaloglar ve ünite testi')}
      </Button>
    </Card>
  );
}
