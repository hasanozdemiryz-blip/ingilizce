import { AKTIF_BOLUM } from './bolum';
import { LGS_KART_IDLERI } from './content';
import { APP_KEY, AppDB, DB_ADI, db, EMPTY_STATE, getAnswers, getState, normalizeProgress, resetAll } from './db';
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
function enIyiTestler(
  a: AppState['lgsTest'],
  b: AppState['lgsTest'],
): AppState['lgsTest'] {
  if (!a && !b) return undefined;
  const cikti: Record<string, number> = { ...a };
  for (const [u, n] of Object.entries(b ?? {})) cikti[u] = Math.max(cikti[u] ?? 0, n);
  return cikti;
}

/** Kalip ilerlemesi: her kalipta iki cihazin buyugu (dogru sayisi ve son zaman ayri ayri). */
function kaliplariBirlestir(
  a: AppState['lgsKalip'],
  b: AppState['lgsKalip'],
): AppState['lgsKalip'] {
  if (!a && !b) return undefined;
  const cikti: NonNullable<AppState['lgsKalip']> = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) {
    const o = cikti[k];
    cikti[k] = o ? { d: Math.max(o.d, v.d), t: Math.max(o.t, v.t) } : v;
  }
  return cikti;
}

/** Diyalog ilerlemesi: birlesim; ayni diyalogda en son zaman. */
function diyaloglariBirlestir(
  a: AppState['lgsDiyalog'],
  b: AppState['lgsDiyalog'],
): AppState['lgsDiyalog'] {
  if (!a && !b) return undefined;
  const cikti: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b ?? {})) cikti[k] = Math.max(cikti[k] ?? 0, v);
  return cikti;
}

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
    lgsYil: t.lgsYil,
    lgsUnite: t.lgsUnite,
    taramaGoruldu: t.taramaGoruldu,
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
      // Unite testi: her unitede iki cihazin en iyisi.
      lgsTest: enIyiTestler(a.state.lgsTest, b.state.lgsTest),
      lgsKalip: kaliplariBirlestir(a.state.lgsKalip, b.state.lgsKalip),
      lgsDiyalog: diyaloglariBirlestir(a.state.lgsDiyalog, b.state.lgsDiyalog),
      // Karsilama bir kez gorulur; bir tarafta goruldüyse tekrar cikmasin.
      onboarded: a.state.onboarded || b.state.onboarded,
    },
  };
}

// --- Bolum ayrimi (31 Ekim) ------------------------------------------------

/*
  Genel ve LGS ayri urunler (KARARLAR 14): ilerleme, seri, istatistik, ayar
  her bolumde ayri. Once tek paketteydi; LGS'den giren kullanici Genel'deki
  ilerlemesini LGS'de goruyordu. Ayrilmamis her paket (cihazda ya da
  sunucuda) bir kez ikiye bolunuyor.
*/

/** Her iki bolume de giden kisisel tercihler. Ilerleme ve seri gitmez. */
const ORTAK_TERCIHLER = ['profil', 'sound', 'dailyLimit', 'reminderHour', 'reminderMinute', 'olcum', 'tercihDegisti', 'uyelikDavetGorulen'] as const;

/**
 * Ayrilmamis paketi Genel ve LGS'ye boler. Saf fonksiyon.
 *
 * Kural: Genel'in kendi kartlari Genel'de kalir. LGS kartlari YALNIZ
 * kullanici LGS'yi kullanmissa (yil secmis) LGS'ye gider; LGS'yi hic
 * acmamis birinde o kartlar Genel destesinde ogrenilmistir (Genel'e uygun
 * LGS kartlari Genel'de de var), orada kalir. Yil, unite ve unite testleri
 * LGS'nin; seri, gunler, karsilama Genel'in.
 */
export function paketiAyir(
  p: Paket,
  lgsMi: (cardId: string) => boolean = (id) => LGS_KART_IDLERI.has(id),
): { genel: Paket; lgs: Paket } {
  const lgsKullandi = Boolean(p.state.lgsYil);
  const lgsin = (id: string) => lgsKullandi && lgsMi(id);
  const { lgsYil, lgsUnite, lgsTest, lgsKalip, lgsDiyalog, ...genelState } = p.state;
  const ortak: Partial<AppState> = {};
  for (const k of ORTAK_TERCIHLER) {
    if (p.state[k] !== undefined) (ortak as Record<string, unknown>)[k] = p.state[k];
  }
  const lgsProgress = p.progress.filter((x) => lgsin(x.cardId));
  const lgsAnswers = p.answers.filter((c) => lgsin(c.cardId));
  const lgsState: AppState = {
    ...EMPTY_STATE,
    ...ortak,
    onboarded: lgsKullandi,
    ...(lgsYil ? { lgsYil } : {}),
    ...(lgsUnite ? { lgsUnite } : {}),
    ...(lgsTest ? { lgsTest } : {}),
    ...(lgsKalip ? { lgsKalip } : {}),
    ...(lgsDiyalog ? { lgsDiyalog } : {}),
    bolumAyrildi: true,
  };
  return {
    genel: {
      ...p,
      progress: p.progress.filter((x) => !lgsin(x.cardId)),
      answers: p.answers.filter((c) => !lgsin(c.cardId)),
      state: { ...genelState, bolumAyrildi: true },
    },
    lgs: {
      surum: SURUM,
      yazildi: tazelik({ state: lgsState, progress: lgsProgress, answers: lgsAnswers }),
      state: lgsState,
      progress: lgsProgress,
      answers: lgsAnswers,
    },
  };
}

/** Bos ve "her karsilastirmayi kaybeden" bir paket — karsi tarafin verisini ezmez. */
const bosPaket = (state: AppState): Paket => ({
  surum: SURUM,
  yazildi: new Date(0).toISOString(),
  state: { ...EMPTY_STATE, profil: state.profil, bolumAyrildi: true },
  progress: [],
  answers: [],
});

async function dbOku(d: AppDB): Promise<Paket> {
  const [progress, row, answers] = await Promise.all([d.progress.toArray(), d.meta.get(APP_KEY), d.answers.toArray()]);
  const state = { ...EMPTY_STATE, ...((row?.value as Partial<AppState>) ?? {}) };
  return { surum: SURUM, yazildi: tazelik({ state, progress, answers }), state, progress, answers };
}

async function dbYaz(d: AppDB, p: Paket): Promise<void> {
  await d.transaction('rw', d.progress, d.meta, d.answers, async () => {
    await d.progress.clear();
    await d.progress.bulkPut(p.progress.map(normalizeProgress));
    await d.answers.clear();
    if (p.answers.length > 0) await d.answers.bulkAdd(p.answers.map(({ id: _yok, ...c }) => c));
    await d.meta.put({ key: APP_KEY, value: p.state });
  });
}

/**
 * Cihazdaki eski (ortak) veritabanini bir kez boler. Acilista, her seyden
 * once cagriliyor (bkz. main.tsx). Eski veritabani Genel'in adini tasiyor;
 * LGS'ye ait olanlar LGS veritabanina yazilip Genel'den cikariliyor.
 * Hata olursa sessizce gecer: veri yerinde kalir, bir sonraki acilista denenir.
 */
export async function bolumleriAyir(): Promise<void> {
  const acik: AppDB[] = [];
  const ac = (b: 'genel' | 'lgs'): AppDB => {
    if (AKTIF_BOLUM === b) return db;
    const d = new AppDB(DB_ADI[b]);
    acik.push(d);
    return d;
  };
  try {
    const genelDb = ac('genel');
    const eski = await dbOku(genelDb);
    if (eski.state.bolumAyrildi) return;
    const bos = eski.progress.length === 0 && eski.answers.length === 0 && !eski.state.onboarded;
    if (bos) {
      // Yeni kurulum: ayrilacak bir sey yok, yalniz isaretle.
      await genelDb.meta.put({ key: APP_KEY, value: { ...eski.state, bolumAyrildi: true } });
      return;
    }
    const { genel, lgs } = paketiAyir(eski);
    const lgsDb = ac('lgs');
    const lgsSimdi = await dbOku(lgsDb);
    const lgsDolu = lgsSimdi.progress.length > 0 || lgsSimdi.state.onboarded;
    await dbYaz(lgsDb, lgsDolu ? birlestir(lgsSimdi, lgs) : lgs);
    await dbYaz(genelDb, genel);
  } catch {
    /* veri yerinde; bir sonraki acilista yeniden denenir */
  } finally {
    for (const d of acik) d.close();
  }
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
 * koyuyor. Tek islemde yaziliyor ki yarim kalmis bir senkron karma bir
 * durum birakmasin.
 *
 * YAZMADAN ONCE CIHAZ YENIDEN OKUNUYOR — ayni islemin icinde. Paket,
 * senkronun BASINDA okunan cihaz verisinden uretildi; arada sunucuya
 * gidip gelindi. O arada yazilan her sey (profil, ayar, cevap) paketi
 * dogrudan yazmak ezerdi. Canlida boyle yakalandi: profil ekrani kapanir
 * kapanmaz senkron basliyor, yeni avatar 100 ms sonra kaydediliyor ve
 * 300 ms sonra senkron eski avatari geri yaziyordu. Telefonda "avatar
 * degismiyor" sikayetinin sebebi buydu.
 *
 * Simdiki cihaz verisiyle bir kez daha birlestirmek bunu kapatiyor:
 * `birlestir` her olcekte "yeni olan kazanir" kuralini uyguladigi icin
 * arada yazilan degisiklik korunuyor.
 */
export async function yereleYaz(p: Paket): Promise<void> {
  await db.transaction('rw', db.progress, db.meta, db.answers, async () => {
    const son = birlestir(await yereliOku(), p);
    const progress = son.progress.map(normalizeProgress);
    await db.progress.clear();
    await db.progress.bulkPut(progress);
    await db.answers.clear();
    if (son.answers.length > 0) await db.answers.bulkAdd(son.answers.map(({ id: _yok, ...c }) => c));
    await db.meta.put({ key: APP_KEY, value: son.state });
  });
}

// --- Sunucu tarafi ---------------------------------------------------------

/*
  SUNUCU SEKLI (31 Ekim). Kullanici basina yine tek satir: `veri` Genel'in
  paketi (eski sekil; eski surum uygulamalar okumaya devam etsin), LGS
  paketi onun icinde `veri.lgs`. Satir ayrilmamissa (`state.bolumAyrildi`
  yok) okurken ikiye bolunuyor; ilk yazmada ayrilmis hali gidiyor.
*/
type Satir = Paket & { lgs?: Paket };
type Uzak = { genel: Paket | null; lgs: Paket | null };

const paketMi = (v: unknown): v is Paket => Boolean(v) && Array.isArray((v as Paket).progress);

/** Sunucu satirini bolumlere ayirir. Saf — test edilebilir. */
export function satiriOku(v: unknown): Uzak {
  if (!paketMi(v)) return { genel: null, lgs: null };
  const { lgs: lgsHam, ...genelHam } = v as Satir;
  const lgsVar = paketMi(lgsHam) ? lgsHam : null;
  if (genelHam.state?.bolumAyrildi) return { genel: genelHam, lgs: lgsVar };
  // Ayrilmamis eski satir: bol.
  const ayri = paketiAyir(genelHam);
  return { genel: ayri.genel, lgs: lgsVar ? birlestir(lgsVar, ayri.lgs) : ayri.lgs };
}

async function uzaktanOku(): Promise<Uzak | null> {
  const c = await istemciAl();
  const u = uyeOku();
  if (!c || !u) return null;
  const { data, error } = await c
    .from('ilerleme')
    .select('veri')
    .eq('kullanici', u.id)
    .maybeSingle();
  if (error) return null;
  return satiriOku(data?.veri);
}

async function uzagaYaz(satir: Satir): Promise<boolean> {
  const c = await istemciAl();
  const u = uyeOku();
  if (!c || !u) return false;
  const { error } = await c
    .from('ilerleme')
    .upsert(
      { kullanici: u.id, veri: satir, guncellendi: new Date().toISOString() },
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
      const uzakHepsi = await uzaktanOku();
      if (!uzakHepsi) return 'hata';
      // Yalniz AKTIF bolum birlestirilir; oteki satirda oldugu gibi korunur.
      const uzak = uzakHepsi[AKTIF_BOLUM];
      const sonuc = uzak ? birlestir(yerel, uzak) : yerel;
      if (uzak) await yereleYaz(sonuc);
      const genel = AKTIF_BOLUM === 'genel' ? sonuc : (uzakHepsi.genel ?? bosPaket(sonuc.state));
      const lgs = AKTIF_BOLUM === 'lgs' ? sonuc : uzakHepsi.lgs;
      const satir: Satir = { ...genel, state: { ...genel.state, bolumAyrildi: true }, ...(lgs ? { lgs } : {}) };
      const yazildi = await uzagaYaz(satir);
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

/*
  AYRILIYOR. Cikista ve hesap silmede cihaz temizlenip tanitim sayfasina
  gidiliyor; temizlikle sayfa degisimi arasinda uygulama bir an "karsilama
  yapilmamis" durumu goruyor ve snake karsilamasi yanip sonuyordu. Bayrak
  kalkikken App yalnizca sade bir bekleme ekrani ciziyor.
*/
let ayriliyor = false;
export const ayriliyorMu = (): boolean => ayriliyor;
export const ayriliyorIsaretle = (): void => {
  ayriliyor = true;
};

export async function cikisVeTemizle(zorla = false): Promise<CikisSonuc> {
  const sonuc = await senkronla();
  if (sonuc === 'hata' && !zorla) return 'senkronOlmadi';
  ayriliyor = true;
  await cikisYap();
  await resetAll();
  return 'yapildi';
}
