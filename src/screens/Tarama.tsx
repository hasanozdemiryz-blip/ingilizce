import { useRef, useState } from 'react';
import { BackButton, Button, Card, Screen, SpeakButton, TopBar } from '../components/ui';
import { db } from '../db';
import { markKnown } from '../scheduler';
import type { Card as CardType, Progress } from '../types';
import { t } from '../dil';

/** Taramada sorulan en fazla kelime — "2 dakika" sozu bunun ustune kurulu. */
export const TARAMA_SAYI = 40;

type Props = {
  /** Sorulacak kelimeler: Baslangic seviyesinden, henuz tanisilmamis */
  kartlar: CardType[];
  progress: Progress[];
  /** Tarama bitti ya da yarida birakildi; kac kelime "biliyorum" dendi */
  onBitti: (bilinen: number, sorulan: number) => void;
  onExit: () => void;
};

/**
 * TARAMA — "biliyorum / bilmiyorum" (KARARLAR 5).
 *
 * Uyelikte seviyesini "Biraz" ya da "Orta" diyen kisi Baslangic'in
 * kelimelerini bastan ogrenmek zorunda kalmasin: kelime gosterilir, iki
 * dugmeden biri. "Biliyorum" denen kelime derslerden cikar (ders icindeki
 * "Bunu biliyorum" ile ayni kayit, bkz. scheduler `markKnown`); Kelimeler
 * ekranindaki "Bildiklerim"den geri alinabilir.
 *
 * Anlam GOSTERILMEZ: gosterilseydi soru "biliyor musun" degil "taniyor
 * musun" olurdu. Kayit her cevapta ANINDA yaziliyor; yarida birakan
 * kaybetmesin.
 */
export function Tarama({ kartlar, progress, onBitti, onExit }: Props) {
  // Liste tarama boyunca SABIT: her cevapta progress degisiyor ama
  // sorulacaklar bastaki halleriyle kalmali.
  const [liste] = useState(() => {
    const kapali = new Set(progress.filter((p) => p.introduced || p.bilinen).map((p) => p.cardId));
    return kartlar.filter((c) => !kapali.has(c.id)).slice(0, TARAMA_SAYI);
  });
  const [i, setI] = useState(0);
  const bilinen = useRef(0);
  const bitti = i >= liste.length;

  const cevap = async (biliyor: boolean) => {
    const c = liste[i];
    if (biliyor) {
      bilinen.current++;
      await db.progress.put(markKnown(c));
    }
    if (i + 1 >= liste.length) onBitti(bilinen.current, i + 1);
    setI(i + 1);
  };

  return (
    <Screen yanMenusuz>
      <TopBar
        left={
          <BackButton
            onClick={() => {
              if (!bitti && i > 0) onBitti(bilinen.current, i);
              onExit();
            }}
          />
        }
        right={!bitti && `${i + 1} / ${liste.length}`}
      />
      <div className="flex-1 flex flex-col justify-center gap-4 pb-10">
        {bitti || liste.length === 0 ? (
          <Card className="text-center py-8">
            <p className="word text-2xl font-extrabold">{t('Tarama bitti')}</p>
            <p className="text-ink-soft mt-2 text-sm">
              {t('{n} kelimeyi bildiğini söyledin; derslere girmeyecekler. Yanıldıysan Kelimeler › Bildiklerim’den geri alabilirsin.', {
                n: bilinen.current,
              })}
            </p>
            <Button className="mt-5" onClick={onExit}>
              {t('Derslere dön')}
            </Button>
          </Card>
        ) : (
          <>
            <p className="text-center text-sm font-bold text-ink-soft">{t('Bu kelimenin anlamını biliyor musun?')}</p>
            <Card className="flex flex-col items-center gap-3 py-10">
              <p className="word text-[2.5rem] leading-none font-extrabold text-center">{liste[i].en}</p>
              <SpeakButton word={liste[i].en} size="small" />
            </Card>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="soft" onClick={() => void cevap(false)}>
                {t('Bilmiyorum')}
              </Button>
              <Button variant="brand" onClick={() => void cevap(true)}>
                {t('Biliyorum')}
              </Button>
            </div>
            <p className="text-center text-xs text-ink-faint">
              {t('Emin değilsen “Bilmiyorum” de; çağrışımıyla öğrenirsin.')}
            </p>
          </>
        )}
      </div>
    </Screen>
  );
}
