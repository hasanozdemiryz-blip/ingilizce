// Hesabi tamamen siler. Istemci: src/uyelik.ts `hesabiSil`.
//
// NEDEN EDGE FUNCTION. Kullanici silme yonetici yetkisi istiyor ve o
// anahtar tarayiciya KONULAMAZ; konursa herkes herkesin hesabini siler.
// Burada anahtar sunucuda duruyor ve yalnizca cagiranin KENDI hesabini
// silmek icin kullaniliyor — silinecek kimlik govdeden degil, jetondan
// okunuyor, yoksa biri baskasinin kimligini gonderip onu silerdi.
//
// NEDEN `npm:` VE `jsr:` DEGIL. Ilk surum `jsr:` ile yazildi ve islev HIC
// BASLAYAMADI; istemci "hesap silinemedi" goruyordu ve sebebi hicbir yerde
// gorunmuyordu. Edge Runtime'in destekledigi bicim `npm:`.
//
// NEDEN `verify_jwt: false`. Ag gecidi dogrulamayi ustlenirse hatayi O
// donduruyor ve istemciye anlamsiz bir govde gidiyor. Dogrulama asagida
// yapiliyor — jetonsuz ya da gecersiz jetonlu istek 401 aliyor.
//
// `ilerleme` satiri `on delete cascade` ile kendiliginden gidiyor.

import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const yanit = (govde: unknown, durum = 200) =>
  new Response(JSON.stringify(govde), {
    status: durum,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

Deno.serve(async (istek) => {
  if (istek.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (istek.method !== 'POST') return yanit({ hata: 'yontem' }, 405);

  try {
    const baslik = istek.headers.get('Authorization') ?? '';
    const jeton = baslik.replace(/^Bearer\s+/i, '').trim();
    if (!jeton) return yanit({ hata: 'jeton yok' }, 401);

    const adres = Deno.env.get('SUPABASE_URL');
    const anahtar = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!adres || !anahtar) return yanit({ hata: 'sunucu yapilandirmasi eksik' }, 500);

    const yonetici = createClient(adres, anahtar, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Jetonun KIMIN oldugu sunucuda dogrulaniyor.
    const { data, error } = await yonetici.auth.getUser(jeton);
    if (error || !data.user) return yanit({ hata: 'oturum gecersiz' }, 401);

    const { error: silme } = await yonetici.auth.admin.deleteUser(data.user.id);
    if (silme) return yanit({ hata: silme.message }, 500);

    return yanit({ oldu: true });
  } catch (e) {
    return yanit({ hata: e instanceof Error ? e.message : 'bilinmeyen' }, 500);
  }
});
