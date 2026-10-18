/**
 * 2x2 izgara gorselini dort kart gorseline boler (19 Ekim 2026).
 *
 * Neden: Nano Banana Pro 2K'da da 75 kredi; bir 2K gorsele dort kart
 * cizdirip bolunce kart basina ~19 kredi (bkz. gorsel-recetesi.md, "Izgara").
 * Kareler arasindaki beyaz bosluk otomatik bulunuyor; Magnific'in
 * images_split_grid araci da var ama yerel bolme daha kontrollu.
 *
 *   node tools/izgara-bol.mjs <izgara.png> <sol-ust> <sag-ust> <sol-alt> <sag-alt> [klasor]
 *
 * Kart id'si yerine "-" o kareyi atlar (kusurlu, yeniden cizilecek).
 * Cikti: <klasor>/<id>.png (varsayilan gorseller/), sonra `npm run import:images`.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [, , dosya, ...rest] = process.argv;
const ids = rest.slice(0, 4);
const klasor = path.resolve(import.meta.dirname, '..', rest[4] ?? 'gorseller');
if (!dosya || ids.length !== 4) {
  console.error('kullanim: node tools/izgara-bol.mjs <izgara.png> <id1> <id2> <id3> <id4> [klasor]');
  process.exit(1);
}

const { data, info } = await sharp(dosya).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: G, height: Y } = info;
const beyaz = (x, y) => {
  const i = (y * G + x) * 3;
  return data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;
};

/** Ortadaki %20'lik bantta tamamen beyaz olan en genis sutun/satir dizisi. */
function bosluk(uzunluk, digerUzunluk, beyazMi) {
  let enIyi = null;
  let bas = -1;
  for (let i = Math.floor(uzunluk * 0.4); i <= Math.ceil(uzunluk * 0.6); i++) {
    let say = 0;
    for (let j = 0; j < digerUzunluk; j += 4) if (beyazMi(i, j)) say++;
    const tam = say / Math.ceil(digerUzunluk / 4) > 0.97;
    if (tam && bas < 0) bas = i;
    if ((!tam || i === Math.ceil(uzunluk * 0.6)) && bas >= 0) {
      const son = tam ? i : i - 1;
      if (!enIyi || son - bas > enIyi[1] - enIyi[0]) enIyi = [bas, son];
      bas = -1;
    }
  }
  if (!enIyi) throw new Error('beyaz bosluk bulunamadi — izgara degil mi?');
  return enIyi;
}

const [x0, x1] = bosluk(G, Y, (x, y) => beyaz(x, y));
const [y0, y1] = bosluk(Y, G, (y, x) => beyaz(x, y));
const PAY = 3; // bosluk kenarindaki yumusak gecis
const kareler = [
  { left: 0, top: 0, width: x0 - PAY, height: y0 - PAY },
  { left: x1 + 1 + PAY, top: 0, width: G - x1 - 1 - PAY, height: y0 - PAY },
  { left: 0, top: y1 + 1 + PAY, width: x0 - PAY, height: Y - y1 - 1 - PAY },
  { left: x1 + 1 + PAY, top: y1 + 1 + PAY, width: G - x1 - 1 - PAY, height: Y - y1 - 1 - PAY },
];
fs.mkdirSync(klasor, { recursive: true });
for (const [i, id] of ids.entries()) {
  if (id === '-') continue;
  await sharp(dosya).extract(kareler[i]).png().toFile(path.join(klasor, `${id}.png`));
  console.log(`${id}.png  ${kareler[i].width}x${kareler[i].height}`);
}
