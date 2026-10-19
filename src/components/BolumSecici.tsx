import { AKTIF_BOLUM, bolumDegistir, type Bolum } from '../bolum';
import { t } from '../dil';

/**
 * Genel · LGS · Cocuk seridi (KARARLAR 2). Sitedeki sekme seridinin
 * platformdaki karsiligi; ana ekranin basinda.
 *
 * Cocuk bu donemde tamamlanmiyor: dugme gorunuyor ama "yakında" — yer
 * tutuyor ki geldiginde kimse yeni bir sekme aramasin.
 */
const BOLUMLER: { id: Bolum | 'cocuk'; ad: string }[] = [
  { id: 'genel', ad: t('Genel') },
  { id: 'lgs', ad: 'LGS' },
  { id: 'cocuk', ad: t('Çocuk') },
];

export function BolumSecici() {
  return (
    <nav aria-label={t('Bölüm')} className="flex shrink-0 gap-1 rounded-full bg-white p-1 shadow-[var(--shadow-soft)]">
      {BOLUMLER.map((b) => {
        const aktif = b.id === AKTIF_BOLUM;
        const yakinda = b.id === 'cocuk';
        return (
          <button
            key={b.id}
            type="button"
            disabled={yakinda}
            aria-current={aktif ? 'page' : undefined}
            onClick={() => b.id !== 'cocuk' && bolumDegistir(b.id)}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-extrabold transition-all active:scale-95 ${
              aktif ? 'bg-ink text-white' : yakinda ? 'text-ink-faint' : 'text-ink-soft hover:bg-sunken'
            }`}
          >
            {b.ad}
            {yakinda && <span className="ml-1 text-[10px] font-bold uppercase tracking-wide"> {t('yakında')}</span>}
          </button>
        );
      })}
    </nav>
  );
}
