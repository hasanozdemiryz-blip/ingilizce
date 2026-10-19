// LGS kartlarini uygulama verisine cevirir (20 Ekim 2026, Asama 2).
//   node tools/mufredat/lgs-icerik.mjs  → content/lgs.json
//
// Kaynak: tools/mufredat/lgs-kart.json (387 kart metni) + lgs8-etiket.txt'teki
// V satirlari (LGS kelimesi zaten Genel'de kart; uniteye o kart baglanir) +
// seviye.json (Genel kartlarinin seviyesi).
//
// cards.json'a DOKUNULMAZ: o dosya xlsx'ten uretiliyor (npm run import:cards),
// ek alanlar orada olsa bir sonraki iceri aktarmada silinirdi.
//
// Cikti:
//   kartlar  LGS kartlari, Card bicimi + tur/yol/unite/seviye/genel
//   mevcut   [{ id, unite }] — uniteye bagli Genel kartlari (V)
//   seviye   { genelKartId: 'baslangic' | 'orta' }
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '../..');
const oku = (d) => JSON.parse(fs.readFileSync(path.join(KOK, d), 'utf8'));
const lgs = oku('tools/mufredat/lgs-kart.json');
const genel = oku('content/cards.json');
const seviye = oku('tools/mufredat/seviye.json');
const genelId = new Set(genel.map((k) => k.id));
const genelEn = new Map(genel.map((k) => [k.en.toLowerCase(), k.id]));

/** izgara-plan.mjs'teki ile ayni kural: kelimeden; Genel'le cakisirsa "lgs-" oneki. */
const lgsId = (en) => {
  const s = en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return genelId.has(s) ? `lgs-${s}` : s;
};

// Gorseli olan kartta sahne tarifi (Ingilizce prompt) uygulamada hic
// gosterilmiyor; pakete girmesin (~60 KB). Yalniz gorselsiz kartta kalir.
const gorselli = new Set(
  fs.existsSync(path.join(KOK, 'src/assets/cards-lgs'))
    ? fs.readdirSync(path.join(KOK, 'src/assets/cards-lgs')).map((f) => f.replace(/\.webp$/, ''))
    : [],
);

const kartlar = lgs.map((k, i) => ({
  id: lgsId(k.en),
  order: i + 1,
  en: k.en,
  tr: k.tr,
  // T (Turkcede ayni) kartta kanca kelimenin Turkce bicimi; G ve I'da kanca yok,
  // cagrisim gorselde. Bos kanca ekranda gosterilmez.
  hook: k.kanca,
  sentence: k.cumle,
  imageNote: gorselli.has(lgsId(k.en)) ? '' : k.sahne,
  klass: 'tutan',
  decision: null,
  image: null,
  tur: k.tur,
  yol: k.yol || null,
  unite: k.unite,
  seviye: k.seviye,
  genel: k.genel,
}));

const etiket = fs
  .readFileSync(path.join(KOK, 'tools/mufredat/lgs8-etiket.txt'), 'utf8')
  .split(/\r?\n/)
  .filter((l) => l.trim() && !l.startsWith('#'))
  .map((l) => l.split('|'));
const eksik = [];
const mevcut = etiket
  .filter((r) => r[3] === 'V')
  .map((r) => {
    const id = genelEn.get(r[1].toLowerCase());
    if (!id) eksik.push(r[1]);
    return { id, unite: Number(r[0]) };
  })
  .filter((m) => m.id);

const seviyeHarita = Object.fromEntries(Object.entries(seviye.kart).map(([id, s]) => [id, s.seviye]));

fs.writeFileSync(path.join(KOK, 'content/lgs.json'), JSON.stringify({ kartlar, mevcut, seviye: seviyeHarita }));
const uniteSay = Array.from({ length: 10 }, (_, i) => kartlar.filter((k) => k.unite === i + 1).length + mevcut.filter((m) => m.unite === i + 1).length);
console.log(`content/lgs.json: ${kartlar.length} LGS karti + ${mevcut.length} Genel karti uniteye bagli; unite basina ${uniteSay.join(' ')}`);
if (eksik.length) {
  console.log(`Genel'de bulunamayan V kelimeleri: ${eksik.join(', ')}`);
  process.exitCode = 1;
}
