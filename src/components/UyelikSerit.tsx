import { useUyelik, uyelikVarMi } from '../uyelik';

/**
 * ANA EKRANDAKI UYELIK SERIDI.
 *
 * Ders sonundaki davet tek basina yetmiyordu: kullanici gunlerce girip
 * cikiyor ve ilerlemesinin yalnizca bu cihazda oldugunu hicbir yerde
 * gormuyordu. Serit o bosluğu dolduruyor — surekli duruyor ama ince, ve
 * hicbir seyi engellemiyor.
 *
 * UC HALI VAR:
 *   hic uye degil   — kac kelimenin risk altinda oldugunu SAYIYLA soyler
 *   uye, bilgi eksik — "uyeligini tamamla"
 *   uye ve tamam    — hic gorunmez
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
  const { uye } = useUyelik();

  if (!uyelikVarMi()) return null;
  if (uye?.bilgi?.tamam) return null;

  const eksikBilgi = Boolean(uye);
  /*
    Hic kelime yokken de gorunuyor ama metni degisiyor: "0 kelimen risk
    altinda" demek anlamsiz olurdu. Bir sure sifirda hic gosterilmiyordu;
    karar degisti, cagri surekli dursun istendi.
  */
  const hicIlerleme = !eksikBilgi && ogrenilen === 0;

  return (
    <button
      onClick={onAc}
      className="rise flex w-full items-center gap-3 rounded-2xl border border-spark bg-spark-soft px-4 py-3 text-left transition active:scale-[0.99]"
    >
      <span className="text-lg leading-none" aria-hidden>
        {eksikBilgi || hicIlerleme ? '🙂' : '⚠️'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-ink">
          {eksikBilgi
            ? 'Üyeliğini tamamla'
            : hicIlerleme
              ? 'Üye ol, ilerlemen kaybolmasın'
              : `${ogrenilen} kelimen yalnızca bu cihazda`}
        </span>
        <span className="block text-xs text-ink-soft">
          {eksikBilgi
            ? 'Otuz saniye sürer.'
            : hicIlerleme
              ? 'Telefonda başla, bilgisayarda sürdür.'
              : 'Üye ol, cihaza bağlı kalmasın.'}
        </span>
      </span>
      <span className="text-sm font-extrabold text-ink" aria-hidden>
        ›
      </span>
    </button>
  );
}
