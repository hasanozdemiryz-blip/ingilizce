// Kelime sayfasi secimi icin Turkiye'deki arama talebi sinyali (19 Ekim 2026).
//
// Google Ads hesabi yok (Anahtar Kelime Planlayici gercek sayiyi veriyor).
// Yerine Google'in Turkiye otomatik tamamlamasi: "<kelime> " ve "<kelime> ne"
// yazilinca Turkce anlam arayan oneri ("ne demek", "anlami", "turkcesi"...)
// ne kadar ustte ve kac tane. Sayi degil, siralama sinyali.
//
//   node tools/arama-sinyal.mjs          → tools/arama-sinyal.json
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '..');
const CIKTI = path.join(KOK, 'tools/arama-sinyal.json');
const kartlar = JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8'));
const NIYET = /ne demek|anlam|türkçe|turkce|okunuş|okunus|nedir|ne anlama/;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function oneriler(q) {
  const u = `https://suggestqueries.google.com/complete/search?client=firefox&hl=tr&gl=tr&ie=utf-8&oe=utf-8&q=${encodeURIComponent(q)}`;
  for (let deneme = 0; deneme < 3; deneme++) {
    try {
      const c = await fetch(u, { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (c.ok) return (await c.json())[1] ?? [];
    } catch {}
    await bekle(2000);
  }
  return null;
}

const onceki = fs.existsSync(CIKTI) ? JSON.parse(fs.readFileSync(CIKTI, 'utf8')) : {};
const sonuc = { ...onceki };
for (const k of kartlar) {
  if (sonuc[k.id]) continue;
  const yalin = await oneriler(`${k.en} `);
  await bekle(250);
  const ne = await oneriler(`${k.en} ne`);
  await bekle(250);
  if (!yalin || !ne) { console.log('atlandi', k.id); continue; }
  const sira = yalin.findIndex((s) => NIYET.test(s.toLowerCase()));
  const derin = ne.filter((s) => NIYET.test(s.toLowerCase()) && s.toLowerCase().startsWith(k.en.toLowerCase())).length;
  // Puan: yalin aramada Turkce niyet ne kadar ustte (0-10) + "ne" ile kac uzun kuyruk (0-10).
  const puan = (sira < 0 ? 0 : 10 - sira) + derin;
  sonuc[k.id] = { puan, sira, derin, yalin: yalin.slice(0, 5), ne: ne.slice(0, 5) };
  fs.writeFileSync(CIKTI, JSON.stringify(sonuc, null, 1));
}
const sirali = Object.entries(sonuc).sort((a, b) => b[1].puan - a[1].puan);
console.log(`${sirali.length} kelime; ilk 30:`, sirali.slice(0, 30).map(([id, s]) => `${id}(${s.puan})`).join(', '));
