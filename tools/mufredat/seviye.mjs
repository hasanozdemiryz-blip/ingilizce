// Genel icin seviye: Baslangic / Orta (KARARLAR 5, 19 Ekim 2026).
// Olcu kelimenin kendi zorlugu: Oxford 3000/5000 CEFR — A1–A2 Baslangic, B1+ Orta.
// Listede yoksa ilk gectigi sinif (2–6 Baslangic, 7–8 Orta). Kalip ifadede ilk
// kelimenin seviyesi; o da yoksa Orta.
//
//   node tools/mufredat/seviye.mjs <oxford_5000.csv>   → tools/mufredat/seviye.json
// CSV: github.com/winterdl/oxford-5000-vocabulary-audio-definition data/oxford_5000.csv
// (depoya alinmadi; yalniz turetilmis seviye depoda).
import fs from 'node:fs';
import path from 'node:path';

const [, , csvYolu] = process.argv;
const KOK = path.resolve(import.meta.dirname, '../..');

/** CSV satiri: tirnak icindeki virgulleri bolmeden ilk dort alan yeter (no, word, type, cefr). */
function ilkAlanlar(satir) {
  const alan = [];
  let ic = false;
  let cur = '';
  for (const ch of satir) {
    if (ch === '"') ic = !ic;
    else if (ch === ',' && !ic) { alan.push(cur); cur = ''; if (alan.length === 4) break; }
    else cur += ch;
  }
  if (alan.length < 4) alan.push(cur);
  return alan;
}
const cefr = new Map();
const SIRA = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
for (const satir of fs.readFileSync(csvYolu, 'utf8').split(/\r?\n/).slice(1)) {
  const [, word, , c] = ilkAlanlar(satir);
  if (!word || !SIRA.includes(c)) continue;
  const w = word.toLowerCase().trim();
  // Ayni kelimenin birden fazla turu varsa en dusuk seviye (en temel anlam).
  if (!cefr.has(w) || SIRA.indexOf(c) < SIRA.indexOf(cefr.get(w))) cefr.set(w, c);
}

const seviyeAdi = (c) => (['a1', 'a2'].includes(c) ? 'baslangic' : 'orta');
function seviyeBul(en, ilkSinif) {
  const w = en.toLowerCase().replace(/[^a-z' -]/g, '').trim();
  const kok = [w, w.replace(/(ies)$/, 'y'), w.replace(/(es|s|ed|ing)$/, ''), w.replace(/ing$/, 'e')];
  for (const k of kok) if (cefr.has(k)) return { seviye: seviyeAdi(cefr.get(k)), cefr: cefr.get(k), kaynak: 'oxford' };
  const ilk = w.split(/[ /-]/)[0];
  if (w.includes(' ') && cefr.has(ilk)) return { seviye: seviyeAdi(cefr.get(ilk)), cefr: cefr.get(ilk), kaynak: 'kalip-ilk' };
  if (ilkSinif) return { seviye: ilkSinif <= 6 ? 'baslangic' : 'orta', cefr: '', kaynak: `sinif ${ilkSinif}` };
  return { seviye: 'orta', cefr: '', kaynak: 'yok' };
}

const kartlar = JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8'));
const mufredat = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/mufredat/mufredat.json'), 'utf8'));
const ilkSinif = new Map(mufredat.map((x) => [x.en.toLowerCase(), x.siniflar[0]]));
const lgs = fs.readFileSync(path.join(KOK, 'tools/mufredat/lgs8-etiket.txt'), 'utf8')
  .split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => l.split('|'));

const sonuc = { _aciklama: 'Genel seviyesi (19 Ekim). baslangic = A1–A2, orta = B1+. tools/mufredat/seviye.mjs ile uretilir.', kart: {}, lgs: {} };
for (const k of kartlar) sonuc.kart[k.id] = seviyeBul(k.en, ilkSinif.get(k.en.toLowerCase()));
for (const [, en] of lgs) sonuc.lgs[en] = seviyeBul(en, 8);
fs.writeFileSync(path.join(KOK, 'tools/mufredat/seviye.json'), JSON.stringify(sonuc, null, 1));

const say = (o) => Object.values(o).reduce((a, s) => ((a[s.seviye] = (a[s.seviye] || 0) + 1), a), {});
const kay = (o) => Object.values(o).reduce((a, s) => ((a[s.kaynak.split(' ')[0]] = (a[s.kaynak.split(' ')[0]] || 0) + 1), a), {});
console.log('mevcut kartlar', say(sonuc.kart), kay(sonuc.kart));
console.log('LGS', say(sonuc.lgs), kay(sonuc.lgs));
