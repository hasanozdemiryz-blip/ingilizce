import { UNITELER } from '../lgs';

/*
  Unite gorselleri (31 Ekim, PLAN v3): kart gorselleriyle ayni cizim dili
  (Nano Banana Pro, stil ref VXEgEPIMMU; gorsel-log.txt "unite"). 240x180
  webp, toplam ~60 KB — unite listesi, ana ekran karti ve Ilerleme haritasi
  ayni dosyayi kullaniyor. Dosya yoksa emoji (eski hal) yerinde kalir.
*/
const DOSYALAR = import.meta.glob('../assets/lgs-unite/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const GORSEL = new Map(
  Object.entries(DOSYALAR).map(([yol, url]) => [yol.split('/').pop()!.replace(/\.webp$/, ''), url]),
);

export function UniteGorseli({ no, className = 'h-12 w-12' }: { no: number; className?: string }) {
  const url = GORSEL.get(`u${no}`);
  const u = UNITELER[no - 1];
  if (!url) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center text-2xl ${className}`} aria-hidden>
        {u?.ikon}
      </span>
    );
  }
  return <img src={url} alt="" aria-hidden className={`shrink-0 rounded-xl object-cover ${className}`} loading="lazy" />;
}
