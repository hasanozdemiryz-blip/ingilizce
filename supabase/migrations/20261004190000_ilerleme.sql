-- Uyenin ilerleme yedegi. Istemci: src/senkron.ts
--
-- NEDEN TEK SATIR / KULLANICI, KART BASINA DEGIL.
-- Havuz 300 kelime ve bir hesabi tek kisi kullaniyor. Kart basina satir
-- granuler senkron saglardi ama her ders sonunda onlarca upsert, satir
-- bazli catisma cozumu ve cok daha fazla RLS yuku demekti. Tek jsonb
-- paket atomik: ya tamami yazilir ya hicbiri.
--
-- CATISMA cozumu istemcide (`birlestir`): kart bazinda son hareket eden
-- kazanir. Sunucu yalnizca sakliyor.
create table if not exists public.ilerleme (
  kullanici uuid primary key references auth.users (id) on delete cascade,
  veri jsonb not null,
  guncellendi timestamptz not null default now()
);

comment on table public.ilerleme is
  'Uyenin ilerleme yedegi (tek satir/kullanici). Istemci: src/senkron.ts. Sema kaynagi: supabase/migrations/';

alter table public.ilerleme enable row level security;

-- Kullanici YALNIZCA kendi satirini gorur ve yazar. Silme politikasi yok:
-- hesap silinince satir `on delete cascade` ile gidiyor.
create policy "kendi ilerlemesini okur"
  on public.ilerleme for select
  using ((select auth.uid()) = kullanici);

create policy "kendi ilerlemesini ekler"
  on public.ilerleme for insert
  with check ((select auth.uid()) = kullanici);

create policy "kendi ilerlemesini gunceller"
  on public.ilerleme for update
  using ((select auth.uid()) = kullanici)
  with check ((select auth.uid()) = kullanici);
