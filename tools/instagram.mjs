// Instagram paylasimlarini uretir: kaydirmali gonderi sayfalari (1080x1350
// PNG) ve Reels videolari (1080x1920 MP4).
//
//   node tools/instagram.mjs                 -> tools/instagram-icerik.json'daki hepsi
//   node tools/instagram.mjs h1-yanlis       -> yalnizca bir paylasim
//
// Cikti: instagram/cikti/<id>/ (depoda degil; instagram/ gitignore'da).
// Her klasorde: 01.png, 02.png... (gonderi), reels.mp4 (varsa), aciklama.txt.
//
// YENI GORSEL URETMEZ. Kart gorselleri src/assets/cards/'tan, yazilar marka
// yazi tipiyle (Nunito) basiliyor. Sayfalar HTML olarak kurulup Chrome'un
// basliksiz kipiyle fotografi cekiliyor: sunucuda yazi tipi yok, SVG'ye
// yazi basmak markayi bozuyordu (bkz. site.mjs, paylasim gorseli).
//
// Kanca Reels'inde kelimenin okunusu Windows'un Ingilizce sesiyle (Zira)
// uretiliyor. Muzik eklenmiyor: Instagram'da uygulama icinden populer bir
// ses eklemek erisimi artiriyor, o adim telefonda.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '..');
const CIKTI = path.join(KOK, 'instagram/cikti');
const GECICI = path.join(CIKTI, '_gecici');
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const icerik = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/instagram-icerik.json'), 'utf8'));
const kartlar = (() => {
  const ham = JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8'));
  return new Map((ham.cards ?? ham).map((k) => [k.id, k]));
})();

const url = (p) => pathToFileURL(p).href;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Marka: sitenin ve uygulamanin renkleri. */
const STIL = `
@font-face { font-family: 'Nunito'; font-weight: 400 900; src: url('${url(path.join(KOK, 'public/fonts/nunito-latin.woff2'))}') format('woff2'); unicode-range: U+0000-00FF, U+2000-206F, U+2190-21FF, U+2248, U+2713, U+2717; }
@font-face { font-family: 'Nunito'; font-weight: 400 900; src: url('${url(path.join(KOK, 'public/fonts/nunito-latin-ext.woff2'))}') format('woff2'); unicode-range: U+0100-024F, U+1E00-1EFF; }
* { box-sizing: border-box; margin: 0; }
html, body { width: var(--g); height: var(--y); overflow: hidden; }
body { background: #fffaf0; color: #16233a; font-family: 'Nunito', sans-serif; display: flex; flex-direction: column; padding: var(--kenar); }
.ust { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 30px; color: #5f6b80; }
.marka { display: flex; align-items: center; gap: 12px; color: #16233a; }
.marka img { width: 52px; height: 52px; }
.sayfa { font-variant-numeric: tabular-nums; }
.orta { flex: 1; display: flex; flex-direction: column; justify-content: center; }
.alt { display: flex; justify-content: space-between; align-items: center; font-weight: 800; font-size: 30px; color: #5f6b80; }
.etiket { display: inline-block; background: #16233a; color: #ffc000; font-weight: 900; font-size: 30px; letter-spacing: .12em; text-transform: uppercase; padding: 12px 26px; border-radius: 999px; align-self: flex-start; }
h1 { font-size: 118px; line-height: 1.02; font-weight: 900; letter-spacing: -.02em; margin-top: 34px; }
h1 .vurgu { background: linear-gradient(transparent 62%, #ffc000 62%, #ffc000 92%, transparent 92%); }
.altbaslik { font-size: 44px; line-height: 1.3; color: #5f6b80; font-weight: 700; margin-top: 30px; }
.kutu { background: #fff; border: 5px solid #16233a; border-radius: 40px; box-shadow: 0 10px 0 #16233a; padding: 56px 56px; }
.yanlis { display: flex; align-items: center; gap: 24px; font-size: 62px; font-weight: 800; color: #9aa4b5; text-decoration: line-through; text-decoration-thickness: 6px; text-decoration-color: #e0457b; }
.dogru { display: flex; align-items: center; gap: 24px; font-size: 76px; font-weight: 900; margin-top: 34px; }
.isaret { flex: none; width: 76px; height: 76px; border-radius: 50%; display: grid; place-items: center; font-size: 46px; font-weight: 900; text-decoration: none; display: inline-grid; }
.isaret.x { background: #fbe0ea; color: #e0457b; font-size: 64px; line-height: 1; }
.isaret.v { background: #3ecf9a; color: #fff; }
.not { font-size: 40px; line-height: 1.35; color: #5f6b80; font-weight: 700; margin-top: 40px; border-top: 4px dashed #ece6d8; padding-top: 34px; }
.ifade-en { font-size: 88px; line-height: 1.08; font-weight: 900; }
.ifade-tr { font-size: 50px; color: #5f6b80; font-weight: 700; margin-top: 26px; }
.ifade-ornek { font-size: 40px; line-height: 1.35; font-weight: 700; margin-top: 44px; background: #fff3da; border-radius: 26px; padding: 28px 34px; }
.kart-resim { border: 5px solid #16233a; border-radius: 40px; overflow: hidden; background: #fff3da; aspect-ratio: 4/3; box-shadow: 0 10px 0 #16233a; }
.kart-resim img { width: 100%; height: 100%; object-fit: cover; display: block; }
.kart-satir { display: flex; align-items: center; flex-wrap: wrap; gap: 22px; margin-top: 44px; }
.kart-en { font-size: 96px; font-weight: 900; line-height: 1; }
.kart-tr { font-size: 52px; font-weight: 700; color: #5f6b80; }
.rozet { background: #ffc000; border: 5px solid #16233a; border-radius: 999px; padding: 10px 30px; font-size: 48px; font-weight: 900; }
.cumle { font-size: 44px; color: #5f6b80; font-weight: 600; margin-top: 26px; line-height: 1.3; }
.son h1 { font-size: 92px; }
.son .cta { margin-top: 56px; display: inline-flex; align-self: flex-start; background: #ffc000; border: 5px solid #16233a; border-radius: 30px; box-shadow: 0 10px 0 #16233a; padding: 28px 44px; font-size: 48px; font-weight: 900; }
.reels-merkez { text-align: center; align-items: center; }
.reels-merkez .etiket { align-self: center; }
.dev { font-size: 230px; font-weight: 900; line-height: 1; letter-spacing: -.03em; }
.dev-alt { font-size: 60px; font-weight: 800; color: #5f6b80; margin-top: 40px; }
.esit { font-size: 150px; font-weight: 900; line-height: 1.05; }
.esit .rozet { font-size: 130px; padding: 10px 56px; border-width: 8px; }
`;

function kabuk(govde, g, y, { sayfa, toplam, kenar = 84 } = {}) {
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>:root{--g:${g}px;--y:${y}px;--kenar:${kenar}px}${STIL}</style></head><body>
<div class="ust"><span class="marka"><img src="${url(path.join(KOK, 'brand/logo-isaret.svg'))}" alt="">Hafızada İngilizce</span>${
    sayfa ? `<span class="sayfa">${sayfa} / ${toplam}</span>` : ''
  }</div>
<div class="orta">${govde}</div>
<div class="alt"><span>@hafizadaingilizce</span><span>hafizada.com</span></div>
</body></html>`;
}

function kart(id) {
  const k = kartlar.get(id);
  if (!k) throw new Error(`kart yok: ${id}`);
  const resim = path.join(KOK, 'src/assets/cards', `${id}.webp`);
  if (!fs.existsSync(resim)) throw new Error(`kart gorseli yok: ${id}`);
  return { ...k, resim: url(resim) };
}

/** Bir sayfanin govdesi. */
function sayfaGovde(s) {
  switch (s.tip) {
    case 'kapak':
      return `${s.ust ? `<span class="etiket">${esc(s.ust)}</span>` : ''}
        <h1>${s.baslik}</h1>${s.alt ? `<p class="altbaslik">${esc(s.alt)}</p>` : ''}`;
    case 'hata':
      return `<div class="kutu">
        <div class="yanlis"><span class="isaret x">×</span><span>${esc(s.yanlis)}</span></div>
        <div class="dogru"><span class="isaret v">✓</span><span>${esc(s.dogru)}</span></div>
        ${s.not ? `<p class="not">${esc(s.not)}</p>` : ''}
      </div>`;
    case 'ifade':
      return `<div class="kutu">
        <p class="ifade-en">${esc(s.en)}</p>
        <p class="ifade-tr">${esc(s.tr)}</p>
        ${s.ornek ? `<p class="ifade-ornek">${esc(s.ornek)}</p>` : ''}
      </div>`;
    case 'kanca': {
      const k = kart(s.kart);
      return `<div class="kart-resim"><img src="${k.resim}" alt=""></div>
        <div class="kart-satir"><span class="kart-en">${esc(k.en)}</span><span class="kart-tr">${esc(k.tr)}</span><span class="rozet">${esc(k.en)} ≈ ${esc(k.hook)}</span></div>
        <p class="cumle">“${esc(k.sentence)}”</p>`;
    }
    case 'son':
      return `<div class="son"><h1>${s.baslik}</h1>${s.alt ? `<p class="altbaslik">${esc(s.alt)}</p>` : ''}
        <span class="cta">${esc(s.cta ?? 'hafizada.com')}</span></div>`;
    default:
      throw new Error(`bilinmeyen sayfa tipi: ${s.tip}`);
  }
}

let sayac = 0;
/** HTML'yi Chrome'la PNG'ye cevirir; olcu tutmuyorsa durur. */
async function ciz(html, g, y, cikti) {
  fs.mkdirSync(GECICI, { recursive: true });
  const dosya = path.join(GECICI, `s${++sayac}.html`);
  fs.writeFileSync(dosya, html);
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--allow-file-access-from-files',
      '--virtual-time-budget=3000',
      `--window-size=${g},${y}`,
      `--screenshot=${cikti}`,
      url(dosya),
    ],
    { stdio: 'ignore' },
  );
  const { width, height } = await sharp(cikti).metadata();
  if (width !== g || height !== y) throw new Error(`${cikti}: ${width}x${height}, beklenen ${g}x${y}`);
}

/** Kelimenin okunusu — Windows'un Ingilizce sesi. */
function seslendir(kelime, cikti) {
  const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
    `$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'en-*' } | Select-Object -First 1; ` +
    `if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }; $s.Rate = -2; $s.SetOutputToWaveFile('${cikti.replace(/'/g, "''")}'); ` +
    `$s.Speak('${kelime.replace(/'/g, "''")}'); $s.Dispose()`;
  execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
}

/** Kareleri sureleriyle videoya dizer; sesler `[dosya, saniye]`. */
function videoYap(kareler, sesler, cikti) {
  const liste = path.join(GECICI, `liste${++sayac}.txt`);
  const satirlar = kareler.flatMap(([png, sn]) => [`file '${png.replace(/\\/g, '/')}'`, `duration ${sn}`]);
  // concat demuxer son karenin suresini yok sayiyor; son kare bir daha
  satirlar.push(`file '${kareler.at(-1)[0].replace(/\\/g, '/')}'`);
  fs.writeFileSync(liste, satirlar.join('\n'));
  const toplam = kareler.reduce((n, [, sn]) => n + sn, 0);

  const girdiler = ['-f', 'concat', '-safe', '0', '-i', liste, '-f', 'lavfi', '-t', String(toplam), '-i', 'anullsrc=r=44100:cl=stereo'];
  for (const [wav] of sesler) girdiler.push('-i', wav);
  const filtre = sesler.length
    ? sesler.map(([, sn], i) => `[${i + 2}:a]adelay=${Math.round(sn * 1000)}|${Math.round(sn * 1000)},volume=1.6[s${i}]`).join(';') +
      `;[1:a]${sesler.map((_, i) => `[s${i}]`).join('')}amix=inputs=${sesler.length + 1}:duration=first:normalize=0[ses]`
    : '[1:a]anull[ses]';
  execFileSync(
    'ffmpeg',
    [
      '-y', ...girdiler,
      '-filter_complex', `[0:v]fps=30,format=yuv420p[v];${filtre}`,
      '-map', '[v]', '-map', '[ses]',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '128k',
      '-t', String(toplam), '-movflags', '+faststart', cikti,
    ],
    { stdio: 'ignore' },
  );
}

/** Kanca Reels'i: kelime -> kanca -> sahne -> anlam. */
async function kancaReels(id, klasor) {
  const k = kart(id);
  const G = 1080, Y = 1920;
  const kareler = [
    [`<div class="reels-merkez orta"><span class="etiket">Ne demek?</span><p class="dev" style="margin-top:60px">${esc(k.en)}</p></div>`, 1.8],
    [`<div class="reels-merkez orta"><p class="esit">${esc(k.en)}<br>≈<br><span class="rozet">${esc(k.hook)}</span></p></div>`, 1.8],
    [`<div class="kart-resim"><img src="${k.resim}" alt=""></div><p class="cumle" style="font-size:64px;text-align:center;margin-top:60px">“${esc(k.sentence)}”</p>`, 3],
    [`<div class="reels-merkez orta"><p class="dev" style="font-size:150px">${esc(k.en)}</p><p class="dev-alt" style="font-size:96px;color:#16233a;font-weight:900">= ${esc(k.tr)}</p><p class="dev-alt">Ezberleme. Bağla.</p></div>`, 2.6],
  ];
  const pngler = [];
  for (const [i, [govde, sn]] of kareler.entries()) {
    const png = path.join(GECICI, `${id}-reels-${i}.png`);
    await ciz(kabuk(govde, G, Y, { kenar: 96 }).replace('<div class="orta">', '<div class="orta" style="padding-block:180px 260px">'), G, Y, png);
    pngler.push([png, sn]);
  }
  const wav = path.join(GECICI, `${id}.wav`);
  seslendir(k.en, wav);
  const anlamAni = kareler.slice(0, 3).reduce((n, [, sn]) => n + sn, 0);
  videoYap(pngler, [[wav, 0.25], [wav, anlamAni + 0.2]], path.join(klasor, 'reels.mp4'));
}

async function uret(p) {
  const klasor = path.join(CIKTI, p.id);
  fs.rmSync(klasor, { recursive: true, force: true });
  fs.mkdirSync(klasor, { recursive: true });

  if (p.sayfalar?.length) {
    const toplam = p.sayfalar.length;
    for (const [i, s] of p.sayfalar.entries()) {
      const html = kabuk(sayfaGovde(s), 1080, 1350, { sayfa: i + 1, toplam });
      await ciz(html, 1080, 1350, path.join(klasor, `${String(i + 1).padStart(2, '0')}.png`));
    }
  }
  // Sayfalardan Reels: ayni sayfalar dikey, her biri birkac saniye
  if (p.reels === 'sayfalar') {
    const kareler = [];
    for (const [i, s] of p.sayfalar.entries()) {
      const png = path.join(GECICI, `${p.id}-dikey-${i}.png`);
      const html = kabuk(sayfaGovde(s), 1080, 1920).replace('<div class="orta">', '<div class="orta" style="padding-block:120px 220px">');
      await ciz(html, 1080, 1920, png);
      kareler.push([png, s.tip === 'kapak' ? 2.2 : s.tip === 'son' ? 2.5 : 3.2]);
    }
    videoYap(kareler, [], path.join(klasor, 'reels.mp4'));
  }
  if (p.reels === 'kanca') await kancaReels(p.kart, klasor);

  fs.writeFileSync(path.join(klasor, 'aciklama.txt'), `${p.aciklama.trim()}\n\n${(p.etiketler ?? icerik.etiketler).join(' ')}\n`);
  console.log('✓', p.id);
}

const secilen = process.argv[2];
const liste = secilen ? icerik.gonderiler.filter((p) => p.id === secilen) : icerik.gonderiler;
if (!liste.length) throw new Error(`paylasim yok: ${secilen}`);
for (const p of liste) await uret(p);
fs.rmSync(GECICI, { recursive: true, force: true });
