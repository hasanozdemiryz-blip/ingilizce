import { describe, expect, it } from 'vitest';
import { PANO_MAX, panoKancalari } from './share';
import { CARDS } from './content';

/**
 * PANONUN SINIRI SETTEN GERI KALMAMALI.
 *
 * Bu test bir davranisi degil, bir SOZU tutuyor: "seti bitiren kullanicinin
 * paylastigi sey eksiksiz olsun". Soz dort kez kirildi (24/26, 26/51,
 * 60/100) ve her seferinde ayni sekilde — sinir sabit kaldi, set buyudu,
 * kimse fark etmedi. Gorsel ancak tarayicida cizdirilince goruluyor,
 * yani gozle yakalanmasi mumkun degildi.
 *
 * Set yine buyurse bu test duser. Dusunce yapilacak sey `PANO_MAX`i
 * buyutmek DEGIL once: `duzen()` o kadar satiri okunur bicimde cizebiliyor
 * mu, ona bakmak. Cizemiyorsa pano bolunmeli.
 */
describe('kanca panosu', () => {
  /*
    Eskiden "tam set tek panoya sigiyor" diye tutuluyordu; set 200'e cikinca
    (6 Ekim) bu artik mumkun degil. Korunan kural asil olan: pano tasarsa
    bile YAZDIGI sayi CIZDIGI sayiyla ayni.
  */
  it('pano tasinca cizilen ve yazilan sayi ayni kaliyor', () => {
    const tumu = CARDS.map((c) => ({ en: c.en, hook: c.hook }));
    expect(panoKancalari(tumu).length).toBe(Math.min(tumu.length, PANO_MAX));
  });

  it('sinir duzenin cizebildigi en buyuk panoyu asmiyor', () => {
    // 4 sutun x 26 satir — `duzen`in son kademesi. Uzeri satir yuksekligini
    // 25 pikselin altina indirir ve 20 puntoluk yazi ust uste biner.
    expect(PANO_MAX).toBeLessThanOrEqual(104);
  });
});
