/**
 * Yeni kelime adaylari → yeni-kelimeler.xlsx
 *
 * Adaylar `tools/yeni-kelimeler.json`da (en|anlam|kanca|cumle|ses|not). Kural
 * kanca cumlesi turuyla ayni (bkz. NOTLAR, 7 Ekim): gercek Turkce kelime
 * kanca, kanca ile anlam birbirine bir sey yapiyor, cumle kisa. Bir kartin
 * kancasi baska bir kartin anlami OLMUYOR (honey ≈ "hani" olmaz: ball'un
 * kancasi zaten "bal") — betik bunu setle birlikte denetliyor.
 *
 * Kullanici "SENIN KARARIN"i doldurunca onaylananlar kart-havuzu-300.xlsx'e
 * 301'den itibaren eklenir. Elle yazilan kararlar yeniden uretimde tasinir.
 *
 * Kullanim: node tools/yeni-kelimeler.mjs
 */
import ExcelJS from 'exceljs';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KOK = resolve(import.meta.dirname, '..');
const CIKTI = resolve(KOK, 'yeni-kelimeler.xlsx');
const kartlar = JSON.parse(readFileSync(resolve(KOK, 'content/cards.json'), 'utf8'));
const { liste } = JSON.parse(readFileSync(resolve(KOK, 'tools/yeni-kelimeler.json'), 'utf8'));

const adaylar = liste.map((satir) => {
  const [en, tr, hook, cumle, ses, not = ''] = satir.split('|');
  return { en, tr, hook, cumle, ses: Number(ses), not };
});

// --- Denetim: setle ve kendi icinde cakisma ---
const kucuk = (s) => s.toLocaleLowerCase('tr');
const anlamlar = new Set([...kartlar, ...adaylar].flatMap((k) => k.tr.split(',').map((s) => kucuk(s.trim()))));
const setKelime = new Set(kartlar.map((k) => k.en));
const setKanca = new Set(kartlar.map((k) => kucuk(k.hook)));
const gorulen = new Map();
const sorunlar = [];
for (const a of adaylar) {
  const h = kucuk(a.hook);
  if (setKelime.has(a.en)) sorunlar.push(`${a.en}: zaten sette`);
  if (setKanca.has(h)) sorunlar.push(`${a.en}: "${a.hook}" setteki bir kartin kancasi`);
  if (anlamlar.has(h) && h !== kucuk(a.tr)) sorunlar.push(`${a.en}: "${a.hook}" baska bir kartin anlami`);
  if (gorulen.has(h)) sorunlar.push(`${a.en}: "${a.hook}" ${gorulen.get(h)} ile ayni kanca`);
  gorulen.set(h, a.en);
}
if (sorunlar.length) {
  console.error(sorunlar.join('\n'));
  process.exit(1);
}

const eskiKararlar = new Map();
if (existsSync(CIKTI)) {
  const eski = new ExcelJS.Workbook();
  await eski.xlsx.readFile(CIKTI);
  eski.getWorksheet('Adaylar')?.eachRow((r, n) => {
    const senin = String(r.getCell(8).text ?? '').trim();
    const kendi = String(r.getCell(9).text ?? '').trim();
    if (n > 1 && (senin || kendi)) eskiKararlar.set(r.getCell(2).text, { senin, kendi });
  });
}

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Adaylar', { views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] });
ws.columns = [
  { header: 'Sıra', key: 'sira', width: 6 },
  { header: 'Kelime', key: 'en', width: 11 },
  { header: 'Anlam', key: 'tr', width: 16 },
  { header: 'Kanca', key: 'hook', width: 13 },
  { header: 'Cümle', key: 'cumle', width: 40 },
  { header: 'Ses benzerliği', key: 'ses', width: 13 },
  { header: 'Not', key: 'not', width: 40 },
  { header: 'SENİN KARARIN', key: 'senin', width: 16 },
  { header: 'Kendi kancan / cümlen (istersen)', key: 'kendi', width: 40 },
];
const SES = { 3: 'Güçlü', 2: 'Orta' };
const RENK = { 3: 'FFE8F7EF', 2: 'FFFFF4D6' };
adaylar.forEach((a, i) => {
  const r = ws.addRow({
    sira: kartlar.length + i + 1, en: a.en, tr: a.tr, hook: a.hook, cumle: a.cumle,
    ses: SES[a.ses], not: a.not,
    senin: eskiKararlar.get(a.en)?.senin ?? '', kendi: eskiKararlar.get(a.en)?.kendi ?? '',
  });
  r.alignment = { vertical: 'middle', wrapText: true };
  r.getCell('cumle').font = { bold: true };
  r.getCell('ses').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RENK[a.ses] } };
  r.getCell('senin').dataValidation = { type: 'list', allowBlank: true, formulae: ['"Onay,Kendi cümlem,Çıkar"'] };
});
ws.getRow(1).font = { bold: true };
ws.autoFilter = { from: 'A1', to: 'I1' };

await wb.xlsx.writeFile(CIKTI);
const guclu = adaylar.filter((a) => a.ses === 3).length;
console.log(
  `yeni-kelimeler.xlsx — ${adaylar.length} aday (${guclu} güçlü, ${adaylar.length - guclu} orta), ` +
    `${eskiKararlar.size} eski karar taşındı`,
);
