// LGS havuz eki (19 Ekim 2026, PLAN v2 C): tools/mufredat/lgs-ek/uNN.txt ve v.txt'i
// mevcut duzene dagitir. Tekrar calistirilabilir: her dosyada "# --- EK" isaretinden
// sonrasi silinip yeniden yazilir.
//   node tools/mufredat/lgs-ek.mjs   → sonra lgs-kart.mjs, lgs-icerik.mjs
//
// uNN.txt satiri: en|tr|tur|kanca|yol|cumle|sahne|ton|genel|ornekEN|ornekTR
//   → lgs8-etiket.txt (unite|en|tr|R ya da I), lgs-kart/uNN.txt (ilk 9 alan),
//     lgs-ornek/uNN.txt (en|ornekEN|ornekTR)
// v.txt satiri: unite|en — Genel'de zaten kart olan kelime (V), uniteye baglanir.
// Kaynak: tools/mufredat/lgs-havuz/ (analiz), kurallar tools/kanca-kurallari.md.
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '../..');
const M = path.join(KOK, 'tools/mufredat');
const EK = path.join(M, 'lgs-ek');
const ISARET = '# --- EK 19 Ekim 2026 (lgs-ek.mjs uretir, elle duzenleme: tools/mufredat/lgs-ek/) ---';
const satirlar = (d) => fs.readFileSync(d, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));

/** Dosyanin isaretten onceki kismi + isaret + yeni satirlar. */
function yaz(dosya, yeni) {
  const eski = fs.existsSync(dosya) ? fs.readFileSync(dosya, 'utf8') : '';
  const i = eski.indexOf(ISARET);
  const govde = (i >= 0 ? eski.slice(0, i) : eski).replace(/\s*$/, '\n');
  fs.writeFileSync(dosya, yeni.length ? `${govde}${ISARET}\n${yeni.join('\n')}\n` : govde);
}

const hatalar = [];
const etiket = [];
let toplam = 0;
for (let u = 1; u <= 10; u++) {
  const ad = `u${String(u).padStart(2, '0')}.txt`;
  const kaynak = path.join(EK, ad);
  const kart = [];
  const ornek = [];
  if (fs.existsSync(kaynak)) {
    for (const l of satirlar(kaynak)) {
      const p = l.split('|').map((x) => x.trim());
      if (p.length !== 11) { hatalar.push(`${ad}: alan sayisi ${p.length}: ${l.slice(0, 60)}`); continue; }
      const [en, tr, tur] = p;
      kart.push(p.slice(0, 9).join('|'));
      ornek.push([en, p[9], p[10]].join('|'));
      etiket.push([u, en, tr, tur === 'I' ? 'I' : 'R', '', '', 'ek 19 Ekim'].join('|'));
      toplam++;
    }
  }
  yaz(path.join(M, 'lgs-kart', ad), kart);
  yaz(path.join(M, 'lgs-ornek', ad), ornek);
}
const vDosya = path.join(EK, 'v.txt');
const genel = new Map(JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8')).map((k) => [k.en.toLowerCase(), k]));
let v = 0;
if (fs.existsSync(vDosya)) {
  for (const l of satirlar(vDosya)) {
    const [u, en] = l.split('|').map((x) => x.trim());
    const k = genel.get(en.toLowerCase());
    if (!k) { hatalar.push(`v.txt: Genel'de kart yok: ${en}`); continue; }
    etiket.push([u, k.en, k.tr, 'V', '', '', 'ek 19 Ekim'].join('|'));
    v++;
  }
}
yaz(path.join(M, 'lgs8-etiket.txt'), etiket);
console.log(`${toplam} yeni kart, ${v} Genel karti uniteye baglandi`);
if (hatalar.length) { console.log(hatalar.join('\n')); process.exitCode = 1; }
