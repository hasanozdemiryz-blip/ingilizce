// Izgaralardan cikan kart gorsellerini etiketli tek bir kontrol sayfasina dizer.
//   node tools/mufredat/kontrol-sayfasi.mjs <cikti.jpg> <izgara-no> [<izgara-no> ...]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '../..');
const [, , cikti, ...nolar] = process.argv;
const plan = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/mufredat/izgara-plan.json'), 'utf8'));
const kareler = [];
for (const n of nolar) {
  const g = plan.find((x) => x.no === Number(n));
  g.ids.forEach((id, i) => {
    const d = path.join(KOK, g.genel[i] ? 'gorseller' : 'gorseller/lgs', `${id}.png`);
    kareler.push({ id, d: fs.existsSync(d) ? d : null });
  });
}
const G = 320, Y = 240, S = 4;
const sat = Math.ceil(kareler.length / S);
const parca = await Promise.all(
  kareler.map(async (k, i) => {
    const etiket = Buffer.from(`<svg width="${G}" height="26"><rect width="${G}" height="26" fill="#16233a"/><text x="8" y="18" font-family="Arial" font-size="15" fill="#ffc000">${k.id}</text></svg>`);
    const resim = k.d
      ? await sharp(k.d).resize(G, Y, { fit: 'cover' }).toBuffer()
      : await sharp({ create: { width: G, height: Y, channels: 3, background: '#ccc' } }).png().toBuffer();
    return [
      { input: resim, left: (i % S) * G, top: Math.floor(i / S) * (Y + 26) + 26 },
      { input: etiket, left: (i % S) * G, top: Math.floor(i / S) * (Y + 26) },
    ];
  }),
);
await sharp({ create: { width: G * S, height: sat * (Y + 26), channels: 3, background: '#333' } })
  .composite(parca.flat())
  .jpeg({ quality: 70 })
  .toFile(cikti);
console.log(cikti, kareler.length);
