/**
 * ZİYARETÇİ NEREDEN GELDİ (19 Ekim, PLAN v2 B).
 *
 * 61 cihaz açmış, 4 üye var ama hangisinin Google'dan, hangisinin
 * Instagram'dan geldiği bilinmiyordu; satış ve reklam başlamadan bu şart.
 *
 * İlk temas SİTEDE kaydediliyor (site/kabuk.html, `hafizada-kaynak`): kişi
 * çoğu zaman siteye Google'dan ya da Instagram'dan gelir, platforma siteden
 * geçer — platformun kendi referrer'ı o zaman yalnızca "hafizada.com" olur.
 * Site ile platform aynı adreste, localStorage ortak.
 *
 * KİŞİSEL VERİ YOK: yalnızca gelinen sitenin adı (tam adres değil), utm
 * etiketleri, ilk sayfanın yolu ve dokunmatik cihaz mı.
 */

type Veri = Record<string, string | number | boolean>;

export const KAYNAK_ANAHTARI = 'hafizada-kaynak';

/** Referrer adından kaba kaynak. Bilinmeyen site kendi adıyla kalır. */
export function kaynakSinifi(refHost: string, utmSource?: string): string {
  if (utmSource) return utmSource.toLowerCase().slice(0, 40);
  const h = refHost.toLowerCase().replace(/^www\./, '');
  if (!h) return 'dogrudan';
  if (/(^|\.)hafizada\.com$/.test(h)) return 'site';
  if (/google\./.test(h)) return 'google';
  if (/bing\.|yandex\.|duckduckgo\./.test(h)) return 'arama';
  if (/instagram\.com$/.test(h)) return 'instagram';
  if (/facebook\.com$|fb\.me$/.test(h)) return 'facebook';
  if (/(^|\.)t\.co$|twitter\.com$|x\.com$/.test(h)) return 'x';
  if (/youtube\.com$|youtu\.be$/.test(h)) return 'youtube';
  if (/tiktok\.com$/.test(h)) return 'tiktok';
  if (/whatsapp\./.test(h)) return 'whatsapp';
  return h.slice(0, 60);
}

type IlkTemas = { k: string; r?: string; u?: string; m?: string; c?: string; s?: string; t?: string };

function ilkTemasOku(): IlkTemas | null {
  try {
    const ham = localStorage.getItem(KAYNAK_ANAHTARI);
    return ham ? (JSON.parse(ham) as IlkTemas) : null;
  } catch {
    return null;
  }
}

function hostu(adres: string): string {
  try {
    return adres ? new URL(adres).hostname : '';
  } catch {
    return '';
  }
}

/** `uygulama_acildi` olayının verisi. Hiçbir zaman hata fırlatmaz. */
export function kaynakVerisi(): Veri {
  try {
    const p = new URLSearchParams(location.search);
    const refHost = hostu(document.referrer);
    const simdi = kaynakSinifi(refHost, p.get('utm_source') ?? undefined);
    const ilk = ilkTemasOku();
    const v: Veri = { simdi };
    // Platforma doğrudan dışarıdan gelindiyse (reklam bağlantısı gibi) ilk temas da budur.
    v.ilk = ilk?.k ?? simdi;
    if (ilk?.s) v.ilk_sayfa = ilk.s.slice(0, 80);
    const kampanya = p.get('utm_campaign') ?? ilk?.c;
    if (kampanya) v.kampanya = kampanya.slice(0, 60);
    const ortam = p.get('utm_medium') ?? ilk?.m;
    if (ortam) v.ortam = ortam.slice(0, 40);
    v.dokunmatik = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    return v;
  } catch {
    return {};
  }
}
