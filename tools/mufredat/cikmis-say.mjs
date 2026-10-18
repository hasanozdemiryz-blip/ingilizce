// LGS cikmis sorularda (2018-2025 Ingilizce bolumu) 8. sinif kelimeleri kac sinavda geciyor.
// Kullanim: node cikmis-say.mjs <txt klasoru> <cikti.json>
// txt: her sinavin `pdftotext -enc UTF-8` ciktisi, adinda yil (ornek lgs2024.txt).
// Kaynak PDF'ler: bilgenc.com/lgs-ingilizce-cikmis-sorular (MEB kitapciklari, Drive).
import fs from 'node:fs';
import path from 'node:path';

const [, , klasor, cikti] = process.argv;
const etiket = fs.readFileSync(path.join(import.meta.dirname, 'lgs8-etiket.txt'), 'utf8')
  .split(/\r?\n/).filter((l) => l && !l.startsWith('#')).map((l) => l.split('|'));

const sinavlar = fs.readdirSync(klasor).filter((f) => /\.txt$/.test(f)).map((f) => ({
  yil: Number((f.match(/20\d\d/) || [])[0]),
  metin: ' ' + fs.readFileSync(path.join(klasor, f), 'utf8').toLowerCase()
    .replace(/[’']/g, "'").replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ') + ' ',
}));

/** Basit cekim: -s, -es, -ed, -d, -ing, sondaki e dusmesi, y → ies/ied. */
function bicimler(soz) {
  const s = new Set([soz]);
  s.add(soz + 's'); s.add(soz + 'es'); s.add(soz + 'ed'); s.add(soz + 'd'); s.add(soz + 'ing');
  if (soz.endsWith('e')) s.add(soz.slice(0, -1) + 'ing');
  if (/[^aeiou]y$/.test(soz)) { s.add(soz.slice(0, -1) + 'ies'); s.add(soz.slice(0, -1) + 'ied'); }
  if (/[^aeiou][aeiou][bdgmnprt]$/.test(soz)) { const c = soz.at(-1); s.add(soz + c + 'ed'); s.add(soz + c + 'ing'); }
  return [...s];
}

const sonuc = etiket.map(([unite, en, tr, tur]) => {
  const ana = en.toLowerCase().replace(/-/g, ' ');
  const parca = ana.split(' ');
  // Kalip: yalniz ilk kelime cekimlenir (count on → counted on).
  const kaliplar = parca.length > 1 ? bicimler(parca[0]).map((b) => [b, ...parca.slice(1)].join(' ')) : bicimler(ana);
  let toplam = 0;
  const yillar = [];
  for (const s of sinavlar) {
    let n = 0;
    for (const k of kaliplar) n += s.metin.split(` ${k} `).length - 1;
    if (n) { yillar.push(s.yil); toplam += n; }
  }
  return { unite: Number(unite), en, tr, tur, sinav: yillar.length, toplam, yillar: yillar.sort() };
});
fs.writeFileSync(cikti, JSON.stringify(sonuc.filter((x) => x.sinav), null, 1));
const sirali = sonuc.filter((x) => x.sinav).sort((a, b) => b.sinav - a.sinav || b.toplam - a.toplam);
console.log(`${sinavlar.length} sinav (${sinavlar.map((s) => s.yil).sort().join(', ')}); ${sirali.length}/${sonuc.length} kelime en az bir sinavda`);
console.log(sirali.slice(0, 40).map((x) => `${x.en}(${x.sinav}/${x.toplam})`).join(', '));
