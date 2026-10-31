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
 * LGS kelimeleri. Tur: K hafiza teknikli, T tanidik, R gorsel cagrisim, I kalip,
 * V zaten Genel'de kart. Etiket notu: "yazılış · ONAYLI 18 Ekim · <cumle>".
 */
//
// 31 Ekim: site artik platformdaki LGS destesinin aynisini okuyor — `content/lgs.json`
// kartlari (1.016) + uniteye bagli Genel kartlari (`mevcut`, 121). Etiket dosyasindan
// yalniz onay notu alinir (vitrinde "ONAYLI" once gelir). G (gorsel) → R.
export function lgsKelimeleri() {
  const json = (d) => JSON.parse(fs.readFileSync(path.join(KOK, d), 'utf8'));
  const lgs = json('content/lgs.json');
  const genel = new Map(json('content/cards.json').map((c) => [c.id, c]));
  const onay = new Map(satirlar('tools/mufredat/lgs8-etiket.txt').map((p) => [p[1], p[6] || '']));
  const TUR = { K: 'K', T: 'T', G: 'R', I: 'I' };
  const yeni = lgs.kartlar.map((k) => ({
    id: k.id, unite: k.unite, en: k.en, tr: k.tr, tur: TUR[k.tur] || 'R', kanca: k.hook || '',
    yol: k.yol || '', cumle: k.sentence || '', not: onay.get(k.en) || '', lgsKart: true,
  }));
  const mevcut = lgs.mevcut.map((m) => {
    const c = genel.get(m.id);
    return { id: m.id, unite: m.unite, en: c.en, tr: c.tr, tur: 'V', kanca: c.hook, yol: 'ses', cumle: c.sentence, not: '' };
  });
  return [...yeni, ...mevcut];
}

/**
 * LGS 2018-2025 cikmis sorulardaki gecis sayisi. Yillariyla sayilanlar
 * `tools/mufredat/cikmis.json` (eski 418); havuz eki (19 Ekim) yalniz sayiyla
 * `lgs-havuz/havuz.json`'da. Ikisi birlesir, cikmis.json onceliklidir.
 */
export function cikmis() {
  const json = (d) => JSON.parse(fs.readFileSync(path.join(KOK, d), 'utf8'));
  const m = new Map(json('tools/mufredat/cikmis.json').map((x) => [x.en, x]));
  for (const h of json('tools/mufredat/lgs-havuz/havuz.json')) {
    if (h.sinav > 0 && !m.has(h.w)) m.set(h.w, { en: h.w, sinav: h.sinav, toplam: h.sinav, yillar: [] });
  }
  return m;
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
