// Kelime sesleri icin parti plani (20 Ekim 2026, Asama 5).
//   node tools/ses/ses-plan.mjs [parti-boyu]  → tools/ses/ses-plan.json
//
// Her kelimenin tek basina TTS'i 2 kredi ve ~800 cagri. Bunun yerine
// kelimeler noktayla ayrilip partiler halinde okutuluyor ("accept. advice.
// attend."), Magnific'in kelime zamanlamalariyla (audio_timing_get) tek tek
// kesiliyor: kredi ayni, cagri ~20 kat az. Kesme: tools/ses/ses-bol.mjs.
//
// Ses: Lexi Parker (id 154, kadin, egitim icin), eleven_v3 (KARARLAR 9).
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '../..');
const PARTI = Number(process.argv[2] ?? 60);
const genel = JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8'));
const lgs = JSON.parse(fs.readFileSync(path.join(KOK, 'content/lgs.json'), 'utf8')).kartlar;

const hazir = new Set(
  fs.existsSync(path.join(KOK, 'public/ses/k'))
    ? fs.readdirSync(path.join(KOK, 'public/ses/k')).map((f) => f.replace(/\.mp3$/, ''))
    : [],
);
const gorulen = new Set();
const ogeler = [];
for (const k of [...lgs, ...genel]) {
  if (gorulen.has(k.id) || hazir.has(k.id)) continue;
  gorulen.add(k.id);
  ogeler.push({ id: k.id, en: k.en });
}
const partiler = [];
for (let i = 0; i < ogeler.length; i += PARTI) {
  const p = ogeler.slice(i, i + PARTI);
  partiler.push({ no: partiler.length + 1, ogeler: p, metin: p.map((o) => `${o.en}.`).join(' ') });
}
fs.writeFileSync(path.join(KOK, 'tools/ses/ses-plan.json'), JSON.stringify(partiler, null, 1));
const harf = partiler.reduce((n, p) => n + p.metin.length, 0);
console.log(`${ogeler.length} kelime, ${partiler.length} parti, ${harf} harf (~${Math.ceil(harf * 0.2)} kredi)`);
