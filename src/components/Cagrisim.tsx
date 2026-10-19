import { HookChip } from './ui';
import { kancaliMi, type Card } from '../types';
import { yazilisParca } from '../yazilis';
import { t } from '../dil';

/**
 * Kelime, yazilis cagrisiminda kancanin parcasi vurgulu: **deli**cious.
 * Ses cagrisiminda duz kelime.
 */
export function YaziliKelime({ card }: { card: Card }) {
  const parca = yazilisParca(card);
  if (!parca) return <>{card.en}</>;
  const [a, b] = parca;
  return (
    <>
      {card.en.slice(0, a)}
      <span className="underline decoration-[3px] decoration-brand underline-offset-[5px]">{card.en.slice(a, b)}</span>
      {card.en.slice(b)}
    </>
  );
}

/**
 * Tanisma ve cevap yuzundeki cagrisim satiri.
 *
 * Kancali kart: "delicious ≈ deli" (yazilista parca altcizgili).
 * Gorsel cagrisim (G) ve kalip (I) kartlarinda kanca YOK; cagrisim
 * resmin kendisi. Bos bir "awesome ≈ " gostermek yerine bunu soyluyoruz.
 */
export function CagrisimSatiri({ card, big = false }: { card: Card; big?: boolean }) {
  if (kancaliMi(card)) {
    return (
      <HookChip big={big}>
        <YaziliKelime card={card} /> ≈ {card.hook}
      </HookChip>
    );
  }
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{t('çağrışım')}</span>
      <span className="rounded-full bg-sunken px-3 py-1 text-sm font-semibold text-ink-soft">
        {t('Resme bak: anlamı sahnede')}
      </span>
    </span>
  );
}

/**
 * Soru yuzlerindeki IPUCU (merdivenin 3. basamagindan sonra).
 * Kancali kartta kanca; kancasizda resmin kucuk hali — o kartin
 * cagrisimi zaten resim.
 */
export function CagrisimIpucu({ card }: { card: Card }) {
  if (kancaliMi(card)) return <HookChip>{card.hook}</HookChip>;
  if (!card.image) return null;
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-ink-soft">{t('çağrışım')}</span>
      <img src={card.image} alt="" className="w-32 aspect-[4/3] rounded-xl object-cover" />
    </span>
  );
}

/** Listelerde kancanin yerine gecen kisa yazi: kanca ya da "görsel çağrışım". */
export const kancaYazisi = (card: Card): string => (kancaliMi(card) ? card.hook : t('görsel çağrışım'));
