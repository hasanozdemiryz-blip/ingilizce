-- ILETISIM — sitedeki formdan gelen mesajlar.
--
-- Istemci dogrudan YAZMIYOR: form `iletisim` edge function'ina gidiyor, islev
-- dogruluyor, sinirliyor, buraya yaziyor ve e-postayla iletiyor (bkz.
-- supabase/functions/iletisim). Bu yuzden tabloda HICBIR politika yok: RLS
-- acik ve anon/authenticated rolleri ne okuyabiliyor ne yazabiliyor;
-- yalnizca islevin kullandigi service_role erisiyor.

create table if not exists public.iletisim (
  id          bigint generated always as identity primary key,
  ad          text not null check (char_length(ad) between 1 and 80),
  eposta      text not null check (char_length(eposta) between 3 and 160),
  mesaj       text not null check (char_length(mesaj) between 1 and 4000),
  sayfa       text check (char_length(sayfa) <= 200),
  -- Gonderenin IP'sinin tuzlu ozeti: ayni kaynaktan seri gonderimi
  -- sinirlamak icin. IP'nin kendisi tutulmuyor.
  kaynak_ozet text not null,
  eposta_gitti boolean not null default false,
  olustu      timestamptz not null default now()
);

comment on table public.iletisim is
  'Site iletisim formu. Yazan: edge function iletisim (service_role). Sema: supabase/migrations/';

create index if not exists iletisim_kaynak_zaman on public.iletisim (kaynak_ozet, olustu desc);

alter table public.iletisim enable row level security;

-- Saklama: gizlilik politikasindaki "en fazla 12 ay".
create extension if not exists pg_cron;

select cron.unschedule('iletisim-temizle')
where exists (select 1 from cron.job where jobname = 'iletisim-temizle');

select cron.schedule(
  'iletisim-temizle',
  '30 4 1 * *',
  $$delete from public.iletisim where olustu < now() - interval '12 months'$$
);
