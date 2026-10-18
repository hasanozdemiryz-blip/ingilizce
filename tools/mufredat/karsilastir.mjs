// sozluk.json'u temizler, tekillestirir ve uygulamadaki kartlarla karsilastirir.
// Kullanim: node karsilastir.mjs <sozluk.json> <cards.json> <cikti.json>
import fs from 'node:fs';

const [, , sozlukYolu, kartYolu, cikti] = process.argv;
const ham = JSON.parse(fs.readFileSync(sozlukYolu, 'utf8'));
const kartlar = JSON.parse(fs.readFileSync(kartYolu, 'utf8'));

// Yalin listelerde (4. ve 8. sinif) iki satira bolunmus ifadeler.
const BIRLESTIR = [
  ['get on well with', 'somebody'], ['bed and', 'breakfast'], ['put someone', 'through'],
  ['social networking', 'site'], ['take out the', 'garbage / trash'], ['load/empty the', 'dishwasher'],
  ['keep/break', 'promises'], ['wash / dry the', 'dishes'],
];
const temiz = [];
for (let i = 0; i < ham.length; i++) {
  const s = { ...ham[i] };
  const b = BIRLESTIR.find(([a]) => a === s.en);
  if (b && ham[i + 1]?.en === b[1]) { s.en = `${b[0]} ${b[1]}`; i++; }
  if (/^\.\.\./.test(s.en) || /\.\.\.$/.test(s.en)) continue; // 4. sinif "go ..." kaliplari
  s.tr = s.tr.replace(/(\p{L})- (\p{L})/gu, '$1$2');
  temiz.push(s);
}

const anahtar = (en) =>
  en.toLowerCase().replace(/[’']/g, "'").replace(/^(a|an|the|to) /, '').replace(/[!?.]+$/, '').trim();

const kartEn = new Map(kartlar.map((k) => [anahtar(k.en), k.id]));
const kelimeler = new Map();
for (const s of temiz) {
  const a = anahtar(s.en);
  if (!a) continue;
  if (!kelimeler.has(a)) kelimeler.set(a, { en: s.en, tr: s.tr, siniflar: new Set(), yerler: [], tur: s.tur });
  const k = kelimeler.get(a);
  k.siniflar.add(s.sinif);
  k.yerler.push(`${s.sinif}.${s.program === 'eski' ? 'U' : 'T'}${s.unite}`);
  if (!k.tr && s.tr) k.tr = s.tr;
}

const liste = [...kelimeler.entries()].map(([a, k]) => {
  const sinif = [...k.siniflar].sort((x, y) => x - y);
  const ifade = /\s|\//.test(a);
  return {
    en: k.en, tr: k.tr, siniflar: sinif, yerler: k.yerler.join(' '),
    kids: sinif.some((g) => g <= 6), lgs: sinif.some((g) => g >= 7),
    ifade, kartta: kartEn.get(a) || '',
  };
});
fs.writeFileSync(cikti, JSON.stringify(liste, null, 1));

const say = (f) => liste.filter(f).length;
console.log('benzersiz kelime/ifade:', liste.length, '| tek kelime:', say((x) => !x.ifade), '| ifade:', say((x) => x.ifade));
console.log('Kids (2-6):', say((x) => x.kids), '| tek kelime', say((x) => x.kids && !x.ifade));
console.log('LGS (7-8):', say((x) => x.lgs), '| tek kelime', say((x) => x.lgs && !x.ifade));
console.log('Kids ∩ LGS:', say((x) => x.kids && x.lgs));
console.log('mevcut 400 kartta olan:', say((x) => x.kartta), '| Kids', say((x) => x.kids && x.kartta), '| LGS', say((x) => x.lgs && x.kartta));
console.log('yeni (kartta yok) tek kelime: Kids', say((x) => x.kids && !x.kartta && !x.ifade), '| LGS', say((x) => x.lgs && !x.kartta && !x.ifade),
  '| ikisi birlikte', say((x) => (x.kids || x.lgs) && !x.kartta && !x.ifade));
for (let g = 2; g <= 8; g++) console.log(`  ${g}. sınıf:`, say((x) => x.siniflar.includes(g)), '| ilk kez bu sınıfta:', say((x) => x.siniflar[0] === g));
const kartSet = new Set(liste.filter((x) => x.kartta).map((x) => x.kartta));
console.log('400 kartın kaçı müfredatta hiç geçmiyor:', kartlar.filter((k) => !kartSet.has(k.id)).length);
