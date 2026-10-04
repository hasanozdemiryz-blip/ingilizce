// Ana sayfayi (hafizada.com kok sayfasi) tek dosya halinde derler.
//
// Neden tek dosya: portal deposunda derleme adimi yok, GitHub Pages ham HTML
// servis ediyor. Gorseller data URI olarak gomuluyor; boylece ek istek yok,
// sayfa tek seferde geliyor.
//
//   node tools/anasayfa.mjs ../hasanozdemiryz-blip.github.io/index.html

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '..');
const SABLON = path.join(KOK, 'anasayfa', 'sablon.html');

// Slider'da gosterilecek kartlar. Kanca'si en net anlasilan altisi.
const VITRIN = ['snake', 'bad', 'fox', 'leaf', 'boat', 'cup'];

// Bolum cizimleri: brand/anasayfa/<ad>.png, kart receteriyle uretildi.
const CIZIMLER = { telaffuz: 'IK_TELAFFUZ', merdiven: 'IK_MERDIVEN', fidan: 'IK_FIDAN' };

const veri = (p) => fs.readFileSync(path.join(KOK, p));
const b64 = (tur, buf) => `data:${tur};base64,${buf.toString('base64')}`;

async function derle(cikti) {
  let s = fs.readFileSync(SABLON, 'utf8');
  const kartlar = JSON.parse(veri('content/cards.json'));
  const hepsi = kartlar.cards || kartlar;

  const slaytlar = VITRIN.map((id) => {
    const k = hepsi.find((x) => x.id === id);
    if (!k) throw new Error(`vitrin karti bulunamadi: ${id}`);
    const img = b64('image/webp', veri(`src/assets/cards/${id}.webp`));
    return `
          <article class="slayt">
            <div class="resim"><img src="${img}" alt="${k.sentence}" loading="lazy"></div>
            <div class="bilgi">
              <div class="ust-satir">
                <span class="en">${k.en}</span>
                <span class="tr">${k.tr}</span>
                <span class="kanca-rozet">≈ ${k.hook}</span>
              </div>
              <p class="cumle">"${k.sentence}"</p>
            </div>
          </article>`;
  }).join('');

  const yerine = {
    SLAYTLAR: slaytlar,
    LOGO_ACIK: b64('image/svg+xml', veri('brand/logo-isaret.svg')),
    LOGO_KOYU: b64('image/svg+xml', veri('brand/logo-isaret-koyu.svg')),
  };

  for (const [ad, anahtar] of Object.entries(CIZIMLER)) {
    const buf = await sharp(path.join(KOK, 'brand/anasayfa', `${ad}.png`))
      .resize(360, 360, { fit: 'cover' })
      .webp({ quality: 82 })
      .toBuffer();
    yerine[anahtar] = b64('image/webp', buf);
  }

  for (const [k, d] of Object.entries(yerine)) s = s.split(`__${k}__`).join(d);

  const kalan = s.match(/__[A-Z_]+__/g);
  if (kalan) throw new Error(`doldurulmamis yer tutucu: ${[...new Set(kalan)].join(', ')}`);

  fs.mkdirSync(path.dirname(cikti), { recursive: true });
  fs.writeFileSync(cikti, s);
  console.log(`${cikti} — ${Math.round(s.length / 1024)} KB, ${VITRIN.length} slayt`);
}

const hedef = process.argv[2];
if (!hedef) {
  console.error('kullanim: node tools/anasayfa.mjs <cikti-yolu>');
  process.exit(1);
}
await derle(path.resolve(hedef));
