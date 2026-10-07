/**
 * Kanca cumlesi puanlamasi → kanca-cumleleri.xlsx
 *
 * Kural (7 Ekim, NOTLAR "YARIN ILK IS"): kanca ile anlam AYNI SAHNEDE ve
 * birbirine bir sey YAPIYOR, mumkunse sacma. "gibi" benzetmesi ve "=" kalibi
 * yok. Puanlar ve oneriler `tools/kanca-cumleleri.json`da; bu betik yalnizca
 * tabloyu ciziyor (her satirda kartin mevcut gorseli kucuk resim olarak).
 *
 * Kaynak `kart-havuzu-300.xlsx`a DOKUNMUYOR. Kullanici "SENIN KARARIN"
 * sutununu doldurunca onaylananlar kaynak tabloya islenir.
 *
 * Kullanim: node tools/kanca-cumleleri.mjs
 * Mevcut tablodaki elle yazilmis kararlar yeni tabloya tasinir.
 */
import ExcelJS from 'exceljs';
import sharp from 'sharp';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KOK = resolve(import.meta.dirname, '..');
const CIKTI = resolve(KOK, 'kanca-cumleleri.xlsx');
const kartlar = JSON.parse(readFileSync(resolve(KOK, 'content/cards.json'), 'utf8'));
const inceleme = JSON.parse(readFileSync(resolve(KOK, 'tools/kart-inceleme.json'), 'utf8'));
const puanlar = JSON.parse(readFileSync(resolve(KOK, 'tools/kanca-cumleleri.json'), 'utf8'));

const SORUN = {
  E: "'=' kalıbı, sahne yok",
  B: "'gibi' benzetmesi",
  D: 'Durağan: yan yana duruyorlar',
  T: 'Tanım / bilgi cümlesi',
  K: 'Kanca gerçek kelime değil',
  A: 'Kanca = anlam (aynı kelime)',
};
const GORSEL = { Y: 'Yeniden üretilmeli', M: 'Mevcut uyuyor (bak)', yok: 'Görseli yok, çizilecek' };
const ONCELIK = {
  0: '0 · görselsiz kartlar (6 Ekim\'de ayrılan 34)',
  1: '1 · ilk dersler / gerçek kanca',
  2: "2 · 'gibi' ve diğer gerçek kancalar",
  3: '3 · tanıdık kelimeler',
  4: '4 · isteğe bağlı (aynı kelime)',
  5: '— kalsın',
};

/*
  Kullanicinin elle yazdigi kararlar (SENIN KARARIN + Kendi cumlen) kelimeye
  gore yeni tabloya TASINIYOR — tablo yeniden uretilince kaybolmasin.
*/
const eskiKararlar = new Map();
if (existsSync(CIKTI)) {
  const eski = new ExcelJS.Workbook();
  await eski.xlsx.readFile(CIKTI);
  eski.getWorksheet('Puanlama')?.eachRow((r, n) => {
    const senin = String(r.getCell(14).text ?? '').trim();
    const kendi = String(r.getCell(15).text ?? '').trim();
    if (n > 1 && (senin || kendi)) eskiKararlar.set(r.getCell(4).text, { senin, kendi });
  });
}

/* Gorselsiz 34 kart (6 Ekim'de "kanca karari sonra" diye ayrilanlar) da tabloda, en ustte. */
const resimYolu = (k) => resolve(KOK, 'src/assets/cards', `${k.id}.webp`);
const satirlar = kartlar
  .map((k) => {
    const ham = puanlar[k.id];
    if (!ham) throw new Error(`${k.id}: kanca-cumleleri.json'da puan yok`);
    const [puan, sorun = '', oneri = '', gorsel = '', yeniKanca = '', not = ''] = ham.split('|');
    const tur = inceleme[k.id].split('|')[0];
    const resimVar = existsSync(resimYolu(k));
    let oncelik = 5;
    if (!resimVar) oncelik = 0;
    else if (Number(puan) < 3) {
      if (sorun === 'A') oncelik = 4;
      else if (k.order <= 50 || sorun === 'K' || (tur === 'G' && sorun === 'E')) oncelik = 1;
      else if (sorun === 'B' || tur === 'G') oncelik = 2;
      else oncelik = 3;
    }
    return { k, puan: Number(puan), sorun, oneri, gorsel: resimVar ? gorsel : 'yok', yeniKanca, not, tur, oncelik, resimVar };
  })
  .sort((a, b) => a.oncelik - b.oncelik || a.k.order - b.k.order);

for (const s of satirlar) {
  if (s.oneri.length > 48) console.warn(`uzun cumle (${s.oneri.length}): ${s.k.id} — ${s.oneri}`);
  if (/ gibi|=/.test(s.oneri)) console.warn(`kurala aykiri oneri: ${s.k.id} — ${s.oneri}`);
}

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('Puanlama', { views: [{ state: 'frozen', ySplit: 1, xSplit: 4 }] });
ws.columns = [
  { header: 'Görsel', key: 'resim', width: 22 },
  { header: 'Öncelik', key: 'oncelik', width: 20 },
  { header: 'Sıra', key: 'sira', width: 6 },
  { header: 'Kelime', key: 'en', width: 11 },
  { header: 'Anlam', key: 'tr', width: 16 },
  { header: 'Kanca', key: 'hook', width: 12 },
  { header: 'Şu anki cümle', key: 'cumle', width: 32 },
  { header: 'Puan', key: 'puan', width: 6 },
  { header: 'Sorun', key: 'sorun', width: 22 },
  { header: 'Yeni kanca', key: 'yeniKanca', width: 11 },
  { header: 'Önerilen cümle', key: 'oneri', width: 38 },
  { header: 'Görsel durumu', key: 'gorsel', width: 18 },
  { header: 'Not', key: 'not', width: 36 },
  { header: 'SENİN KARARIN', key: 'senin', width: 16 },
  { header: 'Kendi cümlen (istersen)', key: 'kendi', width: 36 },
];
const PUAN_RENK = { 3: 'FFE8F7EF', 2: 'FFFFF4D6', 1: 'FFFDE6EE' };
const SATIR_PX = 105;

for (const s of satirlar) {
  const r = ws.addRow({
    oncelik: ONCELIK[s.oncelik], sira: s.k.order, en: s.k.en, tr: s.k.tr, hook: s.k.hook,
    cumle: s.k.sentence, puan: s.puan, sorun: SORUN[s.sorun] ?? '', yeniKanca: s.yeniKanca,
    oneri: s.oneri, gorsel: GORSEL[s.gorsel] ?? '', not: s.not,
    senin: eskiKararlar.get(s.k.en)?.senin ?? '', kendi: eskiKararlar.get(s.k.en)?.kendi ?? '',
  });
  r.height = SATIR_PX * 0.75;
  r.alignment = { vertical: 'middle', wrapText: true };
  r.getCell('puan').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PUAN_RENK[s.puan] } };
  r.getCell('oneri').font = { bold: true };
  r.getCell('senin').dataValidation = {
    type: 'list',
    allowBlank: true,
    formulae: ['"Önerilen,Kendi cümlem,Kalsın"'],
  };
  if (!s.resimVar) continue;
  const png = await sharp(resimYolu(s.k))
    .resize({ height: SATIR_PX - 6 })
    .png()
    .toBuffer();
  const resim = wb.addImage({ buffer: png, extension: 'png' });
  ws.addImage(resim, { tl: { col: 0.05, row: r.number - 1 + 0.03 }, ext: { width: 132, height: SATIR_PX - 6 } });
}
ws.getRow(1).font = { bold: true };
ws.getRow(1).height = 20;
ws.autoFilter = { from: 'B1', to: 'O1' };

const ozet = wb.addWorksheet('Özet');
const say = (f) => satirlar.filter(f).length;
const degisecek = satirlar.filter((s) => s.oneri);
ozet.addRows([
  ['Kart', satirlar.length],
  ['  görselsiz (öncelik 0)', say((s) => !s.resimVar)],
  [],
  ['Puan 3 — güçlü, kalsın', say((s) => s.puan === 3)],
  ['Puan 2 — orta (sahne var ama durağan / bilgi cümlesi)', say((s) => s.puan === 2)],
  ['Puan 1 — zayıf', say((s) => s.puan === 1)],
  [],
  ...Object.entries(SORUN).map(([k, ad]) => [ad, say((s) => s.sorun === k)]),
  [],
  ...Object.entries(ONCELIK).map(([k, ad]) => [`Öncelik ${ad}`, say((s) => s.oncelik === Number(k))]),
  [],
  ['Yeni cümle önerilen', degisecek.length],
  ['  mevcut görsel muhtemelen uyuyor (kredi yok)', say((s) => s.gorsel === 'M')],
  ['  görsel yeniden üretilmeli', say((s) => s.gorsel === 'Y')],
  ['  görseli yok, çizilecek', say((s) => s.gorsel === 'yok')],
  ['  bunların öncelik 1 olanı', say((s) => s.gorsel === 'Y' && s.oncelik === 1)],
  [],
  ['"Mevcut uyuyor" = sahne tarifine göre tahmin; satırdaki küçük resme bakıp karar ver.'],
]);
ozet.getColumn(1).width = 62;

await wb.xlsx.writeFile(CIKTI);
console.log(
  `kanca-cumleleri.xlsx — ${satirlar.length} kart, ${degisecek.length} öneri, ${eskiKararlar.size} eski karar taşındı ` +
    `(${say((s) => s.gorsel === 'Y')} yeniden, ${say((s) => s.gorsel === 'yok')} ilk kez çizilecek, ${say((s) => s.gorsel === 'M')} mevcut görselle)`,
);
