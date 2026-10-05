import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EN } from './dil/en';
import { HAYVANLAR, SIFATLAR } from './profil';

/**
 * Ingilizce arayuzun TAMLIGI.
 *
 * Kaynak metinler Turkce ve kodun icinde (bkz. dil.ts). Sozlukte karsiligi
 * olmayan metin Ingilizce arayuzde Turkce gorunur ve kimse fark etmez —
 * ta ki bir kullanici ekran goruntusu atana kadar. Bu test derlemeden once
 * yakaliyor.
 */

const KOK = join(import.meta.dirname);

function dosyalar(klasor: string): string[] {
  return readdirSync(klasor).flatMap((ad) => {
    const yol = join(klasor, ad);
    if (statSync(yol).isDirectory()) return ad === 'dil' ? [] : dosyalar(yol);
    if (!/\.(ts|tsx)$/.test(ad) || /\.test\./.test(ad)) return [];
    // Gelistirme paneli uretime girmiyor (bkz. DevPanel).
    if (ad === 'DevPanel.tsx' || ad === 'quality.ts') return [];
    return [yol];
  });
}

/** Yorumlar atiliyor: icindeki Turkce aciklama arayuz metni degil. */
const yorumsuz = (s: string) =>
  s
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"`])\/\/[^\n]*/g, '$1');

const KAYNAKLAR = dosyalar(KOK).map((yol) => ({ yol, metin: yorumsuz(readFileSync(yol, 'utf8')) }));

const TURKCE = /[çğışöüÇĞİŞÖÜ]/;

/**
 * Turkce ama arayuz metni OLMAYAN dizgiler — bilincli istisnalar.
 * Buraya eklemeden once metnin gercekten ekranda gorunmedigine bak.
 */
const ISTISNA = [
  /'i̇yi haber'|'kötü haber'/, // speech.ts: elenen ses adlari
  /Hafızada İngilizce ezbersiz/, // share.ts: yazi tipini onceden yukleyen dizgi
  /Gecersiz yedek dosyasi/, // db.ts: ic hata; ekranda Ayarlar'in kendi metni cikiyor
  /Dosya okunamadi/, // dosya.ts: ic hata
  /Görsel okunamadı/, // ProfilDuzenle: ic hata; ekranda kendi metni cikiyor
  /çğıöşü|ç: 'c'|\/ı\/g|\/ğ\/g|\/ü\/g|\/ş\/g|\/ö\/g|\/ç\/g/, // harf katlama kurallari
  /'Hafızada İngilizce'|"Hafızada İngilizce"/, // marka adi cevrilmiyor
  /ctx\.fillText\(/, // share.ts: paylasilan kanca panosu gorseli Turkce icerik
  /\{ kod: 'tr', ad: 'Türkçe' \}/, // DilSecici: her dil kendi adiyla yaziliyor
  /^\s*(Hafızada|İngilizce)\s*$/, // TabBar: marka kilidi (lang="tr")
  // profil.ts: rastgele ad listeleri; kullanildiklari yerde t() ile cevriliyor
  // ve karsiliklari asagidaki ayri testte denetleniyor.
  /^\s*('[^']+',\s*)+$/,
  /\{ ad: '[^']+', dosya: '/,
];

describe('arayuz dili', () => {
  it("her t('...') metninin Ingilizce karsiligi var", () => {
    const eksik = new Set<string>();
    for (const { metin } of KAYNAKLAR) {
      for (const m of metin.matchAll(/\bt\(\s*(?:'((?:\\'|[^'])*)'|"([^"]*)")/g)) {
        const anahtar = (m[1] ?? m[2]).replace(/\\'/g, "'");
        if (!(anahtar in EN)) eksik.add(anahtar);
      }
    }
    expect([...eksik].sort()).toEqual([]);
  });

  it("Turkce arayuz metni t() disinda kalmadi", () => {
    const kalan: string[] = [];
    for (const { yol, metin } of KAYNAKLAR) {
      const satirlar = metin.split('\n');
      satirlar.forEach((satir, i) => {
        if (!TURKCE.test(satir)) return;
        if (ISTISNA.some((r) => r.test(satir))) return;
        // t(...) cagrilarini ve import satirlarini cikar, geriye Turkce kaliyor mu?
        const temiz = satir
          .replace(/\bt\(\s*(?:'(?:\\'|[^'])*'|"[^"]*")/g, 't(')
          .replace(/^\s*import .*$/, '');
        if (TURKCE.test(temiz)) kalan.push(`${yol.slice(KOK.length + 1)}:${i + 1}: ${satir.trim()}`);
      });
    }
    expect(kalan).toEqual([]);
  });

  /*
    Turkce harfi OLMAYAN metinler ("Atla", "Devam") yukaridaki testten
    kaciyor. Iki kalip ayrica aranıyor: cok satirli bir etiketin ardindan
    gelen duz metin satiri ve sabit yazilmis erisilebilirlik nitelikleri.
  */
  it('Turkce harfsiz arayuz metni de t() disinda kalmadi', () => {
    const kalan: string[] = [];
    for (const { yol, metin } of KAYNAKLAR) {
      if (!yol.endsWith('.tsx')) continue;
      const L = metin.split('\n');
      L.forEach((satir, i) => {
        const once = (L[i - 1] ?? '').trimEnd();
        const st = satir.trim();
        const etiketSonrasi =
          once.endsWith('>') &&
          !once.endsWith('=>') &&
          st &&
          !/^[{<)}+%“"]/.test(st) &&
          /[A-Za-z]{2}/.test(st) &&
          !/[=;(]/.test(st);
        const nitelik = /(aria-label|placeholder|alt|title)="[^"]*[A-Za-z]{2}/.test(satir);
        if ((etiketSonrasi || nitelik) && !/Hafızada İngilizce|Dil \/ Language|^\s*(Hafızada|İngilizce)\s*$/.test(satir)) {
          kalan.push(`${yol.slice(KOK.length + 1)}:${i + 1}: ${st}`);
        }
      });
    }
    expect(kalan).toEqual([]);
  });

  it('rastgele profil adlarinin parcalari cevrilmis', () => {
    const eksik = [...SIFATLAR, ...HAYVANLAR.map((h) => h.ad)].filter((k) => !(k in EN));
    expect(eksik).toEqual([]);
  });

  it('yer tutucular iki dilde ayni', () => {
    const tutucular = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const bozuk = Object.entries(EN).filter(
      ([tr, en]) => tutucular(tr).join() !== tutucular(en).join(),
    );
    expect(bozuk).toEqual([]);
  });
});
