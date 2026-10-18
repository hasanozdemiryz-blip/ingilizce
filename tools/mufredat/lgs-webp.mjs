// gorseller/lgs/<id>.png → src/assets/cards-lgs/<id>.webp (800x600, q82; import-images ile ayni olcu).
// LGS kartlari cards.json'a girene kadar (Asama 4) gorseller burada, depoda durur.
//   node tools/mufredat/lgs-webp.mjs
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '../..');
const KAYNAK = path.join(KOK, 'gorseller/lgs');
const HEDEF = path.join(KOK, 'src/assets/cards-lgs');
fs.mkdirSync(HEDEF, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(KAYNAK).filter((f) => f.endsWith('.png'))) {
  await sharp(path.join(KAYNAK, f)).resize(800, 600, { fit: 'cover' }).webp({ quality: 82 }).toFile(path.join(HEDEF, f.replace(/\.png$/, '.webp')));
  n++;
}
console.log(`${n} webp → src/assets/cards-lgs (${fs.readdirSync(HEDEF).length} toplam)`);
