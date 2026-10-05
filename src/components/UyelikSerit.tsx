import { useUyelik, uyelikVarMi } from '../uyelik';
import { t } from '../dil';

/**
 * ANA EKRANDAKI UYELIK SERIDI.
 *
 * Ders sonundaki davet tek basina yetmiyordu: kullanici gunlerce girip
 * cikiyor ve ilerlemesinin yalnizca bu cihazda oldugunu hicbir yerde
 * gormuyordu. Serit o bosluğu dolduruyor — surekli duruyor ama ince, ve
 * hicbir seyi engellemiyor.
 *
 * IKI HALI VAR:
 *   uye degil — kac kelimenin risk altinda oldugunu SAYIYLA soyler
 *   girisli   — hic gorunmez. Bir sure "uyeligini tamamla" hali de vardi;
 *               bilgi adimi istege baglı olunca kalkti.
 *
 * SIFIR KELIMEDE CIKMAZ. Kaybedecek bir seyi olmayana kayip uyarisi
 * yapmak hem anlamsiz hem de ilk izlenimi bozuyor; uygulamayi yeni acan
 * kisi once urunu gormeli.
 *
 * UYELIK YAPILANDIRMASI YOKSA CIKMAZ — `Settings` ve `SessionDone` ile
 * ayni kural: calismayan bir sey gostermektense hic gostermemek.
 */
export function UyelikSerit({
  ogrenilen,
  onAc,
}: {
  /** Tanisilan kelime sayisi — risk altindaki sey bu. */
  ogrenilen: number;
  onAc: () => void;
}) {
  const { uye, hazir } = useUyelik();

  if (!uyelikVarMi()) return null;
  /*
    Oturum henuz okunmadiysa SUSUYOR. Acilista uyelik paketi yarim saniye
    kadar sonra iniyor; o arada `uye` bos ve serit girisli kullaniciya
    "uye ol" deyip kayboluyordu.
  */
  if (!hazir) return null;
  if (uye) return null;

  /*
    Hic kelime yokken de gorunuyor ama metni degisiyor: "0 kelimen risk
    altinda" demek anlamsiz olurdu. Bir sure sifirda hic gosterilmiyordu;
    karar degisti, cagri surekli dursun istendi.
  */
  const hicIlerleme = ogrenilen === 0;

  return (
    <button
      onClick={onAc}
      className="rise flex w-full items-center gap-3 rounded-2xl border border-spark bg-spark-soft px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <span className="text-lg leading-none" aria-hidden>
        {hicIlerleme ? '🙂' : '⚠️'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">
          {hicIlerleme ? t('Üye ol, ilerlemen kaybolmasın') : t('{ogrenilen} kelimen yalnızca bu cihazda', { ogrenilen })}
        </span>
        <span className="block text-xs text-ink-soft">
          {hicIlerleme ? t('Telefonda başla, bilgisayarda sürdür.') : t('Üye ol, cihaza bağlı kalmasın.')}
        </span>
      </span>
      <span className="text-sm font-extrabold text-ink" aria-hidden>
        ›
      </span>
    </button>
  );
}
