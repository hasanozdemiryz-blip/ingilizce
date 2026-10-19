// Parti sesini kelime kelime keser (20 Ekim 2026, Asama 5).
//   node tools/ses/ses-bol.mjs <parti-no> <creation-id> <mp3-url> [plan.json]
//
// Parti metni "accept. advice. back up." — TTS her noktadan sonra ~1 sn
// duruyor. Ses bu UZUN SESSIZLIKLERDEN bolunuyor; konusma parcasi sayisi
// partideki kelime sayisini BIREBIR tutmazsa hic kesilmiyor (yanlis dosyaya
// yanlis kelime gitmesin). Cok kelimeli kaliplarin (back up, bed and
// breakfast) icindeki kisa duraklar esigin altinda kaliyor.
//
// Magnific'in kelime zamanlamalari (audio_timing_get) KULLANILMIYOR: ilk
// partilerde sese gore ~1,4 sn kaymisti (20 Ekim).
//
// Cikti public/ses/k/<kart-id>.mp3 (mono, 48 kbps, basta 50 ms, sonda 80 ms pay).
// Diyalog plani (tools/ses/diyalog-plan.json) verilirse: public/ses/d/, satirlar
// arasinda [pause 2s] oldugu icin sessizlik esigi uzun (cumle ici duraklar bolunmesin).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';

const KOK = path.resolve(import.meta.dirname, '../..');
const [, , noS, creation, url, planDosya = 'tools/ses/ses-plan.json'] = process.argv;
const plan = JSON.parse(fs.readFileSync(path.join(KOK, planDosya), 'utf8'));
const parti = plan.find((p) => p.no === Number(noS));
if (!parti) throw new Error(`parti yok: ${noS}`);
const N = parti.ogeler.length;

const HAM = path.join(KOK, 'gorseller/ses-ham');
fs.mkdirSync(HAM, { recursive: true });
const diyalog = planDosya.includes('diyalog');
const onek = planDosya.includes('ses-plan-01') ? 'deneme' : diyalog ? 'diyalog' : 'parti';
const ESIKLER = diyalog ? [1.2, 1.0, 1.4, 0.9, 1.6, 0.8, 0.6, 0.5] : [0.4, 0.35, 0.45, 0.3, 0.5, 0.6, 0.25, 0.7];
const ham = path.join(HAM, `${onek}-${String(parti.no).padStart(2, '0')}.mp3`);
if (!fs.existsSync(ham)) execFileSync('curl', ['-sSf', '--max-time', '300', '--retry', '3', '-o', ham, url]);

const sure = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', ham]).toString());

/** Verilen en kisa sessizlikle konusma parcalari: [[bas, son], ...] */
function parcalar(enKisa) {
  const r = spawnSync('ffmpeg', ['-v', 'info', '-i', ham, '-af', `silencedetect=noise=-40dB:d=${enKisa}`, '-f', 'null', '-'], {
    encoding: 'utf8',
  });
  const sessiz = [...r.stderr.matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_end: ([\d.]+)/g)].map((m) => [
    Number(m[1]),
    Number(m[2]),
  ]);
  // Sonda bitmeyen sessizlik (silence_end yok)
  const sonBas = [...r.stderr.matchAll(/silence_start: ([\d.]+)/g)].map((m) => Number(m[1]));
  if (sonBas.length > sessiz.length) sessiz.push([sonBas[sonBas.length - 1], sure]);
  const cikti = [];
  let imlec = 0;
  for (const [b, e] of sessiz) {
    if (b - imlec > 0.05) cikti.push([imlec, b]);
    imlec = e;
  }
  if (sure - imlec > 0.05) cikti.push([imlec, sure]);
  // Nefes / tiklama: tepe duzeyi kelimelerin cok altinda (~-37 dB'e karsi ~-1 dB)
  return cikti.filter(([b, e]) => tepe(b, e) > -20);
}

const tepeOnbellek = new Map();
function tepe(b, e) {
  const anahtar = `${b}-${e}`;
  if (!tepeOnbellek.has(anahtar)) {
    const r = spawnSync('ffmpeg', ['-v', 'info', '-ss', b.toFixed(3), '-to', e.toFixed(3), '-i', ham, '-af', 'astats', '-f', 'null', '-'], {
      encoding: 'utf8',
    });
    const m = [...r.stderr.matchAll(/Peak level dB: (-?[\d.]+|-inf)/g)].pop();
    tepeOnbellek.set(anahtar, m && m[1] !== '-inf' ? Number(m[1]) : -120);
  }
  return tepeOnbellek.get(anahtar);
}

let secilen = null;
for (const d of ESIKLER) {
  const p = parcalar(d);
  if (p.length === N) {
    secilen = { d, p };
    break;
  }
}
/*
  Bir iki fazla parca: cok kelimeli bir kalibin icindeki duraklama esigi
  asmis ("go for a walk"). En kisa aralikli komsular birlestirilir; en
  fazla 3 — daha fazlasi baska bir sorunun isareti.
*/
if (!secilen) {
  const p = parcalar(ESIKLER[0]);
  if (p.length > N && p.length - N <= 3) {
    while (p.length > N) {
      let enKisa = 0;
      for (let i = 1; i < p.length - 1; i++) if (p[i + 1][0] - p[i][1] < p[enKisa + 1][0] - p[enKisa][1]) enKisa = i;
      p.splice(enKisa, 2, [p[enKisa][0], p[enKisa + 1][1]]);
    }
    secilen = { d: `${ESIKLER[0]}+birlestirme`, p };
  }
}
if (!secilen) {
  const ornek = [0.3, 0.4, 0.5].map((d) => `${d}s→${parcalar(d).length}`).join(', ');
  throw new Error(`parti ${noS}: ${N} kelime, parca sayisi tutmadi (${ornek}); elle bakilmali`);
}

const HEDEF = path.join(KOK, diyalog ? 'public/ses/d' : 'public/ses/k');
fs.mkdirSync(HEDEF, { recursive: true });
/*
  Bas ve sondaki nefes/kisik ses (-35 dB alti) kirpilir; kelimenin kendisi
  ~-1 dB tepeyle cok yukarida. Sonra 50/80 ms sessiz pay.
*/
const KIRP =
  'silenceremove=start_periods=1:start_threshold=-35dB:start_silence=0.04,' +
  'areverse,silenceremove=start_periods=1:start_threshold=-35dB:start_silence=0.06,areverse,' +
  'adelay=50:all=1,apad=pad_dur=0.08';
const sureler = [];
parti.ogeler.forEach((o, i) => {
  const [b, e] = secilen.p[i];
  const cikti = path.join(HEDEF, `${o.id}.mp3`);
  execFileSync('ffmpeg', [
    '-v', 'error', '-y',
    '-ss', Math.max(0, b - 0.05).toFixed(3), '-to', Math.min(sure, e + 0.08).toFixed(3),
    '-i', ham, '-af', KIRP, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', cikti,
  ]);
  sureler.push([o.id, e - b]);
});

// Kelime uzunlugu ile parca uzunlugu kabaca orantili olmali: cok kisa bir
// kelimenin uzun parcaya (ya da tersi) dusmesi kaymanin isareti.
const harf = parti.ogeler.map((o) => o.en.length);
const oran = sureler.map(([, s], i) => s / harf[i]);
const ortalama = oran.reduce((a, b) => a + b, 0) / oran.length;
const supheli = sureler.filter((_, i) => oran[i] > ortalama * 3 || oran[i] < ortalama / 3);
fs.appendFileSync(
  path.join(KOK, 'tools/ses/ses-log.txt'),
  `${new Date().toISOString().slice(0, 16)}|${onek} ${parti.no}|${creation}|${N} kelime|esik ${secilen.d}s|supheli:${supheli.map(([id]) => id).join(',')}\n`,
);
console.log(
  `${onek} ${parti.no}: ${N} dosya (sessizlik esigi ${secilen.d} sn); parca ${Math.min(...sureler.map((x) => x[1])).toFixed(2)}–${Math.max(...sureler.map((x) => x[1])).toFixed(2)} sn`,
);
if (supheli.length) console.log('SUPHELI:', supheli.map(([id, s]) => `${id}=${s.toFixed(2)}`).join(' '));
