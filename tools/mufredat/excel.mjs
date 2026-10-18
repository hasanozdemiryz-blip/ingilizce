// mufredat.json -> Excel. exceljs uygulama deposundan yukleniyor.
// Kullanim: node excel.mjs <mufredat.json> <cikti.xlsx>
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../package.json', import.meta.url));
const ExcelJS = require('exceljs');
const [, , girdi, cikti] = process.argv;
const liste = JSON.parse(fs.readFileSync(girdi, 'utf8'));

const UNITE8 = ['Friendship', 'Teen Life', 'In the Kitchen', 'On the Phone', 'The Internet',
  'Adventures', 'Tourism', 'Chores', 'Science', 'Natural Forces'];

const wb = new ExcelJS.Workbook();
const baslikStil = (ws) => {
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16233A' } };
  ws.views = [{ state: 'frozen', ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };
};

const say = (f) => liste.filter(f).length;
const ozet = wb.addWorksheet('Özet');
ozet.columns = [{ header: 'Ne', key: 'a', width: 58 }, { header: 'Sayı', key: 'b', width: 12 }];
[
  ['Benzersiz kelime / ifade (2–8. sınıf ders kitabı sözlükleri)', liste.length],
  ['  tek kelime', say((x) => !x.ifade)],
  ['  kalıp ifade (iki+ kelime)', say((x) => x.ifade)],
  ['Kids (2–6. sınıf)', say((x) => x.kids)],
  ['LGS çekirdeği (7–8. sınıf)', say((x) => x.lgs)],
  ['LGS 2027 — 8. sınıf eski program, 10 ünite', say((x) => x.siniflar.includes(8))],
  ['Mevcut 400 kartta zaten olan', say((x) => x.kartta)],
  ['Yeni kart gereken tek kelime (Kids + LGS)', say((x) => (x.kids || x.lgs) && !x.kartta && !x.ifade)],
  ...[2, 3, 4, 5, 6, 7, 8].map((g) => [`  ${g}. sınıfta ilk kez geçen`, say((x) => x.siniflar[0] === g)]),
  ['Not: 4. ve 8. sınıf eski program (2026-27); 2, 3, 5, 6, 7 Maarif.', ''],
  ['Not: sözlükler yalnızca o yılın yeni kelimeleri; temel kelimeler alt sınıfta.', ''],
].forEach(([a, b]) => ozet.addRow({ a, b }));
baslikStil(ozet);

const ws = wb.addWorksheet('Kelimeler');
ws.columns = [
  { header: 'İngilizce', key: 'en', width: 26 },
  { header: 'Türkçe (kitaptan)', key: 'tr', width: 34 },
  { header: 'İlk sınıf', key: 'ilk', width: 9 },
  { header: 'Sınıflar', key: 'siniflar', width: 12 },
  { header: 'Yer (sınıf.T=tema / U=ünite)', key: 'yerler', width: 22 },
  { header: 'Kids', key: 'kids', width: 7 },
  { header: 'LGS', key: 'lgs', width: 7 },
  { header: 'Kalıp ifade', key: 'ifade', width: 10 },
  { header: 'Mevcut kart', key: 'kartta', width: 12 },
  { header: 'Tür (sonra: kanca/tanıdık/soyut/ifade)', key: 'tur', width: 22 },
];
for (const x of [...liste].sort((a, b) => a.siniflar[0] - b.siniflar[0] || a.en.localeCompare(b.en))) {
  ws.addRow({
    en: x.en, tr: x.tr, ilk: x.siniflar[0], siniflar: x.siniflar.join(','), yerler: x.yerler,
    kids: x.kids ? '✓' : '', lgs: x.lgs ? '✓' : '', ifade: x.ifade ? '✓' : '', kartta: x.kartta, tur: '',
  });
}
baslikStil(ws);

const l8 = wb.addWorksheet('LGS 2027 üniteler');
l8.columns = [
  { header: 'Ünite', key: 'u', width: 6 }, { header: 'Ünite adı', key: 'ad', width: 16 },
  { header: 'İngilizce', key: 'en', width: 30 }, { header: 'Kalıp ifade', key: 'ifade', width: 10 },
  { header: 'Mevcut kart', key: 'kartta', width: 12 },
];
const satirlar = [];
for (const x of liste) for (const y of x.yerler.split(' ')) {
  const m = y.match(/^8\.U(\d+)$/);
  if (m) satirlar.push({ u: Number(m[1]), ad: UNITE8[Number(m[1]) - 1], en: x.en, ifade: x.ifade ? '✓' : '', kartta: x.kartta });
}
satirlar.sort((a, b) => a.u - b.u || a.en.localeCompare(b.en)).forEach((r) => l8.addRow(r));
baslikStil(l8);

await wb.xlsx.writeFile(cikti);
console.log('yazildi', cikti, liste.length, 'satir;', satirlar.length, 'LGS satiri');
