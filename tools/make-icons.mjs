/**
 * brand/logo-isaret.svg (seffaf isaret) -> markanin tum turevleri.
 *
 * Tek kaynak VEKTOR: uygulama simgesi, cihaz simgeleri ve sosyal medya
 * ayni isareti tasisin ve her boyutta keskin cikssin. Uretim degil,
 * olcekleme/yerlestirme.
 *
 * Once kaynak 1,1 MB'lik bir PNG'ydi (`brand/kilit-kaynak.png`) ve tum
 * turevler ondan kirpiliyordu: 40 pikselde kenarlar daginiktı, rengi
 * degistirmek icin dosyayi yeniden uretmek gerekiyordu.
 *
 * Uretilenler:
 *   public/icon-192.png, icon-512.png, icon-512-maskable.png,
 *   public/apple-touch-icon.png          -> PWA / cihaz simgeleri
 *   public/favicon.ico, favicon-96x96.png -> tarayici sekmesi, Google sonucu
 *   brand/logo-isaret.png                -> seffaf isaret (filigran, sunum)
 *   brand/instagram-profil*.png          -> profil fotografi (daire guvenli)
 *   src/assets/brand/isaret.webp         -> uygulama ici (acilis ekrani)
 *   resources/*                          -> Android launcher ikonu (bkz. asagi)
 *
 * Kullanim: npm run icons
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const y = (...p) => resolve(KOK, ...p);

/** Marka zemini — isaretin uzerinde durdugu krem */
const KREM = { r: 0xff, g: 0xf7, b: 0xe4, alpha: 1 };
/** Koyu varyant — akisda beyaz/acik zeminler arasinda ayrissin diye */
const LACI = { r: 0x16, g: 0x23, b: 0x3a, alpha: 1 };
const SEFFAF = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * Isaretin tuvale orani.
 *
 * `maskable`: Android simgeyi daire/squircle'a kirpiyor, guvenli alan
 * tuvalin %80'lik DAIRESI. Kare bir isaretin o dairenin icine sigmasi
 * icin kenari en fazla 0.8/√2 ≈ 0.566 olabilir.
 * `daire`: Instagram profil fotografi da daire — ayni hesap, biraz daha
 * rahat bir pay.
 */
const ORAN = { normal: 0.72, maskable: 0.56, daire: 0.55 };

/**
 * Kaynak vektoru cizip icerigine kirp.
 *
 * 2048'lik viewBox'i 600 density ile cizmek ~12k x 12k piksel ediyor ve
 * sharp'in guvenlik sinirini asiyor; 2048 kenar her turev icin fazlasiyla
 * yeterli (en buyuk cikti 1080).
 */
const kaynakSvg = await readFile(y('brand/logo-isaret.svg'), 'utf8');

const cizim = (svg) =>
  sharp(Buffer.from(svg))
    .resize(2048, 2048, { fit: 'inside' })
    .png()
    .toBuffer()
    .then((b) => sharp(b).trim().png().toBuffer());

const isaret = await cizim(kaynakSvg);
/** Koyu zeminde laciverт yari kayboluyor; orada yerini krem aliyor. */
const isaretTers = await cizim(kaynakSvg.replaceAll('#16233A', '#FFF7E4'));

/** Isareti verilen tuvalin ortasina, verilen oranda yerlestirir. */
async function kare(boyut, { zemin, oran, cikti, ters = false }) {
  const hedef = Math.round(boyut * oran);
  if (oran === 0) {
    // Yalnizca duz zemin — uyarlanabilir ikonun arka plani gibi
    const bos = sharp({ create: { width: boyut, height: boyut, channels: 4, background: zemin } });
    await mkdir(dirname(y(cikti)), { recursive: true });
    await bos.png().toFile(y(cikti));
    return cikti;
  }
  const ic = await sharp(ters ? isaretTers : isaret)
    .resize(hedef, hedef, { fit: 'contain', background: SEFFAF })
    .toBuffer();

  const tuval = sharp({
    create: { width: boyut, height: boyut, channels: 4, background: zemin },
  }).composite([{ input: ic, gravity: 'centre' }]);

  await mkdir(dirname(y(cikti)), { recursive: true });
  if (cikti.endsWith('.webp')) await tuval.webp({ quality: 92 }).toFile(y(cikti));
  else await tuval.png().toFile(y(cikti));
  return cikti;
}

/**
 * Android launcher ikonu AYRI bir is.
 *
 * `public/icon-*.png` yalnizca PWA'nin ikonu; Android kendi
 * `mipmap` klasorlerindeki `ic_launcher` dosyalarini istiyor ve onlari
 * Capacitor'un sablonu dolduruyor. Uzun sure APK'da VARSAYILAN ikon
 * durdu — kimse uretmemisti.
 *
 * `android/` depoda tutulmadigi (her seferinde `cap add` ile uretildigi)
 * icin ikonlari oraya elle koymak kalici degil. Dogru yer `resources/`:
 * `npx @capacitor/assets generate --android` bu klasorden butun
 * yogunluklari uretip android projesine yaziyor.
 *
 * Uyarlanabilir (adaptive) ikon on plan + arka plan istiyor: on planda
 * isaret, arkada duz krem. Sistem bunu daire/squircle'a kirptigi icin
 * on plandaki isaret guvenli alanda kaliyor.
 */
const ANDROID = [
  kare(1024, { zemin: KREM, oran: ORAN.normal, cikti: 'resources/icon.png' }),
  kare(1024, { zemin: SEFFAF, oran: ORAN.maskable, cikti: 'resources/icon-foreground.png' }),
  kare(1024, { zemin: KREM, oran: 0, cikti: 'resources/icon-background.png' }),
  kare(2732, { zemin: KREM, oran: 0.22, cikti: 'resources/splash.png' }),
  kare(2732, { zemin: LACI, oran: 0.22, cikti: 'resources/splash-dark.png', ters: true }),
];

const isler = [
  // --- PWA / cihaz ---
  kare(192, { zemin: KREM, oran: ORAN.normal, cikti: 'public/icon-192.png' }),
  kare(512, { zemin: KREM, oran: ORAN.normal, cikti: 'public/icon-512.png' }),
  kare(512, { zemin: KREM, oran: ORAN.maskable, cikti: 'public/icon-512-maskable.png' }),
  kare(180, { zemin: KREM, oran: ORAN.normal, cikti: 'public/apple-touch-icon.png' }),

  // --- Uygulama ici (acilis ekrani) ---
  kare(512, { zemin: SEFFAF, oran: 1, cikti: 'src/assets/brand/isaret.webp' }),

  // --- Marka / sosyal ---
  kare(1024, { zemin: SEFFAF, oran: 1, cikti: 'brand/logo-isaret.png' }),
  kare(1080, { zemin: KREM, oran: ORAN.daire, cikti: 'brand/instagram-profil.png' }),
  kare(1080, { zemin: LACI, oran: ORAN.daire, cikti: 'brand/instagram-profil-lacivert.png' }),
];

/**
 * FAVICON. Sekmede 16-32 piksel: isaret tuvali neredeyse dolduruyor (0.9),
 * yoksa krem zeminde kucuk bir leke kaliyor. Zemin krem — seffaf olsa koyu
 * temali sekmede isaretin lacivert yarisi kayboluyordu.
 *
 * `.ico` icinde 16/32/48 PNG. Google arama sonucundaki simge 48'in kati
 * istiyor: 96'lik ayrica.
 */
const FAVICON_ORAN = 0.9;

async function favicon(boyut) {
  const ic = await sharp(isaret)
    .resize(Math.round(boyut * FAVICON_ORAN), Math.round(boyut * FAVICON_ORAN), {
      fit: 'contain',
      background: SEFFAF,
    })
    .toBuffer();
  return sharp({ create: { width: boyut, height: boyut, channels: 4, background: KREM } })
    .composite([{ input: ic, gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** PNG'leri tek .ico'ya sarar (Vista'dan beri .ico icinde PNG gecerli). */
function ico(parcalar) {
  const bas = Buffer.alloc(6 + 16 * parcalar.length);
  bas.writeUInt16LE(0, 0);
  bas.writeUInt16LE(1, 2);
  bas.writeUInt16LE(parcalar.length, 4);
  let konum = bas.length;
  parcalar.forEach(({ boyut, veri }, i) => {
    const o = 6 + 16 * i;
    bas.writeUInt8(boyut >= 256 ? 0 : boyut, o);
    bas.writeUInt8(boyut >= 256 ? 0 : boyut, o + 1);
    bas.writeUInt8(0, o + 2);
    bas.writeUInt8(0, o + 3);
    bas.writeUInt16LE(1, o + 4);
    bas.writeUInt16LE(32, o + 6);
    bas.writeUInt32LE(veri.length, o + 8);
    bas.writeUInt32LE(konum, o + 12);
    konum += veri.length;
  });
  return Buffer.concat([bas, ...parcalar.map((p) => p.veri)]);
}

const FAVICON = (async () => {
  const parcalar = await Promise.all(
    [16, 32, 48].map(async (boyut) => ({ boyut, veri: await favicon(boyut) })),
  );
  await writeFile(y('public/favicon.ico'), ico(parcalar));
  await writeFile(y('public/favicon-96x96.png'), await favicon(96));
  return 'public/favicon.ico, public/favicon-96x96.png';
})();

for (const c of await Promise.all([...isler, ...ANDROID, FAVICON])) console.log('✓', c);
