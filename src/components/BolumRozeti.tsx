import { AKTIF_BOLUM } from '../bolum';
import { t } from '../dil';

/**
 * Hangi bolumdesin: LGS mi Genel mi (31 Ekim, kullanici: "platformda neye giris
 * yaptigim gorunsun"). Platform icinde bolum degistirilmiyor (bkz. bolum.ts); bu
 * yalniz gosterge, dugme degil. Ilerleme, seri ve istatistik bolume ozel
 * oldugundan ekranlarin basinda duruyor.
 */
export function BolumRozeti({ className = '' }: { className?: string }) {
  const lgs = AKTIF_BOLUM === 'lgs';
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide ${
        lgs ? 'bg-[#dff3ff] text-[#0b5e8a]' : 'bg-spark-soft text-ink'
      } ${className}`}
      title={lgs ? t('LGS İngilizce bölümündesin') : t('Genel İngilizce bölümündesin')}
    >
      {/* Telefonda kisa: ust satirda ad, seri ve "Giris yap" ile yer paylasiyor */}
      <span className="sm:hidden">{lgs ? 'LGS' : t('Genel')}</span>
      <span className="hidden sm:inline">{lgs ? t('LGS İngilizce') : t('Genel İngilizce')}</span>
    </span>
  );
}
