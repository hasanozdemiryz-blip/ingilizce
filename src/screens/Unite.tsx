import { useEffect, useMemo, useState } from 'react';
import { BackButton, Button, Card, Screen, SpeakButton, TopBar } from '../components/ui';
import { kancaYazisi } from '../components/Cagrisim';
import { uniteKartlari } from '../content';
import { karistir, uniteYukle, UNITELER, type Diyalog, type UniteIcerik } from '../lgs';
import { seslendir } from '../speech';
import type { Progress } from '../types';
import { t } from '../dil';

type Bolum = 'kelimeler' | 'kaliplar' | 'diyaloglar' | 'test';

const BOLUMLER: { id: Bolum; ad: string }[] = [
  { id: 'kelimeler', ad: t('Kelimeler') },
  { id: 'kaliplar', ad: t('Kalıplar') },
  { id: 'diyaloglar', ad: t('Diyaloglar') },
  { id: 'test', ad: t('Test') },
];

type Props = {
  no: number;
  progress: Progress[];
  /** Bu uniteden yeni kelime ogrenmeye basla: unite aktif olur, ders acilir */
  onCalis: (no: number) => void;
  /** Unite testi bitince en iyi puan kaydedilir */
  onTestSonucu: (no: number, dogru: number) => void;
  enIyiTest?: number;
  onExit: () => void;
};

/**
 * UNITE SAYFASI (KARARLAR 7): kelimeler → kaliplar → diyaloglar → test.
 *
 * Bolumler bir SIRA ama kilit yok: ogrenci okulda once kaliplari
 * gorduyse oradan baslayabilir. Gramer anlatimi yok — kalip, ornek ve
 * Turkce karsiligiyla; diyalogda satira dokununca Turkcesi acilir.
 */
export function Unite({ no, progress, onCalis, onTestSonucu, enIyiTest, onExit }: Props) {
  const [bolum, setBolum] = useState<Bolum>('kelimeler');
  const [icerik, setIcerik] = useState<UniteIcerik | null>(null);
  const [hata, setHata] = useState(false);
  const meta = UNITELER[no - 1];

  useEffect(() => {
    let iptal = false;
    setIcerik(null);
    setHata(false);
    uniteYukle(no)
      .then((i) => !iptal && setIcerik(i))
      .catch(() => !iptal && setHata(true));
    return () => {
      iptal = true;
    };
  }, [no]);

  return (
    <Screen yanMenusuz>
      <TopBar left={<BackButton onClick={onExit} />} right={t('{n}. ünite', { n: no })} />
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <span className="text-4xl" aria-hidden>
          {meta.ikon}
        </span>
        <div className="min-w-0">
          <h1 className="word text-2xl font-extrabold leading-tight">{meta.ad}</h1>
          <p className="text-sm text-ink-soft">{meta.tr}</p>
        </div>
      </div>

      <div role="tablist" className="grid grid-cols-4 gap-1 rounded-full bg-white p-1 shadow-[var(--shadow-soft)] shrink-0 mb-4">
        {BOLUMLER.map((b) => (
          <button
            key={b.id}
            role="tab"
            aria-selected={bolum === b.id}
            onClick={() => setBolum(b.id)}
            className={`rounded-full px-1 py-2 text-[13px] font-extrabold transition-all active:scale-95 ${
              bolum === b.id ? 'bg-ink text-white' : 'text-ink-soft hover:bg-sunken'
            }`}
          >
            {b.ad}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col gap-3 pb-8">
        {bolum === 'kelimeler' ? (
          <Kelimeler no={no} progress={progress} onCalis={onCalis} />
        ) : hata ? (
          <Card className="text-center text-sm text-ink-soft">
            {t('Ünite yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.')}
          </Card>
        ) : !icerik ? (
          <Card className="text-center text-sm text-ink-soft">{t('Yükleniyor…')}</Card>
        ) : bolum === 'kaliplar' ? (
          <Kaliplar icerik={icerik} />
        ) : bolum === 'diyaloglar' ? (
          icerik.diyaloglar.map((d) => <DiyalogKarti key={d.baslik} diyalog={d} />)
        ) : (
          <UniteTesti icerik={icerik} enIyi={enIyiTest} onBitti={(dogru) => onTestSonucu(no, dogru)} />
        )}
      </div>
    </Screen>
  );
}

function Kelimeler({ no, progress, onCalis }: { no: number; progress: Progress[]; onCalis: (no: number) => void }) {
  const kartlar = useMemo(() => uniteKartlari(no), [no]);
  const ogrenilen = new Set(progress.filter((p) => p.introduced).map((p) => p.cardId));
  const bilinen = new Set(progress.filter((p) => p.bilinen).map((p) => p.cardId));
  const kalan = kartlar.filter((c) => !ogrenilen.has(c.id) && !bilinen.has(c.id)).length;
  return (
    <>
      <Card className="!py-4">
        <p className="text-sm text-ink-soft">
          {kalan > 0
            ? t('Bu ünitede {n} yeni kelime var. Her derste 5 kelime, çağrışımıyla.', { n: kalan })
            : t('Bu ünitenin bütün kelimeleriyle tanıştın. Sırada kalıplar ve diyaloglar.')}
        </p>
        {kalan > 0 && (
          <Button variant="spark" className="mt-3" onClick={() => onCalis(no)}>
            {t('Bu üniteden öğren')}
          </Button>
        )}
      </Card>
      <ul className="grid gap-1.5">
        {kartlar.map((c) => {
          const tamam = ogrenilen.has(c.id) || bilinen.has(c.id);
          return (
            <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-[var(--shadow-soft)]">
              {/* Gorsel cagrisimin kendisi: derste ilk kez gorulsun, listede ancak sonra */}
              {c.image && tamam ? (
                <img src={c.image} alt="" loading="lazy" className="h-10 w-[3.3rem] shrink-0 rounded-lg object-cover" />
              ) : (
                // Bos kutu bozuk gorunuyordu (19 Ekim testi): resmin derste acilacagini "?" soyluyor
                <span
                  aria-hidden="true"
                  className="grid h-10 w-[3.3rem] shrink-0 place-items-center rounded-lg bg-sunken text-sm font-extrabold text-ink-faint"
                >
                  ?
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="word block font-extrabold leading-tight">{c.en}</span>
                <span className="block text-sm text-ink-soft truncate">
                  {c.tr}
                  {tamam && <span className="text-ink-faint"> · ≈ {kancaYazisi(c)}</span>}
                </span>
              </span>
              <SpeakButton word={c.en} size="mini" />
              <span
                aria-label={tamam ? t('Öğrenildi') : t('Henüz değil')}
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  tamam ? 'bg-grow text-white' : 'bg-sunken text-transparent'
                }`}
              >
                ✓
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Kaliplar({ icerik }: { icerik: UniteIcerik }) {
  return (
    <>
      <p className="text-sm text-ink-soft px-1">{icerik.konu}</p>
      {icerik.kaliplar.map((k) => (
        <Card key={k.en} className="!py-4">
          {/* Buyuk harf YOK: not Turkce + Ingilizce karisik; tr yerelinde "FİRST" cikiyordu */}
          {k.not && <p className="text-xs font-bold text-brand-deep mb-1">{k.not}</p>}
          <div className="flex items-start gap-2">
            <p className="word flex-1 text-lg font-bold leading-snug">{k.en}</p>
            <SpeakButton word={k.en} size="mini" />
          </div>
          <p className="text-sm text-ink-soft mt-1">{k.tr}</p>
        </Card>
      ))}
    </>
  );
}

/**
 * Diyalog: satir satir. Ingilizce gorunur, dokununca Turkcesi acilir —
 * once anlamaya calis, takilinca bak. Kadin satirlari solda, erkekler
 * sagda (sesler Asama 5'te bu cinsiyete gore uretiliyor).
 */
function DiyalogKarti({ diyalog }: { diyalog: Diyalog }) {
  const [acik, setAcik] = useState<Set<number>>(new Set());
  const ac = (i: number) =>
    setAcik((s) => {
      const y = new Set(s);
      if (y.has(i)) y.delete(i);
      else y.add(i);
      return y;
    });
  return (
    <Card>
      <p className="word text-lg font-extrabold mb-3">{diyalog.baslik}</p>
      <ol className="flex flex-col gap-2.5">
        {diyalog.satirlar.map((s, i) => {
          const sag = s.cinsiyet === 'e';
          return (
            <li key={i} className={`flex flex-col ${sag ? 'items-end' : 'items-start'}`}>
              <span className="text-xs font-bold text-ink-faint mb-0.5 px-2">{s.kim}</span>
              <div className={`flex items-end gap-1.5 max-w-[88%] ${sag ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={() => ac(i)}
                  className={`rounded-2xl px-3.5 py-2.5 text-left transition active:scale-[0.98] ${
                    sag ? 'bg-brand text-white rounded-br-md' : 'bg-sunken text-ink rounded-bl-md'
                  }`}
                >
                  <span className="block font-semibold leading-snug">{s.en}</span>
                  {acik.has(i) && (
                    <span className={`block text-sm mt-1 ${sag ? 'text-white/80' : 'text-ink-soft'}`}>{s.tr}</span>
                  )}
                </button>
                <button
                  type="button"
                  aria-label={t('Dinle')}
                  onClick={() => seslendir(s.en)}
                  className="h-8 w-8 shrink-0 grid place-items-center rounded-full bg-white shadow-[var(--shadow-soft)] text-sm active:scale-90"
                >
                  🔊
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-ink-faint mt-3">{t('Türkçesini görmek için satıra dokun.')}</p>
    </Card>
  );
}

function UniteTesti({
  icerik,
  enIyi,
  onBitti,
}: {
  icerik: UniteIcerik;
  enIyi?: number;
  onBitti: (dogru: number) => void;
}) {
  const sorular = useMemo(() => icerik.test.map((s) => ({ ...s, ...karistir(s) })), [icerik]);
  const [sira, setSira] = useState(0);
  const [secilen, setSecilen] = useState<number | null>(null);
  const [dogruSayi, setDogruSayi] = useState(0);
  const [bitti, setBitti] = useState(false);

  if (bitti) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm font-bold text-ink-soft">{t('Ünite testi')}</p>
        <p className="word text-5xl font-extrabold my-2 tabular-nums">
          {dogruSayi}/{sorular.length}
        </p>
        <p className="text-ink-soft text-sm mb-5">
          {dogruSayi >= 8
            ? t('Harika! Bu ünite sağlam.')
            : dogruSayi >= 5
              ? t('İyi gidiyor. Yanlışlarının açıklamalarına bir daha bak.')
              : t('Kalıplara ve diyaloglara bir göz atıp tekrar dene.')}
        </p>
        <Button
          variant="soft"
          onClick={() => {
            setSira(0);
            setSecilen(null);
            setDogruSayi(0);
            setBitti(false);
          }}
        >
          {t('Testi tekrar çöz')}
        </Button>
      </Card>
    );
  }

  const s = sorular[sira];
  const cevaplandi = secilen !== null;
  return (
    <>
      <div className="flex items-center justify-between px-1 text-sm font-bold text-ink-soft">
        <span className="tabular-nums">{t('Soru {a}/{b}', { a: sira + 1, b: sorular.length })}</span>
        {enIyi !== undefined && <span className="tabular-nums">{t('En iyi: {n}/10', { n: enIyi })}</span>}
      </div>
      <Card>
        <p className="whitespace-pre-line font-semibold leading-relaxed">{s.soru}</p>
      </Card>
      <div className="grid gap-2">
        {s.secenekler.map((o, i) => {
          const ton = !cevaplandi
            ? 'bg-white text-ink shadow-[var(--shadow-soft)]'
            : i === s.dogru
              ? 'bg-grow text-white'
              : i === secilen
                ? 'bg-blush text-white'
                : 'bg-white/50 text-ink-faint';
          return (
            <button
              key={o}
              type="button"
              disabled={cevaplandi}
              onClick={() => {
                setSecilen(i);
                if (i === s.dogru) setDogruSayi((n) => n + 1);
              }}
              className={`flex items-start gap-3 rounded-2xl px-4 py-3.5 text-left font-semibold transition-all active:scale-[0.98] ${ton}`}
            >
              <span className="shrink-0 font-extrabold">{'ABCD'[i]})</span>
              <span>{o}</span>
            </button>
          );
        })}
      </div>
      {cevaplandi && (
        <Card className="rise !py-4">
          <p className={`font-extrabold ${secilen === s.dogru ? 'text-grow-deep' : 'text-ink'}`}>
            {secilen === s.dogru ? t('Doğru!') : t('Doğrusu: {c}', { c: 'ABCD'[s.dogru] })}
          </p>
          <p className="text-sm text-ink-soft mt-1">{s.aciklama}</p>
          <Button
            className="mt-3"
            onClick={() => {
              if (sira + 1 >= sorular.length) {
                setBitti(true);
                onBitti(dogruSayi);
              } else {
                setSira(sira + 1);
                setSecilen(null);
              }
            }}
          >
            {sira + 1 >= sorular.length ? t('Sonucu gör') : t('Sonraki soru')}
          </Button>
        </Card>
      )}
    </>
  );
}
