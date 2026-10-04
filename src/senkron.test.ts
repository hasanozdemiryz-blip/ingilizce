import { describe, expect, it } from 'vitest';
import { birlestir, tazelik, type Paket } from './senkron';
import type { AppState, Cevap, Progress } from './types';

const durum = (p: Partial<AppState> = {}): AppState => ({
  onboarded: true,
  sound: true,
  dailyLimit: 10,
  streakCount: 0,
  freezes: 0,
  days: {},
  reminderHour: null,
  reminderMinute: 0,
  lastSessionDate: null,
  ...p,
});

const kart = (cardId: string, p: Partial<Progress> = {}): Progress =>
  ({
    cardId,
    fsrs: { last_review: null } as unknown as Progress['fsrs'],
    step: 1,
    introduced: true,
    introducedAt: null,
    firstCheckOk: null,
    unaidedOk: null,
    produceOk: null,
    hookRevealCount: 0,
    failCount: 0,
    due: new Date('2026-10-01'),
    ...p,
  }) as Progress;

const paket = (yazildi: string, p: Partial<Paket> = {}): Paket => ({
  surum: 1,
  yazildi,
  state: durum(),
  progress: [],
  answers: [],
  ...p,
});

const cevap = (cardId: string, ts: number): Cevap => ({
  cardId,
  ts,
  gun: '2026-10-04',
  ok: true,
  step: 1,
  ipucu: false,
  kaynak: 'ders',
});

describe('birlestir — kartlar', () => {
  it('yalnizca bir tarafta olan kart korunur', () => {
    const a = paket('2026-10-04T10:00:00Z', { progress: [kart('snake')] });
    const b = paket('2026-10-04T11:00:00Z', { progress: [kart('fox')] });
    const s = birlestir(a, b);
    expect(s.progress.map((p) => p.cardId).sort()).toEqual(['fox', 'snake']);
  });

  it('son hareket eden kazanir — paket tazeligi degil', () => {
    // b paketi daha taze ama kartta ESKI hareket var; kart a'dan gelmeli.
    const a = paket('2026-10-04T10:00:00Z', {
      progress: [kart('snake', { step: 4, introducedAt: '2026-10-03T00:00:00Z' })],
    });
    const b = paket('2026-10-04T23:00:00Z', {
      progress: [kart('snake', { step: 1, introducedAt: '2026-10-01T00:00:00Z' })],
    });
    expect(birlestir(a, b).progress[0].step).toBe(4);
  });

  it('esit hareketde daha ileri basamak kazanir — ilerleme geri gitmesin', () => {
    const a = paket('2026-10-04T10:00:00Z', { progress: [kart('snake', { step: 2 })] });
    const b = paket('2026-10-04T11:00:00Z', { progress: [kart('snake', { step: 5 })] });
    expect(birlestir(a, b).progress[0].step).toBe(5);
  });

  it('fsrs son tekrari introducedAt onune geciyor', () => {
    const a = paket('2026-10-04T10:00:00Z', {
      progress: [
        kart('snake', {
          step: 6,
          introducedAt: '2026-10-01T00:00:00Z',
          fsrs: { last_review: new Date('2026-10-05T00:00:00Z') } as unknown as Progress['fsrs'],
        }),
      ],
    });
    const b = paket('2026-10-04T11:00:00Z', {
      progress: [kart('snake', { step: 3, introducedAt: '2026-10-04T00:00:00Z' })],
    });
    expect(birlestir(a, b).progress[0].step).toBe(6);
  });
});

describe('birlestir — durum', () => {
  it('seriler kaybolmaz, en buyugu kalir', () => {
    const a = paket('2026-10-04T10:00:00Z', {
      state: durum({ streakCount: 7, bestStreak: 9, freezes: 1 }),
    });
    const b = paket('2026-10-04T11:00:00Z', {
      state: durum({ streakCount: 2, bestStreak: 3, freezes: 0 }),
    });
    const s = birlestir(a, b).state;
    expect([s.streakCount, s.bestStreak, s.freezes]).toEqual([7, 9, 1]);
  });

  it('tercihler TAZE paketten gelir', () => {
    const a = paket('2026-10-04T10:00:00Z', { state: durum({ dailyLimit: 5, sound: true }) });
    const b = paket('2026-10-04T11:00:00Z', { state: durum({ dailyLimit: 15, sound: false }) });
    const s = birlestir(a, b).state;
    expect([s.dailyLimit, s.sound]).toEqual([15, false]);
  });

  it('ayni gunun sayaclari toplanmaz, en yuksegi alinir', () => {
    const a = paket('2026-10-04T10:00:00Z', { state: durum({ days: { '2026-10-04': { r: 12, i: 3 } } }) });
    const b = paket('2026-10-04T11:00:00Z', { state: durum({ days: { '2026-10-04': { r: 5, i: 8 } } }) });
    expect(birlestir(a, b).state.days['2026-10-04']).toEqual({ r: 12, i: 8, d: 0, y: 0 });
  });

  it('bir tarafta karsilama gorulduyse tekrar cikmaz', () => {
    const a = paket('2026-10-04T10:00:00Z', { state: durum({ onboarded: true }) });
    const b = paket('2026-10-04T11:00:00Z', { state: durum({ onboarded: false }) });
    expect(birlestir(a, b).state.onboarded).toBe(true);
  });

  it('gorulen uyelik davetleri birlesir', () => {
    const a = paket('2026-10-04T10:00:00Z', { state: durum({ uyelikDavetGorulen: ['ilk'] }) });
    const b = paket('2026-10-04T11:00:00Z', { state: durum({ uyelikDavetGorulen: ['kelime10'] }) });
    expect(birlestir(a, b).state.uyelikDavetGorulen?.sort()).toEqual(['ilk', 'kelime10']);
  });
});

describe('birlestir — cevaplar', () => {
  it('ayni cevap iki kez sayilmaz', () => {
    const c = cevap('snake', 1000);
    const s = birlestir(
      paket('2026-10-04T10:00:00Z', { answers: [c] }),
      paket('2026-10-04T11:00:00Z', { answers: [c] }),
    );
    expect(s.answers).toHaveLength(1);
  });

  it('iki cihazin cevaplari zaman sirasinda birlesir', () => {
    const s = birlestir(
      paket('2026-10-04T10:00:00Z', { answers: [cevap('snake', 3000), cevap('fox', 1000)] }),
      paket('2026-10-04T11:00:00Z', { answers: [cevap('cup', 2000)] }),
    );
    expect(s.answers.map((c) => c.ts)).toEqual([1000, 2000, 3000]);
  });
});

describe('birlestir — saflik', () => {
  it('girdiyi degistirmez', () => {
    const a = paket('2026-10-04T10:00:00Z', { progress: [kart('snake')] });
    const b = paket('2026-10-04T11:00:00Z', { progress: [kart('fox')] });
    birlestir(a, b);
    expect(a.progress).toHaveLength(1);
    expect(b.progress).toHaveLength(1);
  });
});

describe('tazelik', () => {
  it('bos cihaz sifir doner — sunucudaki veriyi ezmesin', () => {
    expect(tazelik({ state: durum(), progress: [], answers: [] })).toBe(
      new Date(0).toISOString(),
    );
  });

  it('en son hareket kazanir', () => {
    const t = tazelik({
      state: durum({ lastSessionDate: '2026-10-01' }),
      progress: [kart('snake', { introducedAt: '2026-10-03T00:00:00Z' })],
      answers: [cevap('fox', Date.parse('2026-10-02T00:00:00Z'))],
    });
    expect(t).toBe('2026-10-03T00:00:00.000Z');
  });

  it('cikis sonrasi bos cihaz, sunucudaki ada ve tercihlere dokunmaz', () => {
    // Senaryo: kullanici cikti, cihaz sifirlandi, tekrar girdi.
    const bos: Paket = {
      surum: 1,
      yazildi: tazelik({ state: durum({ dailyLimit: 10 }), progress: [], answers: [] }),
      state: durum({ dailyLimit: 10, streakCount: 0 }),
      progress: [],
      answers: [],
    };
    const sunucu: Paket = {
      surum: 1,
      yazildi: '2026-10-04T12:00:00Z',
      state: durum({ dailyLimit: 15, streakCount: 9 }),
      progress: [kart('snake', { step: 4, introducedAt: '2026-10-04T12:00:00Z' })],
      answers: [],
    };
    const s = birlestir(bos, sunucu);
    expect(s.state.dailyLimit).toBe(15);
    expect(s.state.streakCount).toBe(9);
    expect(s.progress).toHaveLength(1);
  });
});
