// Ders kitabi sozluklerini (pdftotext -layout) sutunlara ayirip kelime listesine cevirir.
// Kullanim: node sozluk-ayikla.mjs <sozluk_l klasoru> <cikti.json>
import fs from 'node:fs';
import path from 'node:path';

const [, , klasor, cikti] = process.argv;

const KITAPLAR = [
  { dosya: 's2.txt', sinif: 2, program: 'maarif', bicim: 'anlamli' },
  { dosya: 's3.txt', sinif: 3, program: 'maarif', bicim: 'anlamli' },
  { dosya: 's4.txt', sinif: 4, program: 'eski', bicim: 'yalin' },
  { dosya: 's5.txt', sinif: 5, program: 'maarif', bicim: 'anlamli' },
  { dosya: 's6.txt', sinif: 6, program: 'maarif', bicim: 'anlamli' },
  { dosya: 's7.txt', sinif: 7, program: 'maarif', bicim: 'anlamli' },
  { dosya: 's8.txt', sinif: 8, program: 'eski', bicim: 'yalin' },
];

const BASLIK = /^(THEME|UNIT)\s+(\d+)\b\s*(.*)$/i;
const DUR = /^(BIBLIOGRAPHY|VISUALS|ANSWER KEY|REFERENCES|KAYNAK)/i;

/** Bir sayfayi sutunlara bol: her satiri 2+ bosluktan parcala, baslangic noktalarini kumele. */
function sutunlar(sayfa) {
  const satirlar = sayfa.split('\n');
  const parcalar = [];
  satirlar.forEach((s, y) => {
    const re = /\S+(?: \S+)*/g;
    let m;
    while ((m = re.exec(s))) parcalar.push({ y, x: m.index, metin: m[0] });
  });
  const sayac = new Map();
  for (const p of parcalar) sayac.set(p.x, (sayac.get(p.x) || 0) + 1);
  let capalar = [...sayac.entries()].filter(([, n]) => n >= 3).map(([x]) => x).sort((a, b) => a - b);
  const birlesik = [];
  for (const x of capalar) if (!birlesik.length || x - birlesik.at(-1) > 6) birlesik.push(x);
  capalar = birlesik.length ? birlesik : [0];
  const kolon = (x) => {
    let k = 0;
    capalar.forEach((c, i) => { if (x + 4 >= c) k = i; });
    return k;
  };
  const sut = capalar.map(() => []);
  for (const p of parcalar) sut[kolon(p.x)].push(p);
  return sut.map((liste) => liste.sort((a, b) => a.y - b.y).map((p) => p.metin));
}

const sonuc = [];
for (const k of KITAPLAR) {
  const ham = fs.readFileSync(path.join(klasor, k.dosya), 'utf8');
  let unite = null;
  let unAd = '';
  let bitti = false;
  for (const sayfa of ham.split('\f')) {
    if (bitti) break;
    for (const sutun of sutunlar(sayfa)) {
      for (let metin of sutun) {
        metin = metin.trim();
        if (!metin || /^\d{1,3}$/.test(metin) || /^(GLOSSARY|Glossary|WORD LIST)$/.test(metin)) continue;
        if (DUR.test(metin)) { bitti = true; break; }
        const b = metin.match(BASLIK);
        if (b) { unite = Number(b[2]); unAd = b[3] || ''; continue; }
        if (unite == null) continue;
        if (k.bicim === 'yalin') {
          if (/^[A-Z ]+$/.test(metin) && metin.length > 3) { unAd = (unAd ? unAd + ' ' : '') + metin; continue; }
          sonuc.push({ sinif: k.sinif, program: k.program, unite, uniteAdi: unAd, en: metin, tr: '' });
          continue;
        }
        const ayr = metin.match(/:| - /);
        const iki = ayr ? ayr.index : -1;
        const uzun = ayr ? ayr[0].length : 1;
        const son = sonuc.at(-1);
        if (iki > 0) {
          sonuc.push({ sinif: k.sinif, program: k.program, unite, uniteAdi: unAd, en: metin.slice(0, iki).trim(), tr: metin.slice(iki + uzun).trim() });
        } else if (son && son.sinif === k.sinif) {
          son.tr = (son.tr + ' ' + metin).trim();
        }
      }
    }
  }
}

for (const s of sonuc) {
  s.tur = (s.en.match(/\((n|v|adj|adv|prep|phr v|phr|conj|pron)\.?\)/i) || [])[1] || '';
  s.en = s.en.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
}
fs.writeFileSync(cikti, JSON.stringify(sonuc, null, 1));
const say = {};
for (const s of sonuc) { const a = `${s.sinif}-${s.unite}`; say[a] = (say[a] || 0) + 1; }
console.log('toplam', sonuc.length);
console.log(say);
