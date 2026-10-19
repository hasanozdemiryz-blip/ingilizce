// LGS kart metinlerini (tools/mufredat/lgs-kart/u01..u10.txt) birlestirir ve denetler.
//   node tools/mufredat/lgs-kart.mjs  → tools/mufredat/lgs-kart.json
// Denetim: her LGS kelimesi (V = zaten kart olanlar haric) bir kez; alan sayisi;
// kanca kurallari (kanca-kurallari.md 2 ve 4): bir kanca baska kartin anlami ya da
// kancasi olamaz, ayni kanca iki kez kullanilmaz.
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '../..');
const KLASOR = path.join(KOK, 'tools/mufredat/lgs-kart');
const satirlar = (d) => fs.readFileSync(d, 'utf8').split(/\r?\n/).filter((l) => l.trim() && !l.startsWith('#'));

const etiket = satirlar(path.join(KOK, 'tools/mufredat/lgs8-etiket.txt')).map((l) => l.split('|'));
const beklenen = new Map(etiket.filter((r) => r[3] !== 'V').map((r) => [r[1], Number(r[0])]));
const seviye = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/mufredat/seviye.json'), 'utf8')).lgs;
const kartlar = JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8'));
const kucuk = (s) => s.toLocaleLowerCase('tr').trim();
const kartKanca = new Map(kartlar.map((k) => [kucuk(k.hook), k.en]));
const kartAnlam = new Map(kartlar.flatMap((k) => k.tr.split(',').map((t) => [kucuk(t), k.en])));

const hatalar = [];
const sonuc = [];
for (const f of fs.readdirSync(KLASOR).filter((f) => /^u\d\d\.txt$/.test(f)).sort()) {
  const unite = Number(f.slice(1, 3));
  for (const l of satirlar(path.join(KLASOR, f))) {
    const p = l.split('|');
    if (p.length !== 9) { hatalar.push(`${f}: alan sayisi ${p.length}: ${l.slice(0, 50)}`); continue; }
    const [en, tr, tur, kanca, yol, cumle, sahne, ton, genel] = p.map((x) => x.trim());
    if (!beklenen.has(en)) hatalar.push(`${f}: listede olmayan kelime ${en}`);
    else if (beklenen.get(en) !== unite) hatalar.push(`${f}: ${en} baska unitede`);
    if (!['K', 'T', 'G', 'I'].includes(tur)) hatalar.push(`${en}: tur ${tur}`);
    if (tur === 'K' && (!kanca || !yol)) hatalar.push(`${en}: K ama kanca/yol yok`);
    if (!['E', 'H'].includes(genel)) hatalar.push(`${en}: genel ${genel}`);
    if (sahne && !ton) hatalar.push(`${en}: sahne var ton yok`);
    sonuc.push({ unite, en, tr, tur, kanca, yol, cumle, sahne, ton, genel: genel === 'E', seviye: seviye[en]?.seviye ?? 'orta' });
  }
}
const goruldu = new Map();
for (const k of sonuc) goruldu.set(k.en, (goruldu.get(k.en) || 0) + 1);
for (const [en, n] of goruldu) if (n > 1) hatalar.push(`tekrar: ${en}`);
for (const en of beklenen.keys()) if (!goruldu.has(en)) hatalar.push(`eksik: ${en}`);

// Kanca kurallari: yalniz K kartlar (T'de kanca kelimenin Turkce bicimi)
/** Bilinen istisnalar: attend ≈ at kullanici onayli (18 Ekim), Mısır ulke adi (corn ≈ mısır ile karismaz). */
const ISTISNA = new Set(['attend', 'mysterious']);
const kancaSay = new Map();
for (const k of sonuc.filter((x) => x.tur === 'K' && !ISTISNA.has(x.en))) {
  const h = kucuk(k.kanca);
  if (kartKanca.has(h)) hatalar.push(`kanca cakismasi: ${k.en} ≈ ${k.kanca} — mevcut kart ${kartKanca.get(h)}'in kancasi`);
  if (kartAnlam.has(h)) hatalar.push(`kanca cakismasi: ${k.en} ≈ ${k.kanca} — mevcut kart ${kartAnlam.get(h)}'in anlami`);
  kancaSay.set(h, [...(kancaSay.get(h) || []), k.en]);
}
for (const [h, l] of kancaSay) if (l.length > 1) hatalar.push(`ayni kanca: ${h} → ${l.join(', ')}`);

fs.writeFileSync(path.join(KOK, 'tools/mufredat/lgs-kart.json'), JSON.stringify(sonuc, null, 1));
const say = (f) => sonuc.filter(f).length;
console.log(`${sonuc.length} kart | K ${say((x) => x.tur === 'K')} T ${say((x) => x.tur === 'T')} G ${say((x) => x.tur === 'G')} I ${say((x) => x.tur === 'I')} | gorselli ${say((x) => x.sahne)} | Genel'e ${say((x) => x.genel)} (baslangic ${say((x) => x.genel && x.seviye === 'baslangic')}, orta ${say((x) => x.genel && x.seviye === 'orta')})`);
if (hatalar.length) { console.log(`${hatalar.length} SORUN:\n` + hatalar.join('\n')); process.exitCode = 1; } else console.log('denetim temiz');
