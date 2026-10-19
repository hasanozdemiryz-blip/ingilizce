/**
 * 18 Ekim 2026 — Cocuk ve LGS icin guvenlik kurali (NOTLAR, "Guvenlik kurali").
 * Silah, gece kulubu, din adami, tokatlasma, banka soygunu ve "it" hakareti
 * iceren yedi kartin kancasi/cumlesi degisti. Kullanici yol haritasini onayladi.
 *
 * Kaynak `kart-havuzu-300.xlsx`; bu betik tabloyu yerinde gunceller, sonra
 * `npm run import:cards`. Ikinci kez calismasi zararsiz (ayni degerleri yazar).
 * Gorseller ESKI sahneyi gosteriyor — Faz 4'te yeniden uretilecek
 * (gun, night, shake, slap, rob, eat, referee).
 */
import ExcelJS from 'exceljs';
import { resolve } from 'node:path';

const DOSYA = resolve(import.meta.dirname, '..', 'kart-havuzu-300.xlsx');
const COL = { en: 2, tr: 3, hook: 5, sentence: 6, imageNote: 8 };

const YENI = {
  gun: { tr: 'tabanca', hook: 'gün', sentence: 'Bütün gün su tabancasıyla oynadık',
    imageNote: 'Bahçede iki çocuk renkli plastik su tabancalarıyla birbirine su sıkıyor' },
  night: { hook: 'naylon', sentence: 'Gece naylon çadırda uyuduk',
    imageNote: 'Yıldızlı gece, şeffaf naylon çadırın içinde uyuyan kamp yapan kişi' },
  shake: { hook: 'şah', sentence: 'Şah ağacı salladı, elmalar düştü',
    imageNote: 'Taçlı bir şah elma ağacını iki eliyle sallıyor, elmalar düşüyor' },
  slap: { hook: 'şaplak', sentence: 'Dalga kayaya şaplak diye tokat attı',
    imageNote: 'Büyük bir dalga kayaya çarpıp şaplak diye su sıçratıyor' },
  rob: { hook: 'robot', sentence: 'Robot kurabiye kavanozunu soydu',
    imageNote: 'Sevimli bir robot kurabiye kavanozundan kurabiyeleri gizlice alıyor' },
  eat: { hook: 'it', sentence: 'Tabağı bana it, yemeğimi yiyeyim',
    imageNote: 'Masada biri tabağı karşıdakine itiyor, karşıdaki yemeye hazır' },
  referee: { hook: 'refakat', sentence: 'Hakeme kaptan refakat etti',
    imageNote: 'Takım kaptanı sahaya çıkan hakeme eşlik ediyor' },
};

const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile(DOSYA);
const ws = wb.getWorksheet('Kart Havuzu');
const bulunan = new Set();
ws.eachRow((row, n) => {
  if (n === 1) return;
  const en = String(row.getCell(COL.en).text ?? '').trim().toLowerCase();
  const y = YENI[en];
  if (!y) return;
  for (const [alan, deger] of Object.entries(y)) row.getCell(COL[alan]).value = deger;
  bulunan.add(en);
});
const eksik = Object.keys(YENI).filter((k) => !bulunan.has(k));
if (eksik.length) throw new Error(`tabloda bulunamadi: ${eksik.join(', ')}`);
await wb.xlsx.writeFile(DOSYA);
console.log(`guncellendi: ${[...bulunan].join(', ')}`);
