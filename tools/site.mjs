// hafizada.com sitesini (portal deposu) bastan uretir.
//
//   node tools/site.mjs ../hasanozdemiryz-blip.github.io
//
// NEDEN BURADA. Portal deposunda derleme adimi yok; GitHub Pages ham HTML
// servis ediyor. Kaynak (site/) ve uretici bu depoda, cikti portal deposuna
// yaziliyor ve orada commit ediliyor.
//
// NEDEN TEK KABUK. Bir sure yalnizca ana sayfa vardi; yasal sayfalar ayri,
// menusuz ve baska renkteydi — kullanici "ayri bir site gibi" dedi. Simdi her
// sayfa `site/kabuk.html`i kullaniyor: ayni ust menu, ayni footer, ayni stil.
//
// NEDEN GORSELLER DOSYA. Tek sayfa varken gorseller data URI olarak
// gomuluyordu (ek istek olmasin diye). Sayfa sayisi artinca ayni logo her
// sayfada yeniden iniyordu; ayrica gomulu gorsel Google Gorseller'de cikmiyor.

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '..');
const SITE = path.join(KOK, 'site');
const ALAN = 'https://hafizada.com';
const SUPABASE = 'https://safbupshatjmfxdviwvp.supabase.co';

/**
 * Iletisim formu sunucu tarafi kurulu mu (bkz. supabase/functions/iletisim).
 * Kurulana kadar formun yerinde e-posta baglantisi duruyor: calismayan bir
 * form gostermektense hic gostermemek.
 */
const ILETISIM_HAZIR = process.env.ILETISIM_HAZIR === '1';

const oku = (p) => fs.readFileSync(path.join(SITE, p), 'utf8');
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Ust menu — masaustunde yatay, telefonda acilir liste. */
const MENU = [
  ['/#yontem', 'Nasıl çalışıyor?'],
  ['/#kancalar', 'Örnekler'],
  ['/#sss', 'SSS'],
  ['/iletisim/', 'İletişim'],
];

/** Footer'daki "Ogren" sutunu. Blog ve kelime sayfalari gelince buraya eklenir. */
const OGREN = [
  ['/#kancalar', 'Kanca örnekleri'],
  ['/#neden', 'Yöntem neden işe yarıyor?'],
  ['/#sss', 'Sık sorulan sorular'],
];

/**
 * Sik sorulan sorular. Ana sayfada acilir liste, ayni metin Google'a
 * FAQPage yapisal verisi olarak da gidiyor — iki kopya ayrismasin diye tek yer.
 */
const SSS = [
  [
    'Hafızada İngilizce nedir?',
    'İngilizce kelimeleri benzer sesli bir Türkçe kelimeye ve tek bir görsele bağlayarak öğreten ücretsiz bir uygulama. Kelimeyi ezberlemiyorsun; bir sese ve bir sahneye bağlıyorsun.',
  ],
  [
    'Ses kancası ne demek?',
    'İngilizce kelimeye sesçe benzeyen bir Türkçe kelime. Örneğin sell (satmak) ≈ sel: “Sel gelmeden evini sattı.” Sahneyi hatırlayınca kelimenin anlamı da geliyor.',
  ],
  [
    'Ücretli mi?',
    'Hayır. Hafızada İngilizce ücretsiz ve reklamsız.',
  ],
  [
    'Üye olmam gerekiyor mu?',
    'Hayır, üye olmadan hemen başlayabilirsin. Üye olursan ilerlemen hesabında saklanır; telefonda başlayıp bilgisayarda kaldığın yerden devam edersin.',
  ],
  [
    'Telaffuzu da öğrenebilir miyim?',
    'Evet. Kanca anlamı hatırlatır, telaffuzu değil; o yüzden her kelimenin doğru sesini dinlersin ve son basamakta kelimeyi yalnızca duyarak tanırsın.',
  ],
  [
    'Günde ne kadar zaman ayırmalıyım?',
    'Günde 5, 10 ya da 15 yeni kelime seçebilirsin. Bir ders birkaç dakika sürer; uygulama tekrarları tam unutacakken karşına getirir.',
  ],
  [
    'Hangi cihazlarda çalışıyor?',
    'Telefonun ve bilgisayarının tarayıcısında çalışır. Ana ekrana ekleyip uygulama gibi kullanabilirsin; internet yokken de açılır.',
  ],
];

/** Kahraman slider: urun degil INSAN (bkz. NOTLAR). */
const KISILER = [
  { dosya: 'otobus', an: 'Otobüste dört dakika', sure: 'Bir durak arası beş kelime' },
  { dosya: 'kahve', an: 'Kahve molasında', sure: 'Ezber yok — bağlıyorsun, kalıyor' },
  { dosya: 'ogrenci', an: 'Sırada beklerken', sure: 'Telefon açık, kanca hazır' },
  { dosya: 'kanepe', an: 'Akşam kanepede', sure: 'Günlük hedef dolunca gün kapanıyor' },
];

/** Kanca bolumunun havuzu: kancasi en net anlasilan dokuz kart. */
const HAVUZ = ['snake', 'bad', 'fox', 'leaf', 'boat', 'cup', 'sell', 'dark', 'salt'];
const GORUNEN = 3;

/** Bolum cizimleri: brand/anasayfa/<ad>.png */
const CIZIMLER = { telaffuz: 'IK_TELAFFUZ', merdiven: 'IK_MERDIVEN', cihaz: 'IK_CIHAZ' };

/** Yasal sayfalar: kaynak site/yasal/, eski adres uygulama deposunda yonlendirme. */
const YASAL = [
  {
    dosya: 'gizlilik',
    baslik: 'Gizlilik Politikası',
    aciklama: 'Hafızada İngilizce hangi verileri tutar, nerede saklar ve nasıl silersin.',
  },
  {
    dosya: 'kullanim-kosullari',
    baslik: 'Kullanım Koşulları',
    aciklama: 'Hafızada İngilizce uygulamasının kullanım koşulları.',
  },
  {
    dosya: 'kvkk',
    baslik: 'KVKK Aydınlatma Metni',
    aciklama: '6698 sayılı KVKK kapsamında Hafızada İngilizce aydınlatma metni.',
  },
];

// --- Yardimcilar ------------------------------------------------------------

async function zeminTonu(dosya) {
  const { data } = await sharp(dosya)
    .extract({ left: 4, top: 4, width: 8, height: 8 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const kanal = (i) =>
    Math.round([...Array(64).keys()].reduce((t, k) => t + data[k * 3 + i], 0) / 64);
  return `#${[kanal(0), kanal(1), kanal(2)].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function yaz(hedef, yol, icerik) {
  const tam = path.join(hedef, yol);
  fs.mkdirSync(path.dirname(tam), { recursive: true });
  fs.writeFileSync(tam, icerik);
}

async function webpYaz(hedef, yol, kaynak, g, y, fit = 'cover') {
  const tam = path.join(hedef, yol);
  fs.mkdirSync(path.dirname(tam), { recursive: true });
  await sharp(kaynak).resize(g, y, { fit }).webp({ quality: 82 }).toFile(tam);
  return `/${yol}`;
}

const jsonld = (...nesneler) =>
  nesneler
    .map((n) => `<script type="application/ld+json">${JSON.stringify(n)}</script>`)
    .join('\n');

const KURULUS = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Hafızada İngilizce',
  url: `${ALAN}/`,
  logo: `${ALAN}/varliklar/logo-512.png`,
  sameAs: ['https://www.instagram.com/hafizadaingilizce'],
};

const kirinti = (sayfalar) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: sayfalar.map(([ad, yol], i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: ad,
    item: `${ALAN}${yol}`,
  })),
});

const menuHtml = (liste, girinti) =>
  liste.map(([href, ad]) => `${girinti}<a href="${href}">${ad}</a>`).join('\n');

// --- Uretim ------------------------------------------------------------------

async function derle(hedef) {
  const surum = Date.now().toString(36);
  const kabuk = oku('kabuk.html');
  const kartlar = JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8'));
  const tumKartlar = kartlar.cards || kartlar;

  // Varliklar
  yaz(hedef, 'varliklar/site.css', oku('stil.css'));
  fs.copyFileSync(path.join(KOK, 'brand/logo-isaret.svg'), path.join(hedef, 'varliklar/logo.svg'));
  fs.copyFileSync(
    path.join(KOK, 'brand/logo-isaret-koyu.svg'),
    path.join(hedef, 'varliklar/logo-koyu.svg'),
  );
  fs.copyFileSync(
    path.join(KOK, 'public/apple-touch-icon.png'),
    path.join(hedef, 'varliklar/apple-touch-icon.png'),
  );
  await sharp(path.join(KOK, 'public/icon-512.png')).toFile(path.join(hedef, 'varliklar/logo-512.png'));

  /*
    Paylasim gorseli (1200x630): kilit + snake karti. Yazi SVG ile
    cizilmiyor — sunucuda Nunito yok, yedek font markayi bozuyordu.
  */
  const kilit = await sharp(path.join(KOK, 'brand/kilit.png')).resize(620).toBuffer();
  const kart = await sharp(path.join(KOK, 'src/assets/cards/snake.webp'))
    .resize(440, 330)
    .toBuffer();
  await sharp({
    create: { width: 1200, height: 630, channels: 3, background: '#fffaf0' },
  })
    .composite([
      { input: kilit, left: 50, top: 222 },
      { input: kart, left: 710, top: 150 },
    ])
    .png()
    .toFile(path.join(hedef, 'varliklar/og.png'));
  const OG = `${ALAN}/varliklar/og.png`;

  // --- Ana sayfa gorselleri ---
  const kanca = async (id) => {
    const k = tumKartlar.find((x) => x.id === id);
    if (!k) throw new Error(`kart bulunamadi: ${id}`);
    return {
      en: k.en,
      tr: k.tr,
      hook: k.hook,
      sentence: k.sentence,
      img: await webpYaz(
        hedef,
        `varliklar/kancalar/${id}.webp`,
        path.join(KOK, 'src/assets/cards', `${id}.webp`),
        520,
        390,
      ),
    };
  };
  const havuz = await Promise.all(HAVUZ.map(kanca));
  const kartGovde = (k) => `
            <div class="resim"><img src="${k.img}" alt="${esc(k.sentence)}" width="520" height="390" loading="lazy"></div>
            <div class="alt">
              <div class="satir">
                <span class="en">${k.en}</span>
                <span class="tr">${k.tr}</span>
                <span class="kanca-rozet">≈ ${k.hook}</span>
              </div>
              <p class="cumle">"${esc(k.sentence)}"</p>
            </div>`;

  const kisiler = await Promise.all(
    KISILER.map(async (p, i) => {
      const img = await webpYaz(
        hedef,
        `varliklar/kisiler/${p.dosya}.webp`,
        path.join(KOK, 'brand/anasayfa/kisiler', `${p.dosya}.png`),
        960,
        540,
      );
      // Ilk sahne hemen gorunuyor: tembel yukleme onu geciktirirdi.
      return `
          <article class="slayt">
            <div class="resim"><img src="${img}" alt="${p.an}" width="960" height="540"${i ? ' loading="lazy"' : ''}></div>
            <div class="bilgi">
              <p class="an">${p.an}</p>
              <p class="sure">${p.sure}</p>
            </div>
          </article>`;
    }),
  );

  const formHtml = ILETISIM_HAZIR ? oku('sayfalar/form.html') : oku('sayfalar/form-yerine.html');
  const formJs = ILETISIM_HAZIR
    ? oku('sayfalar/form.js.html').replace('__ILETISIM_ADRESI__', `${SUPABASE}/functions/v1/iletisim`)
    : '';
  const iletisimBolum = (baslik) =>
    oku('sayfalar/iletisim-bolum.html')
      .replace('__ILETISIM_BASLIK__', baslik)
      .replace('__FORM__', formHtml);

  const sssHtml = oku('sayfalar/sss.html').replace(
    '__SSS_MADDELER__',
    SSS.map(
      ([s, c]) => `      <details>
        <summary>${s}</summary>
        <p>${c}</p>
      </details>`,
    ).join('\n'),
  );

  const anaYerine = {
    KISILER: kisiler.join(''),
    KANCA_KARTLARI: havuz
      .slice(0, GORUNEN)
      .map((k) => `<article class="kanca-kart">${kartGovde(k)}</article>`)
      .join(''),
    SSS: sssHtml,
    ILETISIM: iletisimBolum('Bize yaz'),
  };
  for (const [ad, anahtar] of Object.entries(CIZIMLER)) {
    const dosya = path.join(KOK, 'brand/anasayfa', `${ad}.png`);
    anaYerine[anahtar] = await webpYaz(hedef, `varliklar/cizimler/${ad}.webp`, dosya, 360, 360);
    anaYerine[`ZEMIN_${anahtar.replace('IK_', '')}`] = await zeminTonu(dosya);
  }

  let anaGovde = oku('sayfalar/anasayfa.html');
  for (const [k, d] of Object.entries(anaYerine)) anaGovde = anaGovde.split(`__${k}__`).join(d);
  const anaJs = oku('sayfalar/anasayfa.js.html').replace('__KANCA_HAVUZ__', JSON.stringify(havuz));

  // --- Sayfa listesi ---
  const sayfalar = [
    {
      yol: '/',
      baslik: 'Hafızada İngilizce — Ezberlemeden İngilizce kelime öğren',
      aciklama:
        'Her İngilizce kelimeyi benzer sesli bir Türkçe kelimeye ve tek bir görsele bağla. Ezber yok, reklam yok, ücretsiz.',
      ogTur: 'website',
      icerik: anaGovde,
      script: anaJs + formJs,
      ld: jsonld(
        KURULUS,
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Hafızada İngilizce',
          url: `${ALAN}/`,
          inLanguage: 'tr',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'Hafızada İngilizce',
          url: `${ALAN}/ingilizce/`,
          applicationCategory: 'EducationalApplication',
          operatingSystem: 'Web, Android, iOS',
          inLanguage: 'tr',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: SSS.map(([s, c]) => ({
            '@type': 'Question',
            name: s,
            acceptedAnswer: { '@type': 'Answer', text: c },
          })),
        },
      ),
    },
    {
      yol: '/iletisim/',
      baslik: 'İletişim — Hafızada İngilizce',
      aciklama: 'Öneri, hata bildirimi ya da soru: Hafızada İngilizce ekibine yaz.',
      ogTur: 'website',
      icerik: altBaslik('İletişim', 'Sorun, öneri ya da merak ettiğin bir şey varsa yaz.', [
        ['İletişim', '/iletisim/'],
      ]) + iletisimBolum('Bize yaz'),
      script: formJs,
      ld: jsonld(kirinti([['Ana sayfa', '/'], ['İletişim', '/iletisim/']])),
    },
    ...YASAL.map((y) => ({
      yol: `/${y.dosya}/`,
      baslik: `${y.baslik} — Hafızada İngilizce`,
      aciklama: y.aciklama,
      ogTur: 'article',
      icerik:
        altBaslik(y.baslik, null, [[y.baslik, `/${y.dosya}/`]]) +
        `<div class="kap"><article class="metin">\n${oku(`yasal/${y.dosya}.html`)}\n${ilgili(y.dosya)}\n</article></div>`,
      script: '',
      ld: jsonld(kirinti([['Ana sayfa', '/'], [y.baslik, `/${y.dosya}/`]])),
    })),
  ];

  for (const s of sayfalar) {
    let html = kabuk;
    const yerine = {
      BASLIK: esc(s.baslik),
      ACIKLAMA: esc(s.aciklama),
      KANONIK: `${ALAN}${s.yol}`,
      OG_TUR: s.ogTur,
      OG_RESIM: OG,
      SURUM: surum,
      JSONLD: s.ld,
      MENU: menuHtml(MENU, '      '),
      OGREN_MENU: menuHtml(OGREN, '      '),
      ICERIK: s.icerik,
      SCRIPT: s.script,
      YIL: String(new Date().getFullYear()),
    };
    for (const [k, d] of Object.entries(yerine)) html = html.split(`__${k}__`).join(d);
    const kalan = html.match(/__[A-Z_]+__/g);
    if (kalan) throw new Error(`${s.yol}: doldurulmamis yer tutucu ${[...new Set(kalan)].join(', ')}`);
    yaz(hedef, s.yol === '/' ? 'index.html' : `${s.yol.slice(1)}index.html`, html);
  }

  // 404 — GitHub Pages bilinmeyen adreste bunu gosteriyor.
  let bulunamadi = kabuk;
  const yerine404 = {
    BASLIK: 'Sayfa bulunamadı — Hafızada İngilizce',
    ACIKLAMA: 'Aradığın sayfa burada değil.',
    KANONIK: `${ALAN}/`,
    OG_TUR: 'website',
    OG_RESIM: OG,
    SURUM: surum,
    JSONLD: '<meta name="robots" content="noindex">',
    MENU: menuHtml(MENU, '      '),
    OGREN_MENU: menuHtml(OGREN, '      '),
    ICERIK:
      altBaslik('Sayfa bulunamadı', 'Aradığın sayfa taşınmış ya da hiç olmamış olabilir.', []) +
      '<div class="kap"><div class="metin"><p><a href="/">Ana sayfaya dön</a> ya da <a href="/ingilizce/">hemen öğrenmeye başla</a>.</p></div></div>',
    SCRIPT: '',
    YIL: String(new Date().getFullYear()),
  };
  for (const [k, d] of Object.entries(yerine404)) bulunamadi = bulunamadi.split(`__${k}__`).join(d);
  yaz(hedef, '404.html', bulunamadi);

  // --- Arama motorlari ---
  const bugun = new Date().toISOString().slice(0, 10);
  yaz(
    hedef,
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sayfalar.map((s) => `  <url><loc>${ALAN}${s.yol}</loc><lastmod>${bugun}</lastmod></url>`).join('\n')}
</urlset>
`,
  );
  /*
    Uygulamanin kendisi (/ingilizce/) dizine girmesin: icerigi JavaScript'le
    olusan, her ziyaretcide ayni bos kabuk. Aranan sey site sayfalari.
  */
  yaz(
    hedef,
    'robots.txt',
    `User-agent: *
Disallow: /ingilizce/

Sitemap: ${ALAN}/sitemap.xml
`,
  );

  console.log(
    `${hedef} — ${sayfalar.length} sayfa + 404, iletişim formu ${ILETISIM_HAZIR ? 'AÇIK' : 'kapalı (e-posta bağlantısı)'}`,
  );
}

/** Alt sayfalarin lacivert basligi + kirinti. */
function altBaslik(baslik, alt, yol) {
  const k = [['Ana sayfa', '/'], ...yol]
    .map(([ad, href], i, a) => (i < a.length - 1 ? `<a href="${href}">${ad}</a>` : `<span>${ad}</span>`))
    .join(' › ');
  return `<section class="sayfa-ust">
  <div class="kap">
    ${yol.length ? `<nav class="kirinti" aria-label="Konum">${k}</nav>` : ''}
    <h1>${baslik}</h1>
    ${alt ? `<p>${alt}</p>` : ''}
  </div>
</section>
`;
}

/** Yasal sayfalarin altindaki "diger metinler". */
function ilgili(su) {
  return `<nav class="ilgili" aria-label="Diğer metinler">
${YASAL.filter((y) => y.dosya !== su)
  .map((y) => `  <a href="/${y.dosya}/">${y.baslik}</a>`)
  .join('\n')}
  <a href="/iletisim/">İletişim</a>
</nav>`;
}

const hedef = process.argv[2];
if (!hedef) {
  console.error('kullanim: node tools/site.mjs <portal-deposu>');
  process.exit(1);
}
await derle(path.resolve(hedef));
