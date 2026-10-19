// Site uretici (tools/site.mjs) icin ek veriler: LGS uniteleri, cikmis sorular,
// mufredat, kelime sayfasi ekleri ve konular. Hepsi depodaki duz dosyalardan.
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '..');
const satirlar = (dosya) =>
  fs.readFileSync(path.join(KOK, dosya), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('|'));

/** 8. sinif eski program (LGS 2027) unite adlari ve adresleri. */
export const UNITELER = [
  'Friendship', 'Teen Life', 'In the Kitchen', 'On the Phone', 'The Internet',
  'Adventures', 'Tourism', 'Chores', 'Science', 'Natural Forces',
].map((ad, i) => ({
  no: i + 1,
  ad,
  yol: `/lgs/${i + 1}-unite-${ad.toLowerCase().replace(/^the /, '').replace(/[^a-z]+/g, '-')}/`,
}));

/**
 * LGS kelimeleri (`tools/mufredat/lgs8-etiket.txt`). Tur: K hafiza teknikli,
 * T tanidik, R gorsel cagrisim, I kalip, V zaten kartta. Not alaninda
 * "yazılış · ONAYLI 18 Ekim · <cumle>" ya da "ses · öneri 18 Ekim · <cumle>".
 */
export function lgsKelimeleri() {
  return satirlar('tools/mufredat/lgs8-etiket.txt').map(([unite, en, tr, tur, kanca, ses, not = '']) => {
    const parca = not.split(' · ');
    const yol = ['ses', 'yazılış', 'ses+yazılış'].includes(parca[0]) ? parca[0] : '';
    const cumle = yol && parca[2] ? parca[2] : '';
    return { unite: Number(unite), en, tr, tur, kanca, ses: Number(ses) || 0, yol, cumle, not };
  });
}

/** LGS 2018-2025 cikmis sorulardaki gecis sayisi (`tools/mufredat/cikmis.json`). */
export function cikmis() {
  const liste = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/mufredat/cikmis.json'), 'utf8'));
  return new Map(liste.map((x) => [x.en, x]));
}

/** 2-8. sinif ders kitabi sozlukleri (`tools/mufredat/mufredat.json`). */
export function mufredat() {
  return JSON.parse(fs.readFileSync(path.join(KOK, 'tools/mufredat/mufredat.json'), 'utf8'));
}

/** Kelime sayfasi ekleri: okunus, ornek cumle, cevirisi (`tools/kelime-ek.txt`). */
export function kelimeEk() {
  return new Map(satirlar('tools/kelime-ek.txt').map(([id, okunus, ornek, ornekTr]) => [id, { okunus, ornek, ornekTr }]));
}

export const KONU_ADI = {
  ev: 'Ev & eşya', mutfak: 'Mutfak & yemek', vucut: 'Vücut & sağlık', doga: 'Doğa & hava',
  hayvan: 'Hayvanlar', ulasim: 'Ulaşım & yol', okul: 'Okul & ofis', para: 'Para & iş',
  spor: 'Spor', giyim: 'Giyim & aksesuar', yapi: 'Yapı & alet', insan: 'İnsanlar',
  zaman: 'Zaman', eylem: 'Eylemler', nitelik: 'Nitelikler', duygu: 'Duygular',
  yer: 'Yerler', renk: 'Renkler',
};

/** Kart → konu anahtari (1-300 kart-inceleme.json, 301-400 konu-ek.json). */
export function konular() {
  const inceleme = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/kart-inceleme.json'), 'utf8'));
  const ek = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/konu-ek.json'), 'utf8'));
  const m = new Map();
  for (const [id, s] of Object.entries(inceleme)) if (!id.startsWith('_')) m.set(id, String(s).split('|')[2]);
  for (const [id, k] of Object.entries(ek)) if (!id.startsWith('_')) m.set(id, k);
  return m;
}
