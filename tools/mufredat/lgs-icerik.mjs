// LGS kartlarini uygulama verisine cevirir (20 Ekim 2026, Asama 2).
//   node tools/mufredat/lgs-icerik.mjs  → content/lgs.json
//
// Kaynak: tools/mufredat/lgs-kart.json (387 kart metni) + lgs8-etiket.txt'teki
// V satirlari (LGS kelimesi zaten Genel'de kart; uniteye o kart baglanir) +
// seviye.json (Genel kartlarinin seviyesi) + ornek cumleler (LGS:
// tools/mufredat/lgs-ornek/uNN.txt, Genel: tools/kelime-ek.txt).
//
// cards.json'a DOKUNULMAZ: o dosya xlsx'ten uretiliyor (npm run import:cards),
// ek alanlar orada olsa bir sonraki iceri aktarmada silinirdi.
//
// Cikti:
//   kartlar  LGS kartlari, Card bicimi + tur/yol/unite/seviye/genel/ornek
//   mevcut   [{ id, unite }] — uniteye bagli Genel kartlari (V)
//   seviye   { genelKartId: 'baslangic' | 'orta' }
//   ornek    { genelKartId: [Ingilizce cumle, Turkcesi] }
//
// ORNEK CUMLE merdivenin son basamaginda (cumle icinde bosluk doldurma)
// kullaniliyor; kelime cumlede AYNEN gecmeli (washes, candles olmaz) yoksa
// siklar cekim ekinden ele verir. Gecmeyen cumle disarida birakilir.
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '../..');
const oku = (d) => JSON.parse(fs.readFileSync(path.join(KOK, d), 'utf8'));
const lgs = oku('tools/mufredat/lgs-kart.json');
const genel = oku('content/cards.json');
const seviye = oku('tools/mufredat/seviye.json');
const genelId = new Set(genel.map((k) => k.id));
const genelEn = new Map(genel.map((k) => [k.en.toLowerCase(), k.id]));
const satirlar = (d) =>
  fs
    .readFileSync(d, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() && !l.startsWith('#'))
    .map((l) => l.split('|').map((x) => x.trim()));

/** Kelime (ya da kalip) cumlede aynen geciyor mu — buyuk/kucuk harf farketmez. */
const geciyor = (kelime, cumle) => {
  const kacis = kelime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z])${kacis}([^a-z]|$)`, 'i').test(cumle);
};

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

const sorunlar = [];

// LGS ornek cumleleri
const ORNEK_KLASOR = path.join(KOK, 'tools/mufredat/lgs-ornek');
const lgsOrnek = new Map();
for (const f of fs.readdirSync(ORNEK_KLASOR).filter((f) => /^u\d\d\.txt$/.test(f))) {
  for (const [en, cumle, tr] of satirlar(path.join(ORNEK_KLASOR, f))) {
    if (!cumle || !tr) sorunlar.push(`${f}: eksik alan: ${en}`);
    else if (!geciyor(en, cumle)) sorunlar.push(`${f}: "${en}" cumlede aynen gecmiyor: ${cumle}`);
    else lgsOrnek.set(en, [cumle, tr]);
  }
}

const kartlar = lgs.map((k, i) => {
  const o = lgsOrnek.get(k.en);
  if (!o) sorunlar.push(`ornek yok: ${k.en}`);
  return {
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
    ...(o ? { ornek: o[0], ornekTr: o[1] } : {}),
  };
});

const eksik = [];
const mevcut = satirlar(path.join(KOK, 'tools/mufredat/lgs8-etiket.txt'))
  .filter((r) => r[3] === 'V')
  .map((r) => {
    const id = genelEn.get(r[1].toLowerCase());
    if (!id) eksik.push(r[1]);
    return { id, unite: Number(r[0]) };
  })
  .filter((m) => m.id);

const seviyeHarita = Object.fromEntries(Object.entries(seviye.kart).map(([id, s]) => [id, s.seviye]));

// Genel ornek cumleleri (kelime sayfalari icin yazilmisti, 18 Ekim)
const genelEnId = new Map(genel.map((k) => [k.id, k.en]));
const genelOrnek = {};
let genelAtlanan = 0;
for (const [id, , cumle, tr] of satirlar(path.join(KOK, 'tools/kelime-ek.txt'))) {
  const en = genelEnId.get(id);
  if (en && cumle && geciyor(en, cumle)) genelOrnek[id] = [cumle, tr];
  else genelAtlanan++;
}

fs.writeFileSync(
  path.join(KOK, 'content/lgs.json'),
  JSON.stringify({ kartlar, mevcut, seviye: seviyeHarita, ornek: genelOrnek }),
);
const uniteSay = Array.from(
  { length: 10 },
  (_, i) => kartlar.filter((k) => k.unite === i + 1).length + mevcut.filter((m) => m.unite === i + 1).length,
);
console.log(
  `content/lgs.json: ${kartlar.length} LGS karti (${kartlar.filter((k) => k.ornek).length} ornekli) + ${mevcut.length} Genel karti uniteye bagli; unite basina ${uniteSay.join(' ')}`,
);
console.log(`Genel ornek: ${Object.keys(genelOrnek).length} (cekimli ${genelAtlanan} atlandi)`);
if (eksik.length) sorunlar.push(`Genel'de bulunamayan V kelimeleri: ${eksik.join(', ')}`);
if (sorunlar.length) {
  console.log(`${sorunlar.length} SORUN:\n${sorunlar.join('\n')}`);
  process.exitCode = 1;
}
