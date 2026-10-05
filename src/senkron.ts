import { APP_KEY, db, getAnswers, getState, normalizeProgress, resetAll } from './db';
import { cikisYap, istemciAl, uyeOku } from './uyelik';
import type { AppState, Cevap, Progress } from './types';

/**
 * ILERLEME SENKRONU — hesabin asil sebebi.
 *
 * Uyelik bir sure yalnizca "hesap" idi: e-posta vardi, ilerleme hala
 * cihazda duruyordu ve arayuz "telefonunu degistirsen de kaldigin yerden
 * devam edersin" diyordu. Bu dogru degildi. Bu modul onu dogru yapiyor.
 *
 * SEKIL. Sunucuda kullanici basina TEK satir, tek jsonb paket
 * (bkz. supabase/migrations/..._ilerleme.sql). Kart basina satir granuler
 * senkron saglardi ama her ders sonunda onlarca upsert ve satir bazli
 * catisma cozumu demekti; havuz 300 kelime ve hesabi tek kisi kullaniyor.
 *
 * CATISMA. Sunucu yalnizca sakliyor, karari ISTEMCI veriyor: `birlestir`
 * kart bazinda son hareket edeni seciyor. Tamamen "son yazan kazanir"
 * yapmak, bir hafta cevrimdisi kalmis telefonun web'deki ilerlemeyi
 * silmesi demekti.
 *
 * YEDEK YERINE GECMIYOR. Dosya yedegi (bkz. dosya.ts) duruyor ve
 * onerilmeye devam ediyor: senkron hesaba bagli, yedek degil.
 */

/** Paket surumu. Sema degisirse artar ve eski paket okunurken gorulur. */
const SURUM = 1;

/**
 * Sunucuya gonderilen cevap gunlugu bu kadarla sinirli.
 *
 * Gunluk sinirsiz buyuyor ve paket tek bir jsonb satiri; sinirsiz birakmak
 * aylar sonra megabaytlik bir satir demek. Son N cevap kalite sinyalleri
 * ve basari grafigi icin fazlasiyla yetiyor.
 */
const CEVAP_TAVANI = 3000;

export type Paket = {
  surum: number;
  /**
   * Paketteki VERININ en son ne zaman degistigi — paketin ne zaman
   * hazirlandigi degil.
   *
   * Ayrim kritik: "simdi" damgalansaydi yeni kurulmus bos bir cihaz
   * sunucudaki paketten hep taze gorunur ve `birlestir` tercihleri,
   * profili, adi o bos cihazdan alirdi. Cikis yapip tekrar giren
   * kullanici adini kaybederdi.
   */
  yazildi: string;
  state: AppState;
  progress: Progress[];
  answers: Cevap[];
};

// --- Birlestirme (saf, test edilebilir) ------------------------------------

/**
 * Bir kaydin SON HAREKET zamani.
 *
 * Tekrar edilmis bir kartta `last_review`, yalnizca tanisilmista
 * `introducedAt`. Ikisi de yoksa 0 — hicbir sey bilinmiyorsa karsi taraf
 * kazansin.
 */
function sonHareket(p: Progress): number {
  const t = (d: unknown): number => {
    if (!d) return 0;
    const z = d instanceof Date ? d.getTime() : Date.parse(String(d));
    return Number.isFinite(z) ? z : 0;
  };
  return Math.max(t(p.fsrs?.last_review), t(p.introducedAt));
}

/** Iki kayittan hangisi kalir. */
function kartSec(a: Progress, b: Progress): Progress {
  const fa = sonHareket(a);
  const fb = sonHareket(b);
  if (fa !== fb) return fa > fb ? a : b;
  // Esitlikte daha ileri basamak kazanir: ilerleme geri gitmesin.
  if (a.step !== b.step) return a.step > b.step ? a : b;
  return a;
}

const enBuyuk = (a: number | undefined, b: number | undefined): number =>
  Math.max(a ?? 0, b ?? 0);

/** Gun sayaclarini birlestirir: ayni gun iki cihazda calisildiysa en
 *  yuksek sayac kaliyor. Toplamak iki katina cikarirdi. */
function gunleriBirlestir(a: AppState['days'], b: AppState['days']): AppState['days'] {
  const cikti: AppState['days'] = { ...a };
  for (const [gun, v] of Object.entries(b ?? {})) {
    const o = cikti[gun];
    cikti[gun] = o
      ? { r: enBuyuk(o.r, v.r), i: enBuyuk(o.i, v.i), d: enBuyuk(o.d, v.d), y: enBuyuk(o.y, v.y) }
      : v;
  }
  return cikti;
}

const cevapAnahtari = (c: Cevap): string => `${c.cardId}|${c.ts}|${c.step ?? ''}`;

/**
 * Iki paketi birlestirir. Saf fonksiyon — girdiyi degistirmiyor.
 *
 * Olcekler ayri ayri ele aliniyor:
 *   kartlar   — kart bazinda son hareket eden
 *   cevaplar  — birlesim, tekrarlar ayiklanmis, son `CEVAP_TAVANI` tanesi
 *   seriler   — en buyugu (kaybolmasi en can sikici sey)
 *   tercihler — daha TAZE paketinki (ses, gunluk hedef, hatirlatma saati)
 */
export function birlestir(a: Paket, b: Paket): Paket {
  const taze = Date.parse(a.yazildi) >= Date.parse(b.yazildi) ? a : b;
  const eski = taze === a ? b : a;

  const kartlar = new Map<string, Progress>();
  for (const p of [...a.progress, ...b.progress]) {
    const v = kartlar.get(p.cardId);
    kartlar.set(p.cardId, v ? kartSec(v, p) : p);
  }

  const cevaplar = new Map<string, Cevap>();
  for (const c of [...a.answers, ...b.answers]) cevaplar.set(cevapAnahtari(c), c);
  const sirali = [...cevaplar.values()].sort((x, y) => x.ts - y.ts).slice(-CEVAP_TAVANI);

  const davet = new Set([
    ...(a.state.uyelikDavetGorulen ?? []),
    ...(b.state.uyelikDavetGorulen ?? []),
  ]);

  /*
    Tercihler ve profil KENDI damgalariyla seciliyor, paketin ders
    hareketiyle degil. Yoksa telefonda avatar degistirip sonra
    bilgisayarda ders yapan kullanicinin bilgisayari "daha taze" sayiliyor
    ve eski avatari telefondakini eziyordu. Iki tarafta da damga yoksa
    (eski paketler) eski kural: taze paketinki.
  */
  const da = a.state.tercihDegisti ?? 0;
  const db_ = b.state.tercihDegisti ?? 0;
  const tercihKaynagi = da === db_ ? taze : da > db_ ? a : b;
  const t = tercihKaynagi.state;
  const tercihler: Partial<AppState> = {
    profil: t.profil,
    sound: t.sound,
    dailyLimit: t.dailyLimit,
    reminderHour: t.reminderHour,
    reminderMinute: t.reminderMinute,
    olcum: t.olcum,
    tercihDegisti: t.tercihDegisti,
  };
  // Tanimsiz alan karsi tarafin degerini silmesin.
  for (const k of Object.keys(tercihler) as (keyof AppState)[]) {
    if (tercihler[k] === undefined) delete tercihler[k];
  }

  const sonDers = [a.state.lastSessionDate, b.state.lastSessionDate]
    .filter((x): x is string => Boolean(x))
    .sort()
    .pop();

  return {
    surum: SURUM,
    yazildi: taze.yazildi,
    progress: [...kartlar.values()],
    answers: sirali,
    state: {
      // Tercihler ve profil taze paketten: kullanicinin SON karari gecerli.
      ...eski.state,
      ...taze.state,
      ...tercihler,
      lastSessionDate: sonDers ?? null,
      // Kazanimlar kaybolmamali.
      streakCount: enBuyuk(a.state.streakCount, b.state.streakCount),
      bestStreak: enBuyuk(a.state.bestStreak, b.state.bestStreak),
      freezes: enBuyuk(a.state.freezes, b.state.freezes),
      days: gunleriBirlestir(a.state.days, b.state.days),
      uyelikDavetGorulen: [...davet],
      // Karsilama bir kez gorulur; bir tarafta goruldüyse tekrar cikmasin.
      onboarded: a.state.onboarded || b.state.onboarded,
    },
  };
}

// --- Cihaz tarafi ----------------------------------------------------------

/**
 * Paketin tazeligi: icindeki en son hareket.
 *
 * Hicbir hareket yoksa sifir — bos bir cihaz her karsilastirmayi
 * kaybetsin, sunucudaki veriyi ezmesin.
 */
export function tazelik(p: Pick<Paket, 'state' | 'progress' | 'answers'>): string {
  const adaylar = [
    ...p.answers.map((c) => c.ts),
    ...p.progress.map(sonHareket),
    Date.parse(p.state.lastSessionDate ?? '') || 0,
  ];
  const enSon = adaylar.length > 0 ? Math.max(...adaylar) : 0;
  return new Date(enSon).toISOString();
}

/** Cihazdaki her seyi paketler. */
export async function yereliOku(): Promise<Paket> {
  const [progress, state, answers] = await Promise.all([
    db.progress.toArray(),
    getState(),
    getAnswers(),
  ]);
  return { surum: SURUM, yazildi: tazelik({ state, progress, answers }), state, progress, answers };
}

/**
 * Birlesmis paketi cihaza yazar.
 *
 * `importProgress` kullanilmiyor: o GERI YUKLEME, her seyi silip yerine
 * koyuyor. Burada paket zaten birlestirilmis olarak geliyor; yine de tek
 * islemde yaziliyor ki yarim kalmis bir senkron karma bir durum
 * birakmasin.
 */
export async function yereleYaz(p: Paket): Promise<void> {
  const progress = p.progress.map(normalizeProgress);
  await db.transaction('rw', db.progress, db.meta, db.answers, async () => {
    await db.progress.clear();
    await db.progress.bulkPut(progress);
    await db.answers.clear();
    if (p.answers.length > 0) await db.answers.bulkAdd(p.answers.map(({ id: _yok, ...c }) => c));
    await db.meta.put({ key: APP_KEY, value: p.state });
  });
}

// --- Sunucu tarafi ---------------------------------------------------------

async function uzaktanOku(): Promise<Paket | null> {
  const c = await istemciAl();
  const u = uyeOku();
  if (!c || !u) return null;
  const { data, error } = await c
    .from('ilerleme')
    .select('veri')
    .eq('kullanici', u.id)
    .maybeSingle();
  if (error || !data) return null;
  const v = data.veri as Paket;
  return v && Array.isArray(v.progress) ? v : null;
}

async function uzagaYaz(p: Paket): Promise<boolean> {
  const c = await istemciAl();
  const u = uyeOku();
  if (!c || !u) return false;
  const { error } = await c
    .from('ilerleme')
    .upsert(
      { kullanici: u.id, veri: p, guncellendi: new Date().toISOString() },
      { onConflict: 'kullanici' },
    );
  return !error;
}

// --- Disariya acilan tek islem ---------------------------------------------

export type SenkronSonuc = 'yapildi' | 'uyeyok' | 'hata';

let suruyor: Promise<SenkronSonuc> | null = null;

/**
 * Cek, birlestir, yaz.
 *
 * Ayni anda iki kez cagrilirsa (acilis + ders sonu ayni saniyeye denk
 * gelebiliyor) ikincisi birincinin sonucunu bekliyor; yoksa iki paket
 * birbirini eziyor.
 *
 * Hicbir hata firlatmiyor: senkron bir KOLAYLIK, ag yoksa uygulama
 * cihazdaki veriyle calismaya devam etmeli.
 */
export function senkronla(): Promise<SenkronSonuc> {
  if (suruyor) return suruyor;
  suruyor = (async (): Promise<SenkronSonuc> => {
    try {
      if (!uyeOku()) return 'uyeyok';
      const yerel = await yereliOku();
      const uzak = await uzaktanOku();
      const sonuc = uzak ? birlestir(yerel, uzak) : yerel;
      if (uzak) await yereleYaz(sonuc);
      const yazildi = await uzagaYaz(sonuc);
      return yazildi ? 'yapildi' : 'hata';
    } catch {
      return 'hata';
    } finally {
      suruyor = null;
    }
  })();
  return suruyor;
}

/**
 * Cikis: once gonder, sonra temizle.
 *
 * NEDEN TEMIZLIYORUZ. Cihazda birden fazla kisi olabilir ve cikis yapan
 * kisinin ilerlemesi, seri sayaci ve adi ekranda kalmamali. Artik
 * guvenli, cunku veri hesapta duruyor ve tekrar girince geri geliyor.
 *
 * NEDEN ONCE SENKRON. Cevrimdisi bir cihazda son dersin ilerlemesi henuz
 * sunucuya gitmemis olabilir; once silip sonra gondermeye calismak o
 * ilerlemeyi yok etmek demek. Senkron tutmazsa cikis YAPILMIYOR ve
 * cagirana bildiriliyor — karari kullanici veriyor.
 */
export type CikisSonuc = 'yapildi' | 'senkronOlmadi';

export async function cikisVeTemizle(zorla = false): Promise<CikisSonuc> {
  const sonuc = await senkronla();
  if (sonuc === 'hata' && !zorla) return 'senkronOlmadi';
  await cikisYap();
  await resetAll();
  return 'yapildi';
}
