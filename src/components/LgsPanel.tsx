import { useState } from 'react';
import { Button, Card } from './ui';
import { UNITELER } from '../lgs';
import { uniteKartlari } from '../content';
import type { Progress } from '../types';
import { t } from '../dil';

type Props = {
  progress: Progress[];
  yil?: 2027 | 2028;
  unite?: number;
  onYil: (yil: 2027 | 2028) => void;
  onUnite: (no: number) => void;
  /** Unite sayfasini ac (kaliplar, diyaloglar, test) */
  onUniteAc: (no: number) => void;
};

/**
 * LGS ANA PANELI — ana ekranin ustunde, ders kartinin hemen uzerinde.
 *
 * Sira (KARARLAR 7): once "Hangi yıl?" (bir kez), sonra "Okulda hangi
 * ünitedesin?" (bir kez), sonra calisilan unitenin karti. Uniteler
 * KILITSIZ: her an baska uniteye gecilebilir; secim yalnizca yeni
 * kelimelerin hangi uniteden gelecegini belirliyor.
 */
export function LgsPanel({ progress, yil, unite, onYil, onUnite, onUniteAc }: Props) {
  const [uniteSeciliyor, setUniteSeciliyor] = useState(false);

  if (!yil) {
    return (
      <Card className="rise">
        <p className="text-sm font-bold text-ink-soft">LGS</p>
        <p className="word text-2xl font-extrabold mt-0.5 mb-4">{t('Hangi yıl LGS’ye gireceksin?')}</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="spark" onClick={() => onYil(2027)}>
            2027
          </Button>
          <Button variant="soft" onClick={() => onYil(2028)}>
            2028
          </Button>
        </div>
      </Card>
    );
  }

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
                  <span className="text-2xl" aria-hidden>
                    {u.ikon}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold opacity-70">{t('{n}. ünite', { n: u.no })}</span>
                    <span className="word block font-extrabold leading-tight">{u.ad}</span>
                    <span className="block text-sm opacity-75">{u.tr}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums opacity-80">
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
  return (
    <Card className="rise !py-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl" aria-hidden>
          {u.ikon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-ink-soft">
            {t('{n}. ünite', { n: u.no })} · {u.tr}
          </p>
          <p className="word text-xl font-extrabold leading-tight">{u.ad}</p>
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
      <Button variant="soft" className="mt-3 !py-3" onClick={() => onUniteAc(unite)}>
        {t('Kalıplar, diyaloglar ve ünite testi')}
      </Button>
    </Card>
  );
}
