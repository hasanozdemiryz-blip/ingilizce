import { Card as CardShell, Yonerge } from './ui';
import { CagrisimIpucu } from './Cagrisim';
import type { Card } from '../types';
import { t } from '../dil';

/**
 * Kelimenin cumledeki yeri: [once, kelime, sonra]. Kelime AYNEN geciyor
 * (veri bunu garanti ediyor, bkz. tools/mufredat/lgs-icerik.mjs); buyuk
 * harfle baslayan "Boil the eggs" de bulunur.
 */
export function cumleParcala(cumle: string, kelime: string): [string, string, string] | null {
  const kucuk = cumle.toLowerCase();
  const aranan = kelime.toLowerCase();
  // Kelimenin ortasindan yakalamasin: "subscribers ... a subscriber" ilkini atlar
  for (let i = kucuk.indexOf(aranan); i >= 0; i = kucuk.indexOf(aranan, i + 1)) {
    const once = cumle[i - 1];
    const sonra = cumle[i + kelime.length];
    if ((once && /[a-z]/i.test(once)) || (sonra && /[a-z]/i.test(sonra))) continue;
    return [cumle.slice(0, i), cumle.slice(i, i + kelime.length), cumle.slice(i + kelime.length)];
  }
  return null;
}

/**
 * CUMLEDE — merdivenin 7. ve son basamagi (20 Ekim).
 *
 * Kelimeyi tek basina bilmek ile cumlede taniyip yerine koymak ayri
 * beceriler; LGS sorularinin buyuk kismi da tam olarak bu ("I ____ tea to
 * coffee"). Siklar Ingilizce, gorsel ve kanca yok — kanca yalnizca ipucu.
 */
export function CumleSecimi({
  card,
  options,
  secilen,
  hookRevealed,
  onPick,
}: {
  card: Card;
  options: string[];
  secilen: string | null;
  hookRevealed: boolean;
  onPick: (secim: string) => void;
}) {
  const parca = cumleParcala(card.ornek ?? '', card.en);
  return (
    <div className="flex flex-col gap-3">
      <CardShell className="w-full">
        <div className="flex flex-col items-center gap-3 py-5">
          <Yonerge>{t('Boşluğa hangisi gelir?')}</Yonerge>
          <p className="word text-center text-[1.45rem] leading-snug font-bold px-1">
            {parca ? (
              <>
                {parca[0]}
                <span
                  className={`inline-block min-w-[4.5rem] border-b-[3px] px-1 ${
                    secilen === null ? 'border-ink/40 text-transparent' : 'border-grow text-grow-deep'
                  }`}
                >
                  {secilen === null ? '·' : parca[1]}
                </span>
                {parca[2]}
              </>
            ) : (
              card.ornek
            )}
          </p>
          {secilen !== null && card.ornekTr && (
            <p className="rise text-center text-sm text-ink-soft max-w-[32ch]">{card.ornekTr}</p>
          )}
          {hookRevealed && secilen === null && (
            <span className="pop">
              <CagrisimIpucu card={card} />
            </span>
          )}
        </div>
      </CardShell>

      <div className="grid gap-2.5">
        {options.map((o) => {
          const ton =
            secilen === null
              ? 'bg-white text-ink shadow-[var(--shadow-soft)]'
              : o === card.en
                ? 'bg-grow text-white shadow-[var(--shadow-soft)]'
                : secilen === o
                  ? 'bg-blush text-white shadow-[var(--shadow-soft)]'
                  : 'bg-white/50 text-ink-faint';
          return (
            <button
              key={o}
              onClick={() => onPick(o)}
              disabled={secilen !== null}
              className={`word rounded-full px-5 py-4 font-bold transition-all active:scale-[0.98] ${ton}`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
