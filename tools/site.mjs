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
 * Iletisim formu acik mi. Sunucu tarafi 5 Ekim'de kuruldu (tablo + islev);
 * acil bir durumda `ILETISIM_HAZIR=0` ile formun yerine e-posta baglantisi
 * konabiliyor.
 */
const ILETISIM_HAZIR = process.env.ILETISIM_HAZIR !== '0';

const oku = (p) => fs.readFileSync(path.join(SITE, p), 'utf8');
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Ust menu — masaustunde yatay, telefonda acilir liste. */
const MENU = [
  ['/#yontem', 'Nasıl çalışıyor?'],
  ['/kelimeler/', 'Kelimeler'],
  ['/blog/', 'Blog'],
  ['/#sss', 'SSS'],
  ['/iletisim/', 'İletişim'],
];

/** Footer'daki "Ogren" sutunu. */
const OGREN = [
  ['/kelimeler/', 'Kelime listesi'],
  ['/blog/', 'Blog'],
  ['/blog/turkceye-benzeyen-ingilizce-kelimeler/', 'Türkçeye benzeyen kelimeler'],
  ['/blog/ses-kancasi-yontemi/', 'Ses kancası yöntemi'],
  ['/#sss', 'Sık sorulan sorular'],
];

/**
 * INGILIZCE ANA SAYFA (/en/). Yalnizca ana sayfanin Ingilizcesi var: blog,
 * kelime sayfalari ve yasal metinler Turkce kitle icin. Ingilizce menu bu
 * yuzden sayfa ici bolumlere gidiyor; Turkce sayfalara giden baglantilar
 * "(Turkish)" diye isaretli — tiklayan neyle karsilasacagini bilsin.
 */
const MENU_EN = [
  ['/en/#yontem', 'How it works'],
  ['/en/#neden', 'Why it works'],
  ['/en/#sss', 'FAQ'],
  ['/en/#iletisim', 'Contact'],
];
const OGREN_EN = [
  ['/en/#kancalar', 'Hook examples'],
  ['/en/#sss', 'FAQ'],
  ['/kelimeler/', 'Word list (Turkish)'],
  ['/blog/', 'Blog (Turkish)'],
];

/** Kabugun (ust menu, footer) metinleri — `__K_<AD>__`. */
const KABUK = {
  tr: {
    GIRIS: 'Giriş yap',
    ANA: '/',
    ANA_ARIA: 'Hafızada İngilizce ana sayfa',
    ANA_MENU: 'Ana menü',
    BASLA: 'Hemen başla',
    MENU: 'Menü',
    ALT_TANIM:
      'İngilizce kelimeleri benzer sesli Türkçe kelimelere bağlayarak öğren. Ezber yok, reklam yok, ücretsiz.',
    UYGULAMA: 'Uygulama',
    NASIL: 'Nasıl çalışıyor?',
    NEDEN: 'Neden işe yarıyor?',
    OGREN: 'Öğren',
    YARDIM: 'Yardım',
    ILETISIM_YOL: '/iletisim/',
    ILETISIM: 'İletişim',
    GIZLILIK: 'Gizlilik Politikası',
    KOSULLAR: 'Kullanım Koşulları',
    KVKK: 'KVKK Aydınlatma Metni',
    ALT_SLOGAN: 'Ücretsiz · Reklamsız · Telefonda ve bilgisayarda',
  },
  en: {
    GIRIS: 'Log in',
    ANA: '/en/',
    ANA_ARIA: 'Hafızada İngilizce home',
    ANA_MENU: 'Main menu',
    BASLA: 'Get started',
    MENU: 'Menu',
    ALT_TANIM:
      'Learn English words by linking them to similar-sounding Turkish words. No rote learning, no ads, free.',
    UYGULAMA: 'App',
    NASIL: 'How it works',
    NEDEN: 'Why it works',
    OGREN: 'Learn',
    YARDIM: 'Help',
    ILETISIM_YOL: '/en/#iletisim',
    ILETISIM: 'Contact',
    GIZLILIK: 'Privacy Policy (Turkish)',
    KOSULLAR: 'Terms of Use (Turkish)',
    KVKK: 'KVKK Notice (Turkish)',
    ALT_SLOGAN: 'Free · No ads · On your phone and computer',
  },
};

const DUNYA =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19"/><path d="M12 2.5c2.6 2.7 3.9 5.9 3.9 9.5s-1.3 6.8-3.9 9.5c-2.6-2.7-3.9-5.9-3.9-9.5s1.3-6.8 3.9-9.5z"/></svg>';

/**
 * Dil secici (lacivert menu; telefonda acilir menude). Ingilizcesi olmayan Turkce sayfada EN, Ingilizce
 * ana sayfaya gidiyor. Tiklaninca secim uygulamaya da yaziliyor (kabuk.html).
 */
function dilSecici(dil, trYol, enYol) {
  const bag = (kod, yol, ad, baslik) =>
    `<a href="${yol}" hreflang="${kod}" lang="${kod}" title="${baslik}" data-dil="${kod}"${dil === kod ? ' aria-current="true"' : ''}>${ad}</a>`;
  return `    <div class="dil" role="group" aria-label="Dil / Language">
      ${DUNYA}
      <span class="dil-kutu">${bag('tr', trYol, 'TR', 'Türkçe')}${bag('en', enYol, 'EN', 'English')}</span>
    </div>`;
}

/** Ana sayfanin iki dili birbirini gosteriyor; Google dogru olani sunsun. */
const HREFLANG = [
  `<link rel="alternate" hreflang="tr" href="${ALAN}/">`,
  `<link rel="alternate" hreflang="en" href="${ALAN}/en/">`,
  `<link rel="alternate" hreflang="x-default" href="${ALAN}/">`,
].join('\n');

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

/** SSS'nin Ingilizcesi — sira ve kapsam ayni. */
const SSS_EN = [
  [
    'What is Hafızada İngilizce?',
    'A free app that teaches English words by linking each one to a similar-sounding Turkish word and a single image. You don’t memorize the word; you attach it to a sound and a scene.',
  ],
  [
    'What is a sound hook?',
    'A Turkish word that sounds like the English word. For example, sell ≈ sel (flood): “He sold his house before the flood came.” Remember the scene and the meaning comes with it.',
  ],
  ['Is it paid?', 'No. Hafızada İngilizce is free and has no ads.'],
  [
    'Do I need an account?',
    'No, you can start right away without one. With an account your progress is saved, so you can start on your phone and continue on your computer.',
  ],
  [
    'Can I learn pronunciation too?',
    'Yes. The hook reminds you of the meaning, not the pronunciation, so you hear the correct sound of every word, and in the last step you recognize the word by sound alone.',
  ],
  [
    'How much time should I spend a day?',
    'Choose 5, 10 or 15 new words a day. A lesson takes a few minutes, and the app brings each review back just before you’d forget it.',
  ],
  [
    'Which devices does it work on?',
    'It runs in the browser on your phone and computer. Add it to your home screen to use it like an app; it opens even without internet.',
  ],
];

/** Kahraman slider: urun degil INSAN (bkz. NOTLAR). */
const KISILER = [
  { dosya: 'otobus', an: 'Otobüste dört dakika', sure: 'Bir durak arası beş kelime',
    en: { an: 'Four minutes on the bus', sure: 'Five words between two stops' } },
  { dosya: 'kahve', an: 'Kahve molasında', sure: 'Ezber yok. Bağlıyorsun, kalıyor.',
    en: { an: 'On a coffee break', sure: 'No memorizing. You link it, it stays.' } },
  { dosya: 'ogrenci', an: 'Sırada beklerken', sure: 'Telefon açık, kanca hazır',
    en: { an: 'Waiting in line', sure: 'Phone out, hook ready' } },
  { dosya: 'kanepe', an: 'Akşam kanepede', sure: 'Günlük hedef dolunca gün kapanıyor',
    en: { an: 'On the couch at night', sure: 'Hit your daily goal and the day is done' } },
];

/**
 * Sitede sayfasi olan kelime sayisi — uygulamadaki setin EN SIK kullanilan
 * kelimeleri (`order` = siklik sirasi).
 *
 * Neden hepsi degil: kancalar urunun asil degeri; yuzunu birden aramaya
 * acmak kopyalanmalarini kolaylastirir. Ayrica ayni sablondan yuz sayfa,
 * Google'in "toplu uretilmis" saydigi turden ve butun sitenin siralamasini
 * asagi cekebilir. Yirmi vitrin kelime; Search Console verisi gelince
 * genisletme karari verilecek (bkz. NOTLAR, 5 Ekim).
 */
/*
  ACIK LISTE, hesaplanmiyor: once "setin en sik 20'si" diye hesaplaniyordu;
  set buyudukce (6 Ekim: 100 → 200) liste kayabilir ve Google'a bildirilmis
  /kelime/<id>/ adresleri 404 verirdi. Adresler sabit kalmali.
*/
const VITRIN = ['far', 'sell', 'door', 'salt', 'dust', 'sick', 'bad', 'car', 'eye', 'fish',
  'dark', 'deep', 'cup', 'coat', 'boat', 'box', 'brother', 'foot', 'full', 'safe'];

/**
 * Kanca bolumunun havuzu: kancasi en net anlasilan dokuz kart — YALNIZCA
 * sitede sayfasi olan (VITRIN) kelimelerden. Disaridan bir kelime ana
 * sayfada donerse, sakladigimiz kancalari orada gostermis oluruz;
 * derleme bu durumda durur (bkz. `derle`).
 */
const HAVUZ = ['sell', 'door', 'bad', 'car', 'dust', 'dark', 'salt', 'sick', 'fish'];

/** Ana sayfadaki mini ders: uc kart, sonra ILKININ sorusu. Havuzdan. */
const DENEME = ['sell', 'car', 'fish'];
const DENEME_METIN = {
  tr: {
    etiket: 'Kendin dene',
    sonraki: 'Sonraki',
    simdiSen: 'Şimdi sen',
    kayboldu: 'Kart kayboldu.',
    soru: '{en} ne demekti?',
    dogruBaslik: 'Hatırladın.',
    dogruMetin: 'Ezberlemedin, bağladın. Uygulamada her gün yeni kelimeler böyle geliyor.',
    yanlisBaslik: 'Doğrusu: {tr}',
    yanlisMetin: 'Kanca: {en} ≈ {hook}. Birkaç tekrarda oturuyor.',
    devam: 'Devam et',
  },
  en: {
    etiket: 'Try it',
    sonraki: 'Next',
    simdiSen: 'Your turn',
    kayboldu: 'The card is gone.',
    soru: 'What did {en} mean?',
    dogruBaslik: 'You remembered.',
    dogruMetin: 'No memorizing, just a link. The app brings new words like this every day.',
    yanlisBaslik: 'It means: {tr}',
    yanlisMetin: 'Hook: {en} ≈ {hook}. It settles in after a few reviews.',
    devam: 'Keep going',
  },
};
const GORUNEN = 3;

/** Bolum cizimleri: brand/anasayfa/<ad>.png */
const CIZIMLER = { telaffuz: 'IK_TELAFFUZ', merdiven: 'IK_MERDIVEN' };
/**
 * "Neden ise yariyor"un ilk karti: yontemin kendisi, snake karti. Cizim
 * degil kart gorseli — "baglanti" fikrini en iyi bu sahne anlatiyor.
 */
const NEDEN_KART = 'snake';

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

/**
 * Iletisim bolumu, form ve ana sayfa betiginin Ingilizcesi. Bu parcalar
 * kucuk ve iki dilde ayni yapida; ayri dosya yerine metin degistirme.
 * Eslesmeyen bir metin derlemeyi durduruyor (bkz. `enParcaDenetle`) —
 * Turkce dosyada metin degisirse burasi da guncellensin, sessizce Turkce
 * kalmasin.
 */
const EN_PARCA = [
  [
    'Bir öneri, bir hata ya da aklına takılan bir kelime… Mesajın doğrudan bize ulaşır, en kısa sürede dönüş yaparız.',
    'A suggestion, a bug or a word on your mind… Your message comes straight to us, and we’ll get back to you soon.',
  ],
  ["Instagram'dan da yazabilirsin:", 'You can also reach us on Instagram:'],
  ['<label>Adın', '<label>Your name'],
  ['<label>E-posta adresin', '<label>Your email'],
  ['<label>Mesajın', '<label>Your message'],
  ['Bu alanı boş bırak', 'Leave this field empty'],
  ['type="submit">Gönder</button>', 'type="submit">Send</button>'],
  ["'Adını ve mesajını yazman gerekiyor.'", "'Please enter your name and message.'"],
  ["'E-posta adresin geçerli görünmüyor.'", "'Your email address doesn’t look valid.'"],
  ["'Gönderiliyor…'", "'Sending…'"],
  [
    "'Teşekkürler, mesajın bize ulaştı. En kısa sürede dönüş yapacağız.'",
    "'Thanks, we got your message. We’ll get back to you soon.'",
  ],
  [
    "'Kısa sürede çok mesaj gönderildi. Biraz sonra tekrar dene.'",
    "'Too many messages in a short time. Please try again shortly.'",
  ],
  [
    "'Mesaj gönderilemedi. Biraz sonra tekrar dene ya da Instagram\\'dan yaz.'",
    "'Your message couldn’t be sent. Try again shortly or message us on Instagram.'",
  ],
  ["dugme.textContent = 'Gönder';", "dugme.textContent = 'Send';"],
  ["(n + 1) + '. görsel'", "'Slide ' + (n + 1)"],
  ['<h2>Sık sorulan sorular</h2>', '<h2>Frequently asked questions</h2>'],
];
/** Yalnizca e-posta yedegi acikken (ILETISIM_HAZIR=0) gecen parcalar. */
const EN_PARCA_YEDEK = [
  [
    'Mesajını e-postayla gönderebilirsin; doğrudan bize ulaşır.',
    'You can send your message by email; it comes straight to us.',
  ],
  ['>E-posta gönder</a>', '>Send an email</a>'],
];

function ingilizceye(metin) {
  let s = metin;
  for (const [tr, en] of [...EN_PARCA, ...EN_PARCA_YEDEK]) s = s.split(tr).join(en);
  return s;
}

/** Her Ingilizce parca kaynakta bulundu mu — bulunmadiysa Turkce metin degismis. */
function enParcaDenetle(kaynaklar) {
  const birlesik = kaynaklar.join('\n');
  const eksik = EN_PARCA.filter(([tr]) => !birlesik.includes(tr)).map(([tr]) => tr);
  if (eksik.length) {
    throw new Error(`Ingilizceye cevrilemeyen parca (Turkce metin degismis): ${eksik.join(' | ')}`);
  }
}

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

const buyukHarf = (s) => s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
const enBuyuk = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Blog yazilari: site/blog/<kisa-ad>.html. Ilk satirdaki HTML yorumu
 * yazinin kunyesi (JSON): baslik, aciklama, tarih, ozet.
 */
function blogYazilari() {
  const klasor = path.join(SITE, 'blog');
  return fs
    .readdirSync(klasor)
    .filter((f) => f.endsWith('.html'))
    .map((f) => {
      const ham = fs.readFileSync(path.join(klasor, f), 'utf8');
      const m = ham.match(/^<!--(\{.*?\})-->\n/s);
      if (!m) throw new Error(`${f}: kunye yorumu yok`);
      return { kisa: f.replace(/\.html$/, ''), ...JSON.parse(m[1]), govde: ham.slice(m[0].length) };
    })
    // `sira` kunyede elle veriliyor: ayni gun yazilan yazilarin okunma sirasi.
    .sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : (a.sira ?? 99) - (b.sira ?? 99)));
}

/** "Dinle": tarayicinin kendi Ingilizce sesi. Desteklenmiyorsa dugme gizleniyor. */
const DINLE_JS = `<script>
(function () {
  var b = document.querySelector('[data-dinle]');
  if (!b) return;
  if (!('speechSynthesis' in window)) { b.hidden = true; return; }
  b.addEventListener('click', function () {
    var u = new SpeechSynthesisUtterance(b.getAttribute('data-dinle'));
    u.lang = 'en-US';
    u.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
})();
</script>`;

const HOPARLOR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';

/**
 * Kelime sayfasinin aciklama metni. Kanca kelimenin kendisiyse (basket,
 * bitter) "dilimize gecmis" anlatimi; degilse ses benzerligi + sahne.
 */
function kelimeAciklama(k) {
  const En = enBuyuk(k.en);
  const ayni = k.hook.toLocaleLowerCase('tr') === k.en.toLowerCase();
  const bag = ayni
    ? `<p><b>${k.en}</b> kelimesi Türkçede de kullanılıyor; tanıdık geldiyse sebebi bu. Akılda tutmak için sahneyi hatırla: <i>“${esc(k.sentence)}”</i></p>`
    : `<p><b>${k.en}</b> kulağa Türkçedeki <b>${esc(k.hook)}</b> gibi geliyor. Bu benzerliği anlamla birleştiren sahneyi gözünün önüne getir: <i>“${esc(k.sentence)}”</i> ${En} sesini bir dahaki duyuşunda aklına önce ${esc(k.hook)}, hemen ardından <b>${esc(k.tr)}</b> gelecek.</p>`;
  return `<div class="aciklama">
      <h2>${En} nasıl akılda kalır?</h2>
      ${bag}
      <p>Benzer sesli bir Türkçe kelimeyle kurulan bu bağa <a href="/blog/ses-kancasi-yontemi/">ses kancası</a> diyoruz. Kanca anlamı hatırlatır; doğru okunuş için <b>Dinle</b> düğmesine bas.</p>
    </div>`;
}

// --- Uretim ------------------------------------------------------------------

/** Uretilen klasorler — her derlemede bastan yaziliyor, eskisi kalmasin. */
const URETILEN = ['varliklar', 'kelime', 'kelimeler', 'blog', 'iletisim', 'gizlilik', 'kullanim-kosullari', 'kvkk', 'en'];

async function derle(hedef) {
  for (const k of URETILEN) fs.rmSync(path.join(hedef, k), { recursive: true, force: true });
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
  // Favicon (bkz. make-icons.mjs). `.ico` KOKTE: tarayicilar ve Google
  // etiket olmasa da `/favicon.ico`yu soruyor.
  fs.copyFileSync(path.join(KOK, 'public/favicon.ico'), path.join(hedef, 'favicon.ico'));
  fs.copyFileSync(
    path.join(KOK, 'public/favicon-96x96.png'),
    path.join(hedef, 'varliklar/favicon-96x96.png'),
  );

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

  const kisiResimleri = await Promise.all(
    KISILER.map((p) =>
      webpYaz(
        hedef,
        `varliklar/kisiler/${p.dosya}.webp`,
        path.join(KOK, 'brand/anasayfa/kisiler', `${p.dosya}.png`),
        960,
        540,
      ),
    ),
  );
  const kisiler = (dil) =>
    KISILER.map((p, i) => {
      const { an, sure } = dil === 'en' ? p.en : p;
      // Ilk sahne hemen gorunuyor: tembel yukleme onu geciktirirdi.
      return `
          <article class="slayt">
            <div class="resim"><img src="${kisiResimleri[i]}" alt="${an}" width="960" height="540"${i ? ' loading="lazy"' : ''}></div>
            <div class="bilgi">
              <p class="an">${an}</p>
              <p class="sure">${sure}</p>
            </div>
          </article>`;
    });

  const formHtml = ILETISIM_HAZIR ? oku('sayfalar/form.html') : oku('sayfalar/form-yerine.html');
  const formJs = ILETISIM_HAZIR
    ? oku('sayfalar/form.js.html').replace('__ILETISIM_ADRESI__', `${SUPABASE}/functions/v1/iletisim`)
    : '';
  const iletisimBolum = (baslik) =>
    oku('sayfalar/iletisim-bolum.html')
      .replace('__ILETISIM_BASLIK__', baslik)
      .replace('__FORM__', formHtml);

  const sssHtml = (sorular) =>
    oku('sayfalar/sss.html').replace(
      '__SSS_MADDELER__',
      sorular
        .map(
          ([s, c]) => `      <details>
        <summary>${s}</summary>
        <p>${c}</p>
      </details>`,
        )
        .join('\n'),
    );

  const cizimler = {};
  for (const [ad, anahtar] of Object.entries(CIZIMLER)) {
    const dosya = path.join(KOK, 'brand/anasayfa', `${ad}.png`);
    cizimler[anahtar] = await webpYaz(hedef, `varliklar/cizimler/${ad}.webp`, dosya, 360, 360);
    cizimler[`ZEMIN_${anahtar.replace('IK_', '')}`] = await zeminTonu(dosya);
  }
  // Gorsel kutuyu kaplamiyor (cizimler gibi ortada); kalan yer onun zemini.
  cizimler.ZEMIN_KANCA = await zeminTonu(path.join(KOK, 'src/assets/cards', `${NEDEN_KART}.webp`));
  cizimler.IK_KANCA = await webpYaz(
    hedef,
    `varliklar/cizimler/kanca.webp`,
    path.join(KOK, 'src/assets/cards', `${NEDEN_KART}.webp`),
    520,
    390,
  );

  /** Ana sayfa govdesi; Ingilizcesi ayni parcalardan, kendi dosyasiyla. */
  /**
   * MINI DERS — kahramanda, sitenin icinde. Ana sayfada uygulamanin tek bir
   * ekrani yoktu; ziyaretci yontemi okuyordu ama yasamiyordu. Uc kart,
   * ardindan ilk kartin sorusu: "haa, hatirladim" ani sitede yasaniyor.
   * Ilk kart sunucuda cizili (sayfa betik olmadan da tam); gerisini
   * anasayfa.js.html suruyor.
   */
  const denemeKartlari = DENEME.map((id) => {
    const k = havuz.find((x) => x.en === id);
    if (!k) throw new Error(`mini ders kelimesi kanca havuzunda yok: ${id}`);
    return k;
  });
  const deneme = (dil) => {
    const m = DENEME_METIN[dil];
    const [ilk, ikinci, ucuncu] = denemeKartlari;
    const veri = {
      kartlar: denemeKartlari,
      secenekler: [ikinci.tr, ilk.tr, ilk.hook, ucuncu.tr],
      dogru: ilk.tr,
      m,
    };
    const noktalar = denemeKartlari
      .map((_, i) => `<span${i === 0 ? ' class="dolu"' : ''}></span>`)
      .join('') + '<span></span>';
    return `<div class="deneme" id="deneme" data-veri="${esc(JSON.stringify(veri))}">
      <span class="etiket">${m.etiket}</span>
      <div class="cerceve" id="deneme-ic">
        <div class="resim"><img src="${ilk.img}" alt="${esc(ilk.sentence)}" width="520" height="390"></div>
        <div class="govde">
          <div class="satir"><span class="en">${ilk.en}</span><span class="tr">${esc(ilk.tr)}</span><span class="kanca-rozet">${ilk.en} ≈ ${esc(ilk.hook)}</span></div>
          <p class="cumle">“${esc(ilk.sentence)}”</p>
          <div class="alt-satir"><div class="adim-nokta">${noktalar}</div><button class="btn btn-sari" type="button" data-ileri>${m.sonraki}</button></div>
        </div>
      </div>
    </div>`;
  };

  const anaSayfa = (dil) => {
    const en = dil === 'en';
    const yerine = {
      DENEME: deneme(dil),
      KISILER: kisiler(dil).join(''),
      KANCA_KARTLARI: havuz
        .slice(0, GORUNEN)
        .map((k) => `<article class="kanca-kart">${kartGovde(k)}</article>`)
        .join(''),
      SSS: en ? ingilizceye(sssHtml(SSS_EN)) : sssHtml(SSS),
      ILETISIM: en ? ingilizceye(iletisimBolum('Write to us')) : iletisimBolum('Bize yaz'),
      ...cizimler,
    };
    // Kaynaktaki bas yorum (bakim notu) ciktiya gitmesin.
    let govde = oku(en ? 'sayfalar/anasayfa.en.html' : 'sayfalar/anasayfa.html').replace(/^<!--[\s\S]*?-->\n/, '');
    for (const [k, d] of Object.entries(yerine)) govde = govde.split(`__${k}__`).join(d);
    return govde;
  };
  const anaGovde = anaSayfa('tr');
  const anaJs = oku('sayfalar/anasayfa.js.html').replace('__KANCA_HAVUZ__', JSON.stringify(havuz));
  // E-posta yedegi acikken form metinleri yok; denetim yalnizca formla.
  if (ILETISIM_HAZIR) {
    enParcaDenetle([oku('sayfalar/iletisim-bolum.html'), formHtml, formJs, anaJs, oku('sayfalar/sss.html')]);
  }

  // --- Kelimeler: gorseli olan kartlar (uygulamadaki set) ---
  const setKartlari = tumKartlar
    .filter((k) => fs.existsSync(path.join(KOK, 'src/assets/cards', `${k.id}.webp`)))
    .sort((a, b) => a.order - b.order);
  const kelimeler = VITRIN.map((id) => {
    const k = setKartlari.find((x) => x.id === id);
    if (!k) throw new Error(`vitrin kelimesinin gorseli yok: ${id}`);
    return k;
  });
  const yayinda = new Set(kelimeler.map((k) => k.id));
  const disarida = HAVUZ.filter((id) => !yayinda.has(id));
  if (disarida.length) throw new Error(`kanca havuzunda vitrin disi kelime: ${disarida.join(', ')}`);
  for (const k of kelimeler) {
    k.sayfaResmi = await webpYaz(
      hedef,
      `varliklar/kelimeler/${k.id}.webp`,
      path.join(KOK, 'src/assets/cards', `${k.id}.webp`),
      800,
      600,
    );
  }
  const kelimeKart = (k) =>
    `<a href="/kelime/${k.id}/"><span class="en">${k.en}</span><span class="tr">${esc(k.tr)}</span></a>`;

  const kelimeSayfalari = kelimeler.map((k, i) => {
    const En = enBuyuk(k.en);
    const benzer = [1, 2, 3, 4, 5, 6].map((d) => kelimeler[(i + d) % kelimeler.length]);
    const yol = `/kelime/${k.id}/`;
    return {
      yol,
      baslik: `${En} ne demek? Türkçe anlamı “${k.tr}” — Hafızada İngilizce`,
      aciklama: `${En} Türkçede “${k.tr}” demek. ${k.en} ≈ ${k.hook} kancasıyla akılda kalır: “${k.sentence}” Görselli ve sesli öğren.`,
      ogTur: 'article',
      icerik:
        altBaslik(`${En} ne demek?`, `${En}, Türkçede <b>${esc(k.tr)}</b> demek.`, [
          ['Kelimeler', '/kelimeler/'],
          [k.en, yol],
        ]) +
        `<section class="kelime">
  <div class="kap">
    <div class="gorsel"><img src="${k.sayfaResmi}" alt="${esc(k.sentence)}" width="800" height="600"></div>
    <div>
      <p class="anlam">${k.en} — anlamı<b>${esc(k.tr)}</b></p>
      <div class="kanca-kutu">
        <span class="kanca-rozet">${k.en} ≈ ${esc(k.hook)}</span>
        <p class="cumle">“${esc(k.sentence)}”</p>
      </div>
      <button class="btn btn-beyaz dinle" type="button" data-dinle="${k.en}">${HOPARLOR} Dinle</button>
      ${kelimeAciklama(k)}
      <div class="cagri">
        <p>${k.en} ve ${setKartlari.length - 1} kelime daha uygulamada kancası ve görseliyle seni bekliyor.</p>
        <a class="btn btn-lacivert" href="/ingilizce/?basla=1" data-basla>Hemen başla</a>
      </div>
    </div>
  </div>
</section>
<section class="benzerler">
  <div class="kap">
    <h2>Diğer kelimeler</h2>
    <div class="kelime-izgara">${benzer.map(kelimeKart).join('')}</div>
    <p style="margin-top:16px"><a href="/kelimeler/"><b>Bütün kelimeler →</b></a></p>
  </div>
</section>`,
      script: DINLE_JS,
      ld: jsonld(
        kirinti([['Ana sayfa', '/'], ['Kelimeler', '/kelimeler/'], [k.en, yol]]),
        {
          '@context': 'https://schema.org',
          '@type': 'DefinedTerm',
          name: k.en,
          description: `${k.tr} — ${k.en} ≈ ${k.hook}: ${k.sentence}`,
          url: `${ALAN}${yol}`,
          inLanguage: 'en',
          image: `${ALAN}${k.sayfaResmi}`,
          inDefinedTermSet: {
            '@type': 'DefinedTermSet',
            name: 'Hafızada İngilizce kelime listesi',
            url: `${ALAN}/kelimeler/`,
          },
        },
      ),
      resim: `${ALAN}${k.sayfaResmi}`,
    };
  });

  // A'dan Z'ye
  const harfGruplari = new Map();
  for (const k of [...kelimeler].sort((a, b) => a.en.localeCompare(b.en, 'en'))) {
    const h = k.en.charAt(0).toUpperCase();
    if (!harfGruplari.has(h)) harfGruplari.set(h, []);
    harfGruplari.get(h).push(k);
  }
  const kelimeListesi = {
    yol: '/kelimeler/',
    baslik: `En sık kullanılan ${kelimeler.length} İngilizce kelime ve Türkçe anlamları — Hafızada İngilizce`,
    aciklama: `En sık kullanılan ${kelimeler.length} İngilizce kelime: her birinin Türkçe anlamı, benzer sesli Türkçe kancası ve akılda kalan sahnesi.`,
    ogTur: 'website',
    icerik:
      altBaslik(
        'Kelimeler',
        `En sık kullanılan ${kelimeler.length} İngilizce kelime, Türkçe anlamı ve ses kancasıyla. Uygulamada ${setKartlari.length} kelimenin hepsi seni bekliyor.`,
        [['Kelimeler', '/kelimeler/']],
      ) +
      `<section class="benzerler">
  <div class="kap">
    <nav class="harfler" aria-label="Harfler">${[...harfGruplari.keys()].map((h) => `<a href="#harf-${h}">${h}</a>`).join('')}</nav>
${[...harfGruplari]
  .map(
    ([h, liste]) => `    <div class="harf-grup" id="harf-${h}">
      <h2>${h}</h2>
      <div class="kelime-izgara">${liste.map(kelimeKart).join('')}</div>
    </div>`,
  )
  .join('\n')}
  </div>
</section>`,
    script: '',
    ld: jsonld(kirinti([['Ana sayfa', '/'], ['Kelimeler', '/kelimeler/']])),
  };

  // --- Blog ---
  /*
    Yazilar kelime sayfalarina bagliyor; sayfasi olmayan kelimeye giden
    baglanti duz yaziya donuyor. Elle takip edilseydi vitrin degistikce
    kirik baglanti birikirdi.
  */
  const yazilar = blogYazilari().map((y) => ({
    ...y,
    govde: y.govde.replace(/<a href="\/kelime\/([^/"]+)\/">(.*?)<\/a>/g, (tam, id, ic) =>
      yayinda.has(id) ? tam : ic,
    ),
  }));
  const blogSayfalari = yazilar.map((y) => {
    const yol = `/blog/${y.kisa}/`;
    const digerleri = yazilar.filter((x) => x !== y).slice(0, 3);
    return {
      yol,
      baslik: `${y.baslik} — Hafızada İngilizce`,
      aciklama: y.aciklama,
      ogTur: 'article',
      icerik:
        altBaslik(y.baslik, null, [['Blog', '/blog/'], [y.baslik, yol]]) +
        `<div class="kap"><article class="metin">
<p class="ustbilgi">${new Date(y.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} · Hafızada İngilizce</p>
${y.govde}
<div class="cagri yazi-alt">
  <p>Kancaları ve görselleriyle ilk kelimelerini şimdi öğren. Ücretsiz.</p>
  <a class="btn btn-lacivert" href="/ingilizce/?basla=1" data-basla>Hemen başla</a>
</div>
<nav class="ilgili" aria-label="Diğer yazılar">
${digerleri.map((d) => `  <a href="/blog/${d.kisa}/">${d.baslik}</a>`).join('\n')}
</nav>
</article></div>`,
      script: '',
      ld: jsonld(kirinti([['Ana sayfa', '/'], ['Blog', '/blog/'], [y.baslik, yol]]), {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: y.baslik,
        description: y.aciklama,
        datePublished: y.tarih,
        dateModified: y.tarih,
        inLanguage: 'tr',
        mainEntityOfPage: `${ALAN}${yol}`,
        image: OG,
        author: { '@type': 'Organization', name: 'Hafızada İngilizce', url: `${ALAN}/` },
        publisher: KURULUS,
      }),
    };
  });
  const blogListesi = {
    yol: '/blog/',
    baslik: 'Blog — İngilizce kelime öğrenme yazıları | Hafızada İngilizce',
    aciklama:
      'İngilizce kelimeyi ezberlemeden öğrenmek: ses kancası, aralıklı tekrar, telaffuz ve günlük çalışma üzerine yazılar.',
    ogTur: 'website',
    icerik:
      altBaslik('Blog', 'Kelimeyi ezberlemeden öğrenmek üzerine kısa ve uygulanabilir yazılar.', [
        ['Blog', '/blog/'],
      ]) +
      `<div class="kap"><div class="blog-liste">
${yazilar
  .map(
    (y) => `  <a class="blog-kart" href="/blog/${y.kisa}/">
    <h2>${y.baslik}</h2>
    <p>${y.ozet}</p>
    <span class="devam">Oku →</span>
  </a>`,
  )
  .join('\n')}
</div></div>`,
    script: '',
    ld: jsonld(kirinti([['Ana sayfa', '/'], ['Blog', '/blog/']])),
  };

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
      yol: '/en/',
      dil: 'en',
      baslik: 'Hafızada İngilizce — Learn English words without memorizing',
      aciklama:
        'Link every English word to a similar-sounding Turkish word and a single image. No rote learning, no ads, free.',
      ogTur: 'website',
      icerik: anaSayfa('en'),
      script: ingilizceye(anaJs + formJs),
      ld: jsonld(
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Hafızada İngilizce',
          url: `${ALAN}/en/`,
          inLanguage: 'en',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: SSS_EN.map(([s, c]) => ({
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
    kelimeListesi,
    ...kelimeSayfalari,
    blogListesi,
    ...blogSayfalari,
  ];

  /**
   * Kabugun dile bagli yerleri. Ingilizcesi yalnizca ana sayfada var: diger
   * Turkce sayfalarda EN, Ingilizce ana sayfaya gidiyor ve hreflang yok
   * (karsiligi olmayan sayfaya alternatif bildirmek Google'i yaniltir).
   */
  const dilYerleri = (dil, yol) => {
    const en = dil === 'en';
    const anaMi = yol === '/' || yol === '/en/';
    const yerine = {
      DIL: dil,
      OG_LOCALE: en ? 'en_US' : 'tr_TR',
      HREFLANG: anaMi ? HREFLANG : '',
      DIL_SECICI: dilSecici(dil, en ? '/' : yol, '/en/'),
      MENU: menuHtml(en ? MENU_EN : MENU, '      '),
      OGREN_MENU: menuHtml(en ? OGREN_EN : OGREN, '      '),
      YIL: String(new Date().getFullYear()),
    };
    for (const [k, d] of Object.entries(KABUK[dil])) yerine[`K_${k}`] = d;
    return yerine;
  };

  for (const s of sayfalar) {
    let html = kabuk;
    const yerine = {
      BASLIK: esc(s.baslik),
      ACIKLAMA: esc(s.aciklama),
      KANONIK: `${ALAN}${s.yol}`,
      OG_TUR: s.ogTur,
      OG_RESIM: s.resim ?? OG,
      SURUM: surum,
      JSONLD: s.ld,
      ICERIK: s.icerik,
      SCRIPT: s.script,
      ...dilYerleri(s.dil ?? 'tr', s.yol),
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
    ...dilYerleri('tr', '/'),
    // 404'te dil secici ana sayfalara gitsin, hreflang olmasin.
    HREFLANG: '',
    ICERIK:
      altBaslik('Sayfa bulunamadı', 'Aradığın sayfa taşınmış ya da hiç olmamış olabilir.', []) +
      '<div class="kap"><div class="metin"><p><a href="/">Ana sayfaya dön</a> ya da <a href="/ingilizce/?basla=1">hemen öğrenmeye başla</a>.</p></div></div>',
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
    `${hedef} — ${sayfalar.length} sayfa (${kelimeSayfalari.length} kelime, ${blogSayfalari.length} yazı) + 404, iletişim formu ${ILETISIM_HAZIR ? 'AÇIK' : 'kapalı (e-posta bağlantısı)'}`,
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
