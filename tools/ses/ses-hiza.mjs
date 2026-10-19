// Kesilen kelime seslerinin hizasini denetler (20 Ekim 2026).
//   node tools/ses/ses-hiza.mjs [plan.json]
// Dogru hizada dosya suresi ile kelimenin harf sayisi belirgin bicimde
// iliskili (Pearson r). Bir kelimelik kayma bu iliskiyi cokertir: ayni
// partiyi bir sola/saga kaydirinca r'nin dustugunu de gosteriyoruz.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const KOK = path.resolve(import.meta.dirname, '../..');
const planDosya = process.argv[2] ?? 'tools/ses/ses-plan.json';
const plan = JSON.parse(fs.readFileSync(path.join(KOK, planDosya), 'utf8'));
const sureOf = (id) => {
  const d = path.join(KOK, planDosya.includes('diyalog') ? 'public/ses/d' : 'public/ses/k', `${id}.mp3`);
  if (!fs.existsSync(d)) return null;
  return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', d]).toString());
};
const r = (x, y) => {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let s = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) {
    s += (x[i] - mx) * (y[i] - my);
    sx += (x[i] - mx) ** 2;
    sy += (y[i] - my) ** 2;
  }
  return s / Math.sqrt(sx * sy);
};
for (const p of plan) {
  const sureler = p.ogeler.map((o) => sureOf(o.id));
  if (sureler.some((s) => s === null)) continue;
  const harf = p.ogeler.map((o) => o.en.replace(/[^a-z]/gi, '').length);
  const dogru = r(harf, sureler);
  const kayik = r(harf.slice(1), sureler.slice(0, -1));
  console.log(`parti ${p.no}: r=${dogru.toFixed(2)} (bir kaydirilmis: ${kayik.toFixed(2)})${dogru < 0.5 ? '  << KONTROL' : ''}`);
}
