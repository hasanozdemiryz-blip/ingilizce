/**
 * Kart incelemesi → kart-inceleme.xlsx (+ gorsel uretim sirasi)
 *
 * Kaynak `kart-havuzu-300.xlsx`a DOKUNMUYOR: inceleme ayri bir dosya. Kullanici
 * "Senin kararin" sutununu doldurunca onaylananlar kaynak tabloya islenir.
 *
 * Kanca turleri (bkz. NOTLAR, 6 Ekim):
 *   G — gercek ses kancasi: anlami ilgisiz bir Turkce kelime + sahne (sell ≈ sel)
 *   O — odunc / tanidik kelime: Turkcede ayni anlamla geciyor (corner ≈ korner)
 *   Y — yalnizca okunusun Turkce yazimi, gercek kelime degil (brain ≈ breyn)
 *
 * Kullanim: node tools/kart-inceleme.mjs
 */
import ExcelJS from 'exceljs';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const KOK = resolve(import.meta.dirname, '..');
const kartlar = JSON.parse(readFileSync(resolve(KOK, 'content/cards.json'), 'utf8'));
const inceleme = JSON.parse(readFileSync(resolve(KOK, 'tools/kart-inceleme.json'), 'utf8'));

const TUR = { G: 'Gerçek ses kancası', O: 'Tanıdık / ödünç kelime', Y: 'Yalnızca okunuş (kanca değil)' };
const KARAR = { K: 'Kalsın', L: 'Kalsın (kolay katman)', D: 'Düzelt', C: 'Çıkar' };
const KATEGORI = {
  ev: 'Ev & eşya', mutfak: 'Mutfak & yemek', vucut: 'Vücut & sağlık', doga: 'Doğa & hava',
  hayvan: 'Hayvanlar', ulasim: 'Ulaşım & yol', okul: 'Okul & ofis', para: 'Para & iş',
  spor: 'Spor', giyim: 'Giyim & aksesuar', yapi: 'Yapı & alet', insan: 'İnsanlar',
  zaman: 'Zaman', eylem: 'Eylemler', nitelik: 'Nitelikler', duygu: 'Duygular',
  yer: 'Yerler', renk: 'Renkler',
};
/** Sozcuk turu: anlam -mak/-mek ile bitiyorsa fiil; nitelik/duygu kategorisi sifat. */
const sozcukTuru = (k, kat) =>
  /m[ae]k$/.test(k.tr.split(',')[0].trim()) ? 'Fiil' : ['nitelik', 'duygu', 'renk'].includes(kat) ? 'Sıfat' : 'İsim';

const satirlar = kartlar
  .slice()
  .sort((a, b) => a.order - b.order)
  .map((k) => {
    const [tur, kalite, kat, karar, not] = inceleme[k.id].split('|');
    return {
      k,
      gorsel: existsSync(resolve(KOK, 'src/assets/cards', `${k.id}.webp`)),
      tur, kalite: Number(kalite), kat, karar, not,
    };
  });

/*
  GORSEL URETIM SIRASI: gorseli olmayan, duzeltme GEREKTIRMEYEN kartlar.
  Duzeltilecek kartin gorseli kanca netlesince uretilir — yoksa gorsel eski
  kancayi resmeder ve bosa gider. Once gercek kancalar (K), sonra tanidik
  kelimeler (L); kalite 1 olanlar disarida. Esitlikte siklik sirasi.
*/
const oncelik = (s) => (s.karar === 'K' ? 0 : 1) * 10 + (3 - s.kalite);
const uretimSirasi = satirlar
  .filter((s) => !s.gorsel && (s.karar === 'K' || s.karar === 'L') && s.kalite >= 2)
  .sort((a, b) => oncelik(a) - oncelik(b) || a.k.order - b.k.order);

const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('İnceleme', { views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] });
ws.columns = [
  { header: 'Sıra', key: 'sira', width: 6 },
  { header: 'Kelime', key: 'en', width: 12 },
  { header: 'Anlam', key: 'tr', width: 18 },
  { header: 'Kanca', key: 'hook', width: 14 },
  { header: 'Cümle', key: 'cumle', width: 34 },
  { header: 'Görsel', key: 'gorsel', width: 8 },
  { header: 'Kanca türü', key: 'tur', width: 26 },
  { header: 'Kalite', key: 'kalite', width: 7 },
  { header: 'Kategori', key: 'kat', width: 16 },
  { header: 'Sözcük', key: 'soz', width: 8 },
  { header: 'Önerilen karar', key: 'karar', width: 20 },
  { header: 'Not / yeni kanca önerisi', key: 'not', width: 60 },
  { header: 'Üretim sırası', key: 'uretim', width: 10 },
  { header: 'SENİN KARARIN', key: 'senin', width: 16 },
];
const RENK = { K: 'FFE8F7EF', L: 'FFEFF4FD', D: 'FFFFF4D6', C: 'FFFDE6EE' };
for (const s of satirlar) {
  const sira = uretimSirasi.indexOf(s);
  const r = ws.addRow({
    sira: s.k.order, en: s.k.en, tr: s.k.tr, hook: s.k.hook, cumle: s.k.sentence,
    gorsel: s.gorsel ? 'var' : '', tur: TUR[s.tur], kalite: s.kalite, kat: KATEGORI[s.kat],
    soz: sozcukTuru(s.k, s.kat), karar: KARAR[s.karar], not: s.not,
    uretim: sira >= 0 && sira < 100 ? sira + 1 : '', senin: '',
  });
  r.getCell('karar').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RENK[s.karar] } };
  r.getCell('not').alignment = { wrapText: true, vertical: 'top' };
}
ws.getRow(1).font = { bold: true };
ws.autoFilter = { from: 'A1', to: 'N1' };

const ozet = wb.addWorksheet('Özet');
const say = (f) => satirlar.filter(f).length;
ozet.addRows([
  ['Toplam kart', satirlar.length],
  ['Görseli var', say((s) => s.gorsel)],
  [],
  ['Gerçek ses kancası (G)', say((s) => s.tur === 'G')],
  ['Tanıdık / ödünç kelime (O)', say((s) => s.tur === 'O')],
  ['Yalnızca okunuş (Y)', say((s) => s.tur === 'Y')],
  [],
  ['Kalsın', say((s) => s.karar === 'K')],
  ['Kalsın (kolay katman)', say((s) => s.karar === 'L')],
  ['Düzelt', say((s) => s.karar === 'D')],
  ['Çıkar', say((s) => s.karar === 'C')],
  [],
  ['Görsel üretimine hazır (görselsiz, düzeltme gerekmiyor, kalite ≥2)', uretimSirasi.length],
  [],
  ...Object.entries(KATEGORI).map(([k, ad]) => [ad, say((s) => s.kat === k)]),
]);
ozet.getColumn(1).width = 62;

await wb.xlsx.writeFile(resolve(KOK, 'kart-inceleme.xlsx'));
writeFileSync(
  resolve(KOK, 'tools/gorsel-sirasi.json'),
  JSON.stringify(uretimSirasi.slice(0, 100).map((s) => s.k.id), null, 1),
);
console.log(`kart-inceleme.xlsx — üretime hazır ${uretimSirasi.length}, ilk 100 tools/gorsel-sirasi.json`);
