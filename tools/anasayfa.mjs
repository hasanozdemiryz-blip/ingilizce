// Ana sayfayi (hafizada.com kok sayfasi) tek dosya halinde derler.
//
// Neden tek dosya: portal deposunda derleme adimi yok, GitHub Pages ham
// HTML servis ediyor. Gorseller data URI olarak gomuluyor; boylece ek
// istek yok, sayfa tek seferde geliyor.
//
//   node tools/anasayfa.mjs ../hasanozdemiryz-blip.github.io/index.html

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '..');
const SABLON = path.join(KOK, 'anasayfa', 'sablon.html');

/**
 * Kahraman slider: urun degil INSAN.
 *
 * Bir sure kartlar donuyordu; kancalar artik kendi bolumunde anlatiliyor
 * (bkz. `HAVUZ`) ve kahraman yerini kullanim anlarina birakti. Altyazi
 * her sahnede somut bir sey soyluyor — "insanlar telefona bakiyor"
 * tek basina kimseyi ikna etmiyor.
 */
const KISILER = [
  { dosya: 'otobus', an: 'Otobüste dört dakika', sure: 'Bir durak arası beş kelime' },
  { dosya: 'kahve', an: 'Kahve molasında', sure: 'Ezber yok — bağlıyorsun, kalıyor' },
  { dosya: 'ogrenci', an: 'Sırada beklerken', sure: 'Telefon açık, kanca hazır' },
  { dosya: 'kanepe', an: 'Akşam kanepede', sure: 'Günlük hedef dolunca gün kapanıyor' },
];

/**
 * Kanca bolumunun havuzu. Uc tanesi ekranda durur, gerisi sirayla girer
 * (bkz. sablondaki betik). Dokuzu da kancasi en net anlasilan kartlar.
 */
const HAVUZ = ['snake', 'bad', 'fox', 'leaf', 'boat', 'cup', 'sell', 'dark', 'salt'];

/** Ekranda ayni anda duran kart sayisi. */
const GORUNEN = 3;

/** Bolum cizimleri: brand/anasayfa/<ad>.png, kart receteriyle uretildi. */
const CIZIMLER = { telaffuz: 'IK_TELAFFUZ', merdiven: 'IK_MERDIVEN', cihaz: 'IK_CIHAZ' };

const veri = (p) => fs.readFileSync(path.join(KOK, p));
const b64 = (tur, buf) => `data:${tur};base64,${buf.toString('base64')}`;

/** Cizimin kendi kose tonu — bant zemini bundan besleniyor ki kirpma
 *  gerekmesin ve gorsel krem uzerinde leke gibi durmasin. */
async function zeminTonu(dosya) {
  const { data } = await sharp(dosya)
    .extract({ left: 4, top: 4, width: 8, height: 8 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const kanal = (i) =>
    Math.round([...Array(64).keys()].reduce((t, k) => t + data[k * 3 + i], 0) / 64);
  return `#${[kanal(0), kanal(1), kanal(2)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

const webp = (dosya, g, y, fit = 'cover') =>
  sharp(dosya).resize(g, y, { fit }).webp({ quality: 82 }).toBuffer();

async function derle(cikti) {
  let s = fs.readFileSync(SABLON, 'utf8');
  const kartlar = JSON.parse(veri('content/cards.json'));
  const hepsi = kartlar.cards || kartlar;

  const kartVer = async (id) => {
    const k = hepsi.find((x) => x.id === id);
    if (!k) throw new Error(`kart bulunamadi: ${id}`);
    return {
      en: k.en,
      tr: k.tr,
      hook: k.hook,
      sentence: k.sentence,
      img: b64('image/webp', await webp(path.join(KOK, 'src/assets/cards', `${id}.webp`), 520, 390)),
    };
  };
  const havuz = await Promise.all(HAVUZ.map(kartVer));

  const kartGovde = (k) => `
            <div class="resim"><img src="${k.img}" alt="${k.sentence}" loading="lazy"></div>
            <div class="alt">
              <div class="satir">
                <span class="en">${k.en}</span>
                <span class="tr">${k.tr}</span>
                <span class="kanca-rozet">≈ ${k.hook}</span>
              </div>
              <p class="cumle">"${k.sentence}"</p>
            </div>`;

  const kisiler = await Promise.all(
    KISILER.map(async (p) => {
      const img = b64(
        'image/webp',
        await webp(path.join(KOK, 'brand/anasayfa/kisiler', `${p.dosya}.png`), 960, 540),
      );
      return `
          <article class="slayt">
            <div class="resim"><img src="${img}" alt="${p.an}" loading="lazy"></div>
            <div class="bilgi">
              <p class="an">${p.an}</p>
              <p class="sure">${p.sure}</p>
            </div>
          </article>`;
    }),
  );

  const yerine = {
    KISILER: kisiler.join(''),
    KANCA_KARTLARI: havuz
      .slice(0, GORUNEN)
      .map((k) => `<article class="kanca-kart">${kartGovde(k)}</article>`)
      .join(''),
    KANCA_HAVUZ: JSON.stringify(havuz),
    LOGO_ACIK: b64('image/svg+xml', veri('brand/logo-isaret.svg')),
    LOGO_KOYU: b64('image/svg+xml', veri('brand/logo-isaret-koyu.svg')),
  };

  for (const [ad, anahtar] of Object.entries(CIZIMLER)) {
    const dosya = path.join(KOK, 'brand/anasayfa', `${ad}.png`);
    yerine[anahtar] = b64('image/webp', await webp(dosya, 360, 360));
    yerine[`ZEMIN_${anahtar.replace('IK_', '')}`] = await zeminTonu(dosya);
  }

  for (const [k, d] of Object.entries(yerine)) s = s.split(`__${k}__`).join(d);

  const kalan = s.match(/__[A-Z_]+__/g);
  if (kalan) throw new Error(`doldurulmamis yer tutucu: ${[...new Set(kalan)].join(', ')}`);

  fs.mkdirSync(path.dirname(cikti), { recursive: true });
  fs.writeFileSync(cikti, s);
  console.log(
    `${cikti} — ${Math.round(s.length / 1024)} KB, ${KISILER.length} sahne, ${HAVUZ.length} kanca`,
  );
}

const hedef = process.argv[2];
if (!hedef) {
  console.error('kullanim: node tools/anasayfa.mjs <cikti-yolu>');
  process.exit(1);
}
await derle(path.resolve(hedef));
