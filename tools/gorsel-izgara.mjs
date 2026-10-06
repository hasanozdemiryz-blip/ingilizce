/**
 * Inceleme izgarasi: gorseller/<kart>.png dosyalarini 4 sutunlu tek bir JPG'de
 * toplar. Bir partiyi tek bakista gozden gecirmek icin (kesik ayak, yuzsuz
 * insan, kenara dayanan ozne, referansi kopyalama).
 *
 *   node tools/gorsel-izgara.mjs cikti.jpg kart1 kart2 ...
 */
import sharp from 'sharp';
import { resolve } from 'node:path';

const KOK = resolve(import.meta.dirname, '..');
const [, , cikti, ...kartlar] = process.argv;
const W = 320, H = 240, C = 4, ARA = 6;
const R = Math.ceil(kartlar.length / C);
const parcalar = await Promise.all(
  kartlar.map((k) =>
    sharp(resolve(KOK, 'gorseller', `${k}.png`)).resize(W, H, { fit: 'contain', background: '#fff' }).toBuffer(),
  ),
);
await sharp({ create: { width: C * W + (C - 1) * ARA, height: R * H + (R - 1) * ARA, channels: 3, background: '#777' } })
  .composite(parcalar.map((p, i) => ({ input: p, left: (i % C) * (W + ARA), top: Math.floor(i / C) * (H + ARA) })))
  .jpeg({ quality: 80 })
  .toFile(cikti);
