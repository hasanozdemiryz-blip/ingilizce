// LGS gorsel uretimi icin 2x2 izgara plani (19 Ekim 2026, Asama 3).
//   node tools/mufredat/izgara-plan.mjs            → tools/mufredat/izgara-plan.json + ozet
//   node tools/mufredat/izgara-plan.mjs --goster N → N. izgaranin prompt'u (uretimde kullanilir)
// Recete: tools/gorsel-recetesi.md (Izgara yontemi). Model imagen-nano-banana-2, 2k, 4:3,
// seed 20260918, stil ref VXEgEPIMMU. Izgara bolme: tools/izgara-bol.mjs.
// Uretilen her izgara tools/mufredat/gorsel-log.txt'ye yazilir (creation id + kart id'leri),
// baska cihazda Magnific'ten yeniden indirilebilsin.
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.resolve(import.meta.dirname, '../..');
const kartlar = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/mufredat/lgs-kart.json'), 'utf8'));
const mevcutId = new Set(JSON.parse(fs.readFileSync(path.join(KOK, 'content/cards.json'), 'utf8')).map((k) => k.id));

/** LGS kart id'si: kelimeden; mevcut kartla cakisirsa "lgs-" oneki. */
export const lgsId = (en) => {
  const s = en.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return mevcutId.has(s) ? `lgs-${s}` : s;
};

/** Genel'den yeniden cizilecek kartlar (izgaraya eklenir). */
const EKSTRA = [
  { id: 'rob', genel: true, ton: 'peach', sahne: 'A cute friendly round robot sneakily takes cookies out of a glass cookie jar standing on a small round table; the table is small and fully visible, its legs end well above the panel edge.' },
];

/** Gorseli zaten olan LGS kartlari (depoda webp) plandan cikar. */
const HAZIR_KLASOR = path.join(KOK, 'src/assets/cards-lgs');
const hazir = new Set(fs.existsSync(HAZIR_KLASOR) ? fs.readdirSync(HAZIR_KLASOR).map((f) => f.replace(/.webp$/, '')) : []);

const POZ = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const ISKELET = `Copy only the drawing style of the reference image (line weight, flat colours), NOT its subject.

COMPOSITION in EVERY panel: the subject occupies about 65% of the panel height, fully visible, with a WIDE even margin of empty background on all four sides — nothing touches or comes near the panel edge. Seen straight on, flat, not in perspective. Centred in its panel. People are shown full body including both feet with empty space below them, fully clothed, with friendly faces.

NO white outline around the subjects. NO sticker border, NO die-cut edge, NO cut-out effect. The artwork sits directly on the flat background.

ABSOLUTELY FLAT colour fills. NO gloss, NO shine, NO metallic sheen, NO specular highlights, NO reflections, NO gradients, NO soft shading, NO texture, NO drop shadow, NO ground shadow, NO shadow under feet or objects, NO ambient occlusion, NO 3D depth. Each object is a base colour plus at most one slightly lighter flat tone.

Every shape outlined with a confident medium-thick, evenly rounded stroke in a darker tone of its own fill colour, the same weight as the reference.

BACKGROUND of each panel: one single very pale washed-out tint as given, extremely light, close to white. Completely empty apart from what is described — no ground, no horizon, no pattern.

Inanimate objects have NO faces, NO eyes, NO mouths, NO limbs (robots and toys excepted).

No text, no letters, no numbers, no logos anywhere in the image; signs, papers and screens are blank.

Child-friendly and wholesome: nothing scary, violent, dangerous, religious, romantic or rude.`;

const ogeler = [
  ...EKSTRA,
  ...kartlar.filter((k) => k.sahne).map((k) => ({ id: lgsId(k.en), en: k.en, ton: k.ton, sahne: k.sahne })),
].filter((o) => o.genel || !hazir.has(o.id));
const idSay = new Map();
for (const o of ogeler) idSay.set(o.id, (idSay.get(o.id) || 0) + 1);
const tekrar = [...idSay].filter(([, n]) => n > 1).map(([id]) => id);
if (tekrar.length) throw new Error(`tekrar eden id: ${tekrar.join(', ')}`);

const izgaralar = [];
for (let i = 0; i < ogeler.length; i += 4) {
  const dort = ogeler.slice(i, i + 4);
  const prompt = `A 2x2 grid of FOUR separate, independent card illustrations arranged in two rows and two columns, separated by thin plain white gutters. Each panel is its own complete picture with its own very pale background.

${dort.map((o, j) => `Panel ${j + 1} (${POZ[j]}), very pale ${o.ton} background: ${o.sahne}`).join('\n')}${dort.length < 4 ? `\n${[...Array(4 - dort.length).keys()].map((j) => `Panel ${dort.length + j + 1} (${POZ[dort.length + j]}), very pale cream background: a single small green potted plant.`).join('\n')}` : ''}

${ISKELET}`;
  izgaralar.push({ no: izgaralar.length + 1, ids: dort.map((o) => o.id), genel: dort.map((o) => !!o.genel), prompt });
}
fs.writeFileSync(path.join(KOK, 'tools/mufredat/izgara-plan.json'), JSON.stringify(izgaralar, null, 1));

const goster = process.argv.indexOf('--goster');
if (goster > 0) {
  const n = Number(process.argv[goster + 1]);
  const g = izgaralar[n - 1];
  console.log(JSON.stringify({ no: g.no, ids: g.ids }));
  console.log(g.prompt);
} else {
  console.log(`${ogeler.length} gorsel → ${izgaralar.length} izgara (~${izgaralar.length * 75} kredi + yeniden deneme)`);
}
