// Gorselleri tek bakista kontrol icin izgaraya dizer: node tools/ig-izgara.cjs cikti.png a.png b.png ...
const sharp = require('sharp');
const [cikti, ...dosyalar] = process.argv.slice(2);
(async () => {
  const W = 400, H = 300, S = 4;
  const tiles = await Promise.all(dosyalar.map(async (f, i) => ({ input: await sharp(f).resize(W, H, { fit: 'contain', background: '#fff' }).toBuffer(), left: (i % S) * W, top: Math.floor(i / S) * H })));
  await sharp({ create: { width: W * S, height: H * Math.ceil(dosyalar.length / S), channels: 3, background: '#fff' } }).composite(tiles).png().toFile(cikti);
})();
