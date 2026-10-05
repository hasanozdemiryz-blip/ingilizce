// Sitedeki iletisim formu. Istemci: site/sayfalar/form.js.html
//
// Is sirasi: dogrula → bot tuzagi → kaynak basina sinir → kaydet → e-posta.
// Kayit e-postadan ONCE: Resend gecici olarak dusse bile mesaj kaybolmuyor,
// `eposta_gitti` false kaliyor ve panelden gorulebiliyor.
//
// NEDEN `verify_jwt = false`. Formu dolduran kisinin oturumu yok; ag
// gecidi jeton isterse her istek 401 alir (bkz. supabase/config.toml).
//
// NEDEN `npm:`. `jsr:` ile yazilan hesap-sil Edge Runtime'da hic
// baslamamisti (bkz. NOTLAR, 4 Ekim).
//
// Gereken sirlar (Supabase → Edge Functions → Secrets):
//   RESEND_API_KEY      — Resend anahtari
//   ILETISIM_ALICI      — mesajlarin gidecegi adres
//   ILETISIM_GONDEREN   — Resend'de dogrulanmis alan adindan bir gonderen,
//                         or. "Hafızada <iletisim@hafizada.com>"
//   ILETISIM_TUZ        — kaynak ozeti icin rastgele bir metin

import { createClient } from 'npm:@supabase/supabase-js@2';

const IZINLI = ['https://hafizada.com', 'http://localhost:8090', 'http://localhost:5173'];
/** Ayni kaynaktan bir saatte en fazla bu kadar mesaj. */
const SAATLIK_SINIR = 5;

const cors = (koken: string | null) => ({
  'Access-Control-Allow-Origin': koken && IZINLI.includes(koken) ? koken : IZINLI[0],
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
});

const kacis = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function ozet(metin: string): Promise<string> {
  const veri = new TextEncoder().encode(metin);
  const h = await crypto.subtle.digest('SHA-256', veri);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (istek) => {
  const koken = istek.headers.get('Origin');
  const yanit = (govde: unknown, durum = 200) =>
    new Response(JSON.stringify(govde), {
      status: durum,
      headers: { ...cors(koken), 'Content-Type': 'application/json' },
    });

  if (istek.method === 'OPTIONS') return new Response('ok', { headers: cors(koken) });
  if (istek.method !== 'POST') return yanit({ hata: 'yontem' }, 405);

  try {
    const g = (await istek.json()) as Record<string, unknown>;
    const ad = String(g.ad ?? '').trim().slice(0, 80);
    const eposta = String(g.eposta ?? '').trim().slice(0, 160);
    const mesaj = String(g.mesaj ?? '').trim().slice(0, 4000);
    const sayfa = String(g.sayfa ?? '').slice(0, 200);

    // Bot tuzagi: gorunmez alan doluysa basarili gibi davran, hicbir sey yapma.
    if (String(g.web ?? '').length > 0) return yanit({ oldu: true });

    if (!ad || !mesaj || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eposta)) {
      return yanit({ hata: 'eksik' }, 400);
    }

    const adres = Deno.env.get('SUPABASE_URL');
    const anahtar = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!adres || !anahtar) return yanit({ hata: 'yapilandirma' }, 500);
    const db = createClient(adres, anahtar, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const ip = (istek.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'bilinmiyor';
    const kaynak = await ozet(`${Deno.env.get('ILETISIM_TUZ') ?? ''}|${ip}`);

    const birSaatOnce = new Date(Date.now() - 3600_000).toISOString();
    const { count } = await db
      .from('iletisim')
      .select('id', { count: 'exact', head: true })
      .eq('kaynak_ozet', kaynak)
      .gte('olustu', birSaatOnce);
    if ((count ?? 0) >= SAATLIK_SINIR) return yanit({ hata: 'sinir' }, 429);

    const { data: kayit, error } = await db
      .from('iletisim')
      .insert({ ad, eposta, mesaj, sayfa, kaynak_ozet: kaynak })
      .select('id')
      .single();
    if (error) return yanit({ hata: 'kayit' }, 500);

    const resend = Deno.env.get('RESEND_API_KEY');
    const alici = Deno.env.get('ILETISIM_ALICI');
    const gonderen = Deno.env.get('ILETISIM_GONDEREN');
    if (resend && alici && gonderen) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: gonderen,
          to: [alici],
          // "Yanitla" deyince dogrudan yazana gitsin.
          reply_to: eposta,
          subject: `Hafızada iletişim: ${ad}`,
          html: `<p><b>${kacis(ad)}</b> &lt;${kacis(eposta)}&gt; yazdı (${kacis(sayfa)}):</p>
<p style="white-space:pre-wrap">${kacis(mesaj)}</p>`,
          text: `${ad} <${eposta}> yazdı (${sayfa}):\n\n${mesaj}`,
        }),
      });
      if (r.ok) await db.from('iletisim').update({ eposta_gitti: true }).eq('id', kayit.id);
    }

    return yanit({ oldu: true });
  } catch {
    return yanit({ hata: 'bilinmeyen' }, 500);
  }
});
