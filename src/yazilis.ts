/**
 * YAZILIS CAGRISIMI — kelimenin icindeki Turkce kelime (20 Ekim).
 *
 * **deli**cious ≈ deli, **dev**ice ≈ dev, at**t**end ≈ at: cagrisim sesten
 * degil yazilistan geliyor ve kartta kelimenin o parcasi vurgulaniyor.
 * Bizim farkimiz bu (KARARLAR 3); ses cagrisiminda vurgu yok.
 *
 * Parca kancanin ASCII hali kelimede aranarak bulunuyor (füze → fuze).
 * Harfi tutmayanlar elle: refuse ≈ füze'de kelimede "fuse" yaziyor.
 * Sitedeki karsiligi: tools/site-bolumler.mjs `YAZILIS_PARCA`.
 */
const ELLE: Record<string, string> = {
  refuse: 'fuse',
  incredible: 'credi',
  accommodation: 'commod',
  discover: 'disco',
  gravity: 'grav',
};

const ascii = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u');

/**
 * Vurgulanacak parca: [baslangic, bitis) — bulunamazsa null.
 * Yalniz yolu yazilis olan kartta aranir; ses kancasi kelimenin icinde
 * tesadufen gecse bile (far ≈ far) vurgulanmaz.
 */
export function yazilisParca(card: {
  en: string;
  hook: string;
  yol?: string | null;
}): [number, number] | null {
  if (!card.yol?.includes('yazılış')) return null;
  const kelime = card.en.toLowerCase();
  const adaylar = [ELLE[kelime], ascii(card.hook).replace(/[^a-z ]/g, ''), ascii(card.hook).split(/\s+/)[0]];
  for (const aday of adaylar) {
    if (!aday || aday.length < 2) continue;
    const i = kelime.indexOf(aday);
    if (i >= 0) return [i, i + aday.length];
  }
  return null;
}
