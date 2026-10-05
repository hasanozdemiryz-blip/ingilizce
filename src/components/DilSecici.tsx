import { dilDegistir, dilOku, type Dil } from '../dil';

/**
 * Turkce / English secici.
 *
 * Etiketler CEVRILMIYOR: her dil kendi adiyla yaziliyor ki yanlis dilde
 * kalan kisi kendi dilini taniyabilsin. Secince uygulama yeniden aciliyor
 * (bkz. dil.ts).
 */
const DILLER: { kod: Dil; ad: string }[] = [
  { kod: 'tr', ad: 'Türkçe' },
  { kod: 'en', ad: 'English' },
];

export function DilSecici({ kucuk = false }: { kucuk?: boolean }) {
  const secili = dilOku();
  return (
    <div
      role="radiogroup"
      aria-label="Dil / Language"
      className={`inline-flex rounded-full bg-sunken p-1 ${kucuk ? 'text-xs' : 'text-sm'}`}
    >
      {DILLER.map((d) => (
        <button
          key={d.kod}
          role="radio"
          aria-checked={secili === d.kod}
          onClick={() => dilDegistir(d.kod)}
          className={`rounded-full font-bold transition ${kucuk ? 'px-3 py-1' : 'px-4 py-1.5'} ${
            secili === d.kod ? 'bg-white text-ink shadow-[var(--shadow-soft)]' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {d.ad}
        </button>
      ))}
    </div>
  );
}
