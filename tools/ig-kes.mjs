// Instagram cizimlerinin zeminini siler ve kirpar.
//
//   node tools/ig-kes.mjs                -> instagram/gorseller/*.png hepsi
//   node tools/ig-kes.mjs kutu ev        -> yalnizca bunlar
//
// Girdi: instagram/gorseller/<ad>.png (Magnific ham ciktisi, depoda degil).
// Cikti: brand/instagram/<ad>.webp (seffaf zemin, kirpilmis, en uzun kenar 640).
// Depodaki tek kaynak webp'ler; baska makinede yeniden uretmek gerekmez.
//
// Cizimler gorsel-recetesi.md'deki tek renk soluk zeminle uretiliyor. Zemin
// kenarlardan baslayan taşma dolgusuyla siliniyor: koyu kontur dolguyu
// durdurdugu icin cizimin icindeki acik renkler (yastigin beyazi) korunuyor.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '..');
const GIRDI = path.join(KOK, 'instagram/gorseller');
const CIKTI = path.join(KOK, 'brand/instagram');
const ESIK = 30; // zemin rengine uzaklik (RGB)

async function kes(ad) {
  const { data, info } = await sharp(path.join(GIRDI, `${ad}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: g, height: y } = info;
  const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
  // Zemin: dort kosenin ortalamasi
  const koseler = [0, g - 1, (y - 1) * g, y * g - 1].map(px);
  const zemin = [0, 1, 2].map((k) => koseler.reduce((n, c) => n + c[k], 0) / 4);
  const uzak = (i) => {
    const [r, gg, b] = px(i);
    return Math.hypot(r - zemin[0], gg - zemin[1], b - zemin[2]);
  };

  const silindi = new Uint8Array(g * y);
  const yigin = [];
  for (let x = 0; x < g; x++) yigin.push(x, (y - 1) * g + x);
  for (let s = 0; s < y; s++) yigin.push(s * g, s * g + g - 1);
  while (yigin.length) {
    const i = yigin.pop();
    if (silindi[i] || uzak(i) > ESIK) continue;
    silindi[i] = 1;
    const x = i % g;
    if (x > 0) yigin.push(i - 1);
    if (x < g - 1) yigin.push(i + 1);
    if (i >= g) yigin.push(i - g);
    if (i < g * (y - 1)) yigin.push(i + g);
  }
  for (let i = 0; i < g * y; i++) {
    if (silindi[i]) data[i * 4 + 3] = 0;
  }
  // Silinen alana komsu acik pikseller (kenar yumusatmasi) yarim seffaf
  for (let i = 0; i < g * y; i++) {
    if (silindi[i]) continue;
    const x = i % g;
    const komsu = (x > 0 && silindi[i - 1]) || (x < g - 1 && silindi[i + 1]) || (i >= g && silindi[i - g]) || (i < g * (y - 1) && silindi[i + g]);
    if (komsu && uzak(i) < ESIK * 2.2) data[i * 4 + 3] = 128;
  }

  await sharp(data, { raw: { width: g, height: y, channels: 4 } })
    .trim({ threshold: 1 })
    .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 90 })
    .toFile(path.join(CIKTI, `${ad}.webp`));
}

fs.mkdirSync(CIKTI, { recursive: true });
const adlar = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(GIRDI).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4));
for (const ad of adlar) {
  await kes(ad);
  console.log('✓', ad);
}
