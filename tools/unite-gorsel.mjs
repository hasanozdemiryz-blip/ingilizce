// LGS unite gorselleri (31 Ekim, PLAN v3): gorseller/unite/u<N>.png (izgara-bol.mjs ciktisi)
// → src/assets/lgs-unite/u<N>.webp. Kare (ortadan), 192 px: liste, ana ekran ve harita kucuk
// gosteriyor; 4:3 kartin tamami gerekmiyor. Kaynak creation id'leri: tools/mufredat/gorsel-log.txt.
//   node tools/unite-gorsel.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '..');
const KAYNAK = path.join(KOK, 'gorseller/unite');
const HEDEF = path.join(KOK, 'src/assets/lgs-unite');
fs.mkdirSync(HEDEF, { recursive: true });

let n = 0;
for (let no = 1; no <= 10; no++) {
  const dosya = path.join(KAYNAK, `u${no}.png`);
  if (!fs.existsSync(dosya)) {
    console.warn(`yok: u${no}.png`);
    continue;
  }
  const { width, height } = await sharp(dosya).metadata();
  const kenar = Math.min(width, height);
  await sharp(dosya)
    .extract({ left: Math.round((width - kenar) / 2), top: Math.round((height - kenar) / 2), width: kenar, height: kenar })
    .resize(192, 192)
    .webp({ quality: 82 })
    .toFile(path.join(HEDEF, `u${no}.webp`));
  n++;
}
console.log(`${n} unite gorseli → src/assets/lgs-unite`);
