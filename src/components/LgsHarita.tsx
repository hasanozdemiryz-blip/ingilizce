import { UniteGorseli } from './UniteGorseli';
import { Card } from './ui';
import { CARDS, uniteKartlari } from '../content';
import { LGS_TEKRAR_PAYI, lgsGunlukGereken, lgsyeKalanGun, UNITE_SAYILARI, uniteBittiMi, uniteKalipDurumu, UNITELER } from '../lgs';
import type { AppState, Progress } from '../types';
import { t } from '../dil';

/** Hiz olculurken bakilan gun sayisi. */
const HIZ_GUN = 14;

/**
 * LGS ILERLEMESI (31 Ekim, PLAN v3): Genel'in ekrani yalniz kelime sayiyordu;
 * LGS'de soru "sinava yetisecek miyim, hangi unite eksik". Iki kart:
 * sinav (kalan gun + bu hizla ne zaman biter) ve 10 unitelik harita.
 */
export function LgsHarita({
  state,
  progress,
  onUniteAc,
}: {
  state: AppState;
  progress: Progress[];
  onUniteAc: (no: number) => void;
}) {
  const ogrenilen = new Set(progress.filter((p) => p.introduced || p.bilinen).map((p) => p.cardId));
  const kalanKelime = Math.max(0, CARDS.length - ogrenilen.size);
  const kalanGun = lgsyeKalanGun();

  /*
    Son 14 gunde gunde ortalama kac yeni kelime. Kelimenin tanisma tarihinden
    (`introducedAt`) sayiliyor: `days[].i` eski bir alan, artik dolmuyor.
    Yeni baslayanda pencere ilk kelimeden bugune kadar: ilk gun 5 kelime
    ogrenen "gunde 0,4" diye gorunmesin.
  */
  const simdi = Date.now();
  const tarihler = progress
    .filter((p) => p.introduced && p.introducedAt)
    .map((p) => new Date(p.introducedAt as unknown as string).getTime())
    .filter((z) => Number.isFinite(z) && simdi - z <= HIZ_GUN * 864e5);
  const ilk = tarihler.length ? Math.min(...tarihler) : simdi;
  const pencere = Math.min(HIZ_GUN, Math.max(1, Math.ceil((simdi - ilk) / 864e5) || 1));
  const hiz = tarihler.length / pencere;
  const gerekenGun = hiz > 0 ? Math.ceil(kalanKelime / hiz) : null;
  const gunlukGereken = lgsGunlukGereken(kalanKelime);
  const yetisiyor = gerekenGun !== null && gerekenGun <= Math.max(0, kalanGun - LGS_TEKRAR_PAYI);

  return (
    <>
      <Card className="rise delay-1 !bg-[#16233a] text-white">
        <div className="flex items-center gap-4">
          <div className="shrink-0 rounded-2xl bg-white/10 px-4 py-3 text-center">
            <p className="word text-3xl font-extrabold leading-none text-spark tabular-nums">{kalanGun}</p>
            <p className="text-xs font-bold text-white/70 mt-1">{t('gün kaldı')}</p>
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-extrabold">{t('LGS 2027 (tahmini 12 Haziran)')}</p>
            {kalanKelime === 0 ? (
              <p className="text-white/75 mt-1">{t('Bütün kelimeler tamam. Artık tekrar ve deneme zamanı.')}</p>
            ) : gerekenGun === null ? (
              <p className="text-white/75 mt-1">
                {t('Bitirmek için günde {n} yeni kelime yeter.', { n: gunlukGereken })}
              </p>
            ) : yetisiyor ? (
              <p className="text-white/75 mt-1">
                {t('Bu hızla ({h}/gün) bütün üniteler {g} günde biter. Yetişiyorsun.', {
                  h: Math.round(hiz * 10) / 10,
                  g: gerekenGun,
                })}
              </p>
            ) : (
              <p className="text-white/75 mt-1">
                {t('Bu hızla ({h}/gün) yetişmiyor. Günde {n} yeni kelimeye çıkarsan sınavdan 2 hafta önce biter.', {
                  h: Math.round(hiz * 10) / 10,
                  n: gunlukGereken,
                })}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="rise delay-1">
        <h2 className="text-sm font-bold text-ink-soft mb-1">{t('Üniteler')}</h2>
        <p className="text-xs text-ink-faint mb-3">{t('Kelime · kalıp · diyalog · ünite testi. Üniteye dokun, sayfası açılsın.')}</p>
        <ul className="grid gap-2">
          {UNITELER.map((u) => {
            const kartlar = uniteKartlari(u.no);
            const kelime = kartlar.filter((c) => ogrenilen.has(c.id)).length;
            const kd = uniteKalipDurumu(u.no, state.lgsKalip, state.lgsDiyalog);
            const say = UNITE_SAYILARI[u.no];
            const test = state.lgsTest?.[String(u.no)];
            const pct = kartlar.length ? Math.round((kelime / kartlar.length) * 100) : 0;
            const aktif = state.lgsUnite === u.no;
            const bitti = uniteBittiMi(kelime, kartlar.length, test);
            return (
              <li key={u.no}>
                <button
                  type="button"
                  onClick={() => onUniteAc(u.no)}
                  className={`w-full rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.98] ${
                    aktif ? 'bg-brand-soft ring-2 ring-brand/40' : 'bg-sunken hover:bg-brand-soft'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <UniteGorseli no={u.no} className="h-10 w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="word block text-sm font-extrabold leading-tight truncate">
                        {u.no}. {u.ad}
                        {bitti && <span className="ml-1.5 text-grow-deep">✓</span>}
                      </span>
                      <span className="mt-1 block h-1.5 rounded-full bg-white overflow-hidden">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </span>
                    </span>
                    <span className="shrink-0 text-right text-[11px] font-bold leading-tight text-ink-soft tabular-nums">
                      <span className="block">
                        {kelime}/{kartlar.length} · {kd.kalip}/{say.kalip} · {kd.diyalog}/{say.diyalog}
                      </span>
                      <span className={`block ${test !== undefined ? (test >= 7 ? 'text-grow-deep' : 'text-blush') : 'text-ink-faint'}`}>
                        {bitti ? t('tamamlandı') : test !== undefined ? t('test {n}/10', { n: test }) : t('test —')}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
