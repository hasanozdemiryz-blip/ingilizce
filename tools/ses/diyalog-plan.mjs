// Diyalog sesleri icin parti plani (20 Ekim 2026, Asama 5).
//   node tools/ses/diyalog-plan.mjs  → tools/ses/diyalog-plan.json
//
// Uygulamada her satirin kendi dinle dugmesi var; satir basina dosya
// gerekiyor. Satir basina TTS 123 cagri demekti: bunun yerine her unitenin
// KADIN satirlari bir cagrida (Lexi Parker, 154), ERKEK satirlari bir
// cagrida (Matthew Wilson, 288), aralarinda [pause 2s]. Bolme sessizlikten
// (tools/ses/ses-bol.mjs ile ayni yontem, daha uzun esik).
//
// Dosya adi: public/ses/d/u<unite>-<diyalog>-<satir>.mp3 (hepsi 1'den).
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '../..');
export const SESLER = { k: 154, e: 288 };
const partiler = [];
for (let u = 1; u <= 10; u++) {
  const d = JSON.parse(fs.readFileSync(path.join(KOK, `content/lgs-unite/u${String(u).padStart(2, '0')}.json`), 'utf8'));
  for (const cinsiyet of ['k', 'e']) {
    const ogeler = [];
    d.diyaloglar.forEach((dy, i) =>
      dy.satirlar.forEach((s, j) => {
        if (s.cinsiyet === cinsiyet) ogeler.push({ id: `u${u}-${i + 1}-${j + 1}`, en: s.en });
      }),
    );
    partiler.push({
      no: partiler.length + 1,
      unite: u,
      cinsiyet,
      ses: SESLER[cinsiyet],
      ogeler,
      metin: ogeler.map((o) => o.en).join(' [pause 2s] '),
    });
  }
}
fs.writeFileSync(path.join(KOK, 'tools/ses/diyalog-plan.json'), JSON.stringify(partiler, null, 1));
console.log(`${partiler.length} parti, ${partiler.reduce((n, p) => n + p.ogeler.length, 0)} satir`);
