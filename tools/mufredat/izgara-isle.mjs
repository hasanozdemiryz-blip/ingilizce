// Uretilen bir izgarayi indirir, kartlara boler, kayda yazar.
//   node tools/mufredat/izgara-isle.mjs <izgara-no> <creation-id> <url> [atla-id ...]
// Genel kartlari gorseller/<id>.png, LGS kartlari gorseller/lgs/<id>.png.
// "atla" verilen id'ler yazilmaz (kusurlu; sonraki izgarada yeniden).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const KOK = path.resolve(import.meta.dirname, '../..');
const [, , noS, creation, url, ...atla] = process.argv;
const plan = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/mufredat/izgara-plan.json'), 'utf8'));
const g = plan.find((x) => x.no === Number(noS));
if (!g) throw new Error(`izgara yok: ${noS}`);
const ham = path.join(KOK, 'gorseller/izgara');
fs.mkdirSync(ham, { recursive: true });
const dosya = path.join(ham, `izgara-${String(g.no).padStart(3, '0')}.png`);
const c = await fetch(url);
if (!c.ok) throw new Error(`indirilemedi: ${c.status}`);
fs.writeFileSync(dosya, Buffer.from(await c.arrayBuffer()));

const ids = [0, 1, 2, 3].map((i) => (g.ids[i] && !atla.includes(g.ids[i]) ? g.ids[i] : '-'));
// Genel ve LGS ayri klasorlerde: iki gecis.
for (const [klasor, genelMi] of [['gorseller', true], ['gorseller/lgs', false]]) {
  const secili = ids.map((id, i) => (id !== '-' && !!g.genel[i] === genelMi ? id : '-'));
  if (secili.every((x) => x === '-')) continue;
  execFileSync('node', [path.join(KOK, 'tools/izgara-bol.mjs'), dosya, ...secili, klasor], { stdio: 'inherit' });
}
fs.appendFileSync(
  path.join(KOK, 'tools/mufredat/gorsel-log.txt'),
  `${new Date().toISOString().slice(0, 16)}|izgara ${g.no}|${creation}|${g.ids.join(',')}|atlanan:${atla.join(',')}\n`,
);
