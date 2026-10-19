import { Button, Card } from './ui';
import { TARAMA_SAYI } from '../screens/Tarama';
import { t } from '../dil';

/**
 * Ana ekranda, ders kartinin ustunde, BIR KEZ: bildigi kelimeleri
 * derslerden cikarmak isteyene kisa tarama. Gecilebilir; gecilince bir
 * daha cikmaz (Ayarlar'da seviye degisse de).
 */
export function TaramaDaveti({ onBasla, onGec }: { onBasla: () => void; onGec: () => void }) {
  return (
    <Card className="rise">
      <p className="text-sm font-bold text-ink-soft">{t('2 dakikalık tarama')}</p>
      <p className="word text-xl font-extrabold mt-0.5">{t('Bildiğin kelimeleri atla')}</p>
      <p className="text-sm text-ink-soft mt-1 mb-4">
        {t('{n} temel kelime göstereceğiz; bildiklerin derslere girmez.', { n: TARAMA_SAYI })}
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="ghost" className="!py-3" onClick={onGec}>
          {t('Gerek yok')}
        </Button>
        <Button variant="brand" className="!py-3" onClick={onBasla}>
          {t('Taramaya başla')}
        </Button>
      </div>
    </Card>
  );
}
