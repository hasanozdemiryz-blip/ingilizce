import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackButton, Button, Card, Progressbar, Screen, SpeakButton, TopBar, Yonerge } from '../components/ui';
import { diyalogId, kalipId, uniteYukle, type Kalip, type UniteIcerik } from '../lgs';
import { bosSatir, durumEtiketi, ilkBicim, pekistirSec, tohumluKaristir } from '../pekistir';
import { seslendir } from '../speech';
import type { AppState } from '../types';
import { t } from '../dil';

type Adim =
  | { tur: 'tanit'; i: number }
  | { tur: 'sec'; i: number }
  | { tur: 'diz'; i: number }
  | { tur: 'diyalog'; i: number };

type Props = {
  unite: number;
  /** Bu derste tanisilan kelimeler (Ingilizce) — kaliplar bunlarla secilir */
  bugunKelimeler: string[];
  /** Unitenin ogrenilmis kelime orani (0–1): diyalog esikleri */
  oran: number;
  /** LGS'deki ilk ders mi (deneme dersi: esiksiz diyalog, bkz. pekistir.ts) */
  ilkDers?: boolean;
  lgsKalip: AppState['lgsKalip'];
  lgsDiyalog: AppState['lgsDiyalog'];
  /** Her dogru cozumden sonra cagrilir; App state'e yazar (senkronlu). */
  onKaydet: (patch: Pick<AppState, 'lgsKalip' | 'lgsDiyalog'>) => void;
  onBitti: () => void;
};

/**
 * DERS SONU PEKISTIRME — LGS (31 Ekim, PLAN v3). Mantik: `pekistir.ts`.
 *
 * Akis: [kalip: durum + kalip goster → durumdan sec → cumleyi diz] x1–2,
 * varsa [diyalog: dinle, bos satiri sec]. Hicbir sey secilmezse (unite
 * bitmis, tekrar vadesi yok) ekran hic gorunmeden bitiyor.
 */
export function Pekistir({ unite, bugunKelimeler, oran, ilkDers, lgsKalip, lgsDiyalog, onKaydet, onBitti: bittiDisari }: Props) {
  // Bir kez: Gec, geri tusu ve bos secim ayni anda tetiklenebilir.
  const bitti = useRef(false);
  const onBitti = useCallback(() => {
    if (bitti.current) return;
    bitti.current = true;
    bittiDisari();
  }, [bittiDisari]);
  const [icerik, setIcerik] = useState<UniteIcerik | null>(null);
  const [hata, setHata] = useState(false);
  const [sira, setSira] = useState(0);
  // Kayit ders boyunca BIRIKIYOR; prop'tan gelen eski deger yazilani ezmesin.
  const [kalip, setKalip] = useState(lgsKalip ?? {});
  const [diyalog, setDiyalog] = useState(lgsDiyalog ?? {});

  useEffect(() => {
    uniteYukle(unite).then(setIcerik, () => setHata(true));
  }, [unite]);

  // Secim icerik gelince BIR KEZ yapiliyor; cozdukce degisen kayit secimi oynatmasin.
  const secim = useMemo(
    () => (icerik ? pekistirSec(icerik, { bugunKelimeler, kalip: lgsKalip, diyalog: lgsDiyalog, oran, ilkDers }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [icerik],
  );

  const adimlar = useMemo<Adim[]>(() => {
    if (!secim) return [];
    const a: Adim[] = [];
    for (const i of secim.kaliplar) {
      const yeni = !(lgsKalip?.[kalipId(unite, i)]?.d);
      if (yeni) a.push({ tur: 'tanit', i });
      a.push({ tur: 'sec', i }, { tur: 'diz', i });
    }
    if (secim.diyalog !== null) a.push({ tur: 'diyalog', i: secim.diyalog });
    return a;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secim]);

  // Yapacak bir sey yoksa ya da icerik inmediyse ekran gorunmeden gec.
  useEffect(() => {
    if (hata || (secim && adimlar.length === 0)) onBitti();
  }, [hata, secim, adimlar.length, onBitti]);

  if (!icerik || !secim || adimlar.length === 0) {
    return <Screen yanMenusuz>{null}</Screen>;
  }

  const adim = adimlar[Math.min(sira, adimlar.length - 1)];
  const ileri = () => (sira + 1 >= adimlar.length ? onBitti() : setSira(sira + 1));

  /** Kalibin "sec" ve "diz" adimlarinin ikisi de dogruysa sayilir. */
  const kalipSonuc = (i: number, dogru: boolean, adimTuru: 'sec' | 'diz') => {
    const id = kalipId(unite, i);
    const k = `${id}:${adimTuru}`;
    sonuclar[k] = dogru;
    if (adimTuru === 'diz') {
      const tamam = sonuclar[`${id}:sec`] !== false && dogru;
      const onceki = kalip[id] ?? { d: 0, t: 0 };
      const yeni = { ...kalip, [id]: { d: tamam ? onceki.d + 1 : onceki.d, t: Date.now() } };
      setKalip(yeni);
      onKaydet({ lgsKalip: yeni });
    }
  };

  return (
    <Screen yanMenusuz>
      <TopBar
        left={<BackButton onClick={onBitti} />}
        right={
          <button type="button" onClick={onBitti} className="text-sm font-bold text-ink-soft px-2 py-1">
            {t('Geç')}
          </button>
        }
      />
      <Progressbar done={sira} total={adimlar.length} />
      <p className="mt-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-ink-faint">
        {adim.tur === 'diyalog' ? t('Diyalog') : t('Bu kelimelerle cümle')}
      </p>
      <div className="flex-1 flex flex-col justify-center gap-3 py-4" key={sira}>
        {adim.tur === 'tanit' && (
          <Tanit kalip={icerik.kaliplar[adim.i]} bugunKelimeler={bugunKelimeler} onDevam={ileri} />
        )}
        {adim.tur === 'sec' && (
          <Sec
            kaliplar={icerik.kaliplar}
            i={adim.i}
            tohum={`${unite}-${adim.i}`}
            onSonuc={(d) => kalipSonuc(adim.i, d, 'sec')}
            onDevam={ileri}
          />
        )}
        {adim.tur === 'diz' && (
          <Diz
            kalip={icerik.kaliplar[adim.i]}
            tohum={`${unite}-${adim.i}`}
            onSonuc={(d) => kalipSonuc(adim.i, d, 'diz')}
            onDevam={ileri}
          />
        )}
        {adim.tur === 'diyalog' && (
          <DiyalogSor
            icerik={icerik}
            i={adim.i}
            onSonuc={(d) => {
              if (!d) return;
              const yeni = { ...diyalog, [diyalogId(unite, adim.i)]: Date.now() };
              setDiyalog(yeni);
              onKaydet({ lgsDiyalog: yeni });
            }}
            onDevam={ileri}
          />
        )}
      </div>
    </Screen>
  );
}

/** Adimlar arasi sonuc defteri (render'lar arasi yasamasi yeterli). */
const sonuclar: Record<string, boolean> = {};

/**
 * Kalibin icindeki bugunun kelimeleri fosforlu: "bu kelimeyi cumlede boyle
 * kullaniyorsun". Cok kelimeli ifadeler de ("hang on") butun olarak; tek
 * kelimede kucuk cekim payi (invite → invited).
 */
function Vurgulu({ cumle, bugunKelimeler }: { cumle: string; bugunKelimeler: string[] }) {
  const kacir = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const desenler = bugunKelimeler
    .map((w) => w.toLowerCase().trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((w) => (w.includes(' ') ? kacir(w) : `${kacir(w.length > 4 && w.endsWith('e') ? w.slice(0, -1) : w)}[a-z]{0,3}`));
  if (desenler.length === 0) return <>{cumle}</>;
  // Yakalayan grupla bolunce eslesmeler tek sirali parcalara duser.
  const parcalar = cumle.split(new RegExp(`\\b(${desenler.join('|')})\\b`, 'i'));
  return (
    <>
      {parcalar.map((p, j) =>
        j % 2 === 1 ? (
          <span key={j} className="marker">
            {p}
          </span>
        ) : (
          <span key={j}>{p}</span>
        ),
      )}
    </>
  );
}

function Tanit({ kalip, bugunKelimeler, onDevam }: { kalip: Kalip; bugunKelimeler: string[]; onDevam: () => void }) {
  useEffect(() => {
    seslendir(kalip.en);
  }, [kalip.en]);
  return (
    <>
      <Card className="w-full !py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          {kalip.not && (
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-extrabold text-brand-deep">{kalip.not}</span>
          )}
          <p className="word text-2xl font-extrabold leading-snug">
            <Vurgulu cumle={kalip.en} bugunKelimeler={bugunKelimeler} />
          </p>
          <p className="text-ink-soft">{kalip.tr}</p>
          <SpeakButton word={kalip.en} size="small" />
        </div>
      </Card>
      <p className="text-center text-sm text-ink-soft">{t('Bu cümleyi bu durumda kullanırsın. Şimdi sen dene.')}</p>
      <Button variant="spark" onClick={onDevam}>
        {t('Devam')}
      </Button>
    </>
  );
}

function Sec({
  kaliplar,
  i,
  tohum,
  onSonuc,
  onDevam,
}: {
  kaliplar: Kalip[];
  i: number;
  tohum: string;
  onSonuc: (dogru: boolean) => void;
  onDevam: () => void;
}) {
  const k = kaliplar[i];
  const secenekler = useMemo(() => {
    const digerleri = tohumluKaristir(
      kaliplar.filter((x, j) => j !== i && x.en !== k.en),
      tohum,
    ).slice(0, 3);
    return tohumluKaristir([k.en, ...digerleri.map((x) => x.en)], `${tohum}-s`);
  }, [kaliplar, i, k.en, tohum]);
  const [secilen, setSecilen] = useState<string | null>(null);
  return (
    <>
      <Card className="w-full !py-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <Yonerge>{t('Bu durumda hangisini söylersin?')}</Yonerge>
          {durumEtiketi(k.not, k.en) && (
            <span className="text-sm font-bold text-brand-deep">{durumEtiketi(k.not, k.en)}</span>
          )}
          <p className="text-lg font-bold">“{k.tr}”</p>
        </div>
      </Card>
      <div className="grid gap-2.5">
        {secenekler.map((o) => {
          const ton =
            secilen === null
              ? 'bg-white text-ink shadow-[var(--shadow-soft)]'
              : o === k.en
                ? 'bg-grow text-white shadow-[var(--shadow-soft)]'
                : secilen === o
                  ? 'bg-blush text-white shadow-[var(--shadow-soft)]'
                  : 'bg-white/50 text-ink-faint';
          return (
            <button
              key={o}
              type="button"
              disabled={secilen !== null}
              onClick={() => {
                setSecilen(o);
                onSonuc(o === k.en);
                seslendir(k.en);
              }}
              className={`rounded-2xl px-4 py-3.5 text-left font-bold transition-all active:scale-[0.98] ${ton}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {secilen !== null && (
        <Button variant="spark" onClick={onDevam}>
          {t('Devam')}
        </Button>
      )}
    </>
  );
}

function Diz({
  kalip,
  tohum,
  onSonuc,
  onDevam,
}: {
  kalip: Kalip;
  tohum: string;
  onSonuc: (dogru: boolean) => void;
  onDevam: () => void;
}) {
  const hedef = ilkBicim(kalip.en);
  const parcalar = useMemo(() => hedef.split(/\s+/).filter(Boolean), [hedef]);
  const karisik = useMemo(() => {
    const k = tohumluKaristir(
      parcalar.map((p, j) => ({ p, j })),
      `${tohum}-d`,
    );
    // Karistirma tesadufen dogru sirayi verirse ilk ikisini degistir.
    if (k.every((x, j) => x.j === j) && k.length > 1) [k[0], k[1]] = [k[1], k[0]];
    return k;
  }, [parcalar, tohum]);
  const [dizilen, setDizilen] = useState<number[]>([]);
  const [sonuc, setSonuc] = useState<boolean | null>(null);

  const ekle = (j: number) => {
    if (sonuc !== null) return;
    const yeni = [...dizilen, j];
    setDizilen(yeni);
    if (yeni.length === parcalar.length) {
      const cumle = yeni.map((x) => karisik[x].p).join(' ');
      const dogru = cumle === parcalar.join(' ');
      setSonuc(dogru);
      onSonuc(dogru);
      seslendir(hedef);
    }
  };

  return (
    <>
      <Card className="w-full !py-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <Yonerge>{t('Cümleyi sırayla diz')}</Yonerge>
          <p className="text-ink-soft">{ilkBicim(kalip.tr)}</p>
          <div
            className={`mt-2 flex min-h-[3.25rem] w-full flex-wrap justify-center gap-1.5 rounded-2xl p-2 ${
              sonuc === null ? 'bg-sunken' : sonuc ? 'bg-grow-soft' : 'bg-blush-soft'
            }`}
          >
            {dizilen.map((x, n) => (
              <button
                key={n}
                type="button"
                disabled={sonuc !== null}
                onClick={() => setDizilen(dizilen.filter((_, m) => m !== n))}
                className="word rounded-xl bg-white px-3 py-2 font-bold shadow-[var(--shadow-soft)]"
              >
                {karisik[x].p}
              </button>
            ))}
          </div>
          {sonuc === false && (
            <p className="text-sm">
              {t('Doğrusu')}: <b className="word">{hedef}</b>
            </p>
          )}
        </div>
      </Card>
      {sonuc === null ? (
        <div className="flex flex-wrap justify-center gap-2">
          {karisik.map((x, j) =>
            dizilen.includes(j) ? (
              <span key={j} className="word rounded-xl px-3 py-2 font-bold text-transparent bg-sunken/60 select-none">
                {x.p}
              </span>
            ) : (
              <button
                key={j}
                type="button"
                onClick={() => ekle(j)}
                className="word rounded-xl bg-white px-3 py-2 font-bold shadow-[var(--shadow-soft)] active:scale-95"
              >
                {x.p}
              </button>
            ),
          )}
        </div>
      ) : (
        <Button variant="spark" onClick={onDevam}>
          {t('Devam')}
        </Button>
      )}
    </>
  );
}

function DiyalogSor({
  icerik,
  i,
  onSonuc,
  onDevam,
}: {
  icerik: UniteIcerik;
  i: number;
  onSonuc: (dogru: boolean) => void;
  onDevam: () => void;
}) {
  const d = icerik.diyaloglar[i];
  const bos = bosSatir(d.satirlar);
  const dogru = d.satirlar[bos].en;
  const secenekler = useMemo(() => {
    const baska = icerik.diyaloglar
      .filter((_, j) => j !== i)
      .flatMap((x) => x.satirlar.map((s) => s.en))
      .filter((s) => s !== dogru && s.split(' ').length >= 3);
    return tohumluKaristir([dogru, ...tohumluKaristir(baska, `${icerik.unite}-${i}`).slice(0, 2)], `${icerik.unite}-${i}-s`);
  }, [icerik, i, dogru]);
  const [secilen, setSecilen] = useState<string | null>(null);
  return (
    <>
      <Card className="w-full !py-4">
        <p className="word text-center font-extrabold mb-1">{d.baslik}</p>
        <p className="text-center text-xs text-ink-soft mb-3">{t('Dinle, boş satıra ne gelir?')}</p>
        <ul className="grid gap-2">
          {d.satirlar.map((s, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className={`shrink-0 text-xs font-extrabold pt-1.5 w-14 truncate ${s.cinsiyet === 'k' ? 'text-blush' : 'text-brand-deep'}`}>
                {s.kim}
              </span>
              <span
                className={`flex-1 rounded-xl px-3 py-1.5 text-sm ${
                  j === bos
                    ? secilen === null
                      ? 'bg-sunken text-ink-faint italic'
                      : secilen === dogru
                        ? 'bg-grow-soft font-bold'
                        : 'bg-blush-soft font-bold'
                    : 'bg-white/70'
                }`}
              >
                {j === bos && secilen === null ? '…' : s.en}
              </span>
              {(j !== bos || secilen !== null) && <SpeakButton word={s.en} size="mini" />}
            </li>
          ))}
        </ul>
      </Card>
      {secilen === null ? (
        <div className="grid gap-2">
          {secenekler.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => {
                setSecilen(o);
                onSonuc(o === dogru);
                seslendir(dogru);
              }}
              className="rounded-2xl bg-white px-4 py-3 text-left text-sm font-bold shadow-[var(--shadow-soft)] active:scale-[0.98]"
            >
              {o}
            </button>
          ))}
        </div>
      ) : (
        <>
          {secilen !== dogru && <p className="text-center text-sm">{t('Doğru satır yeşil olan.')}</p>}
          <Button variant="spark" onClick={onDevam}>
            {t('Devam')}
          </Button>
        </>
      )}
    </>
  );
}
