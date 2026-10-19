# Kanca kuralları — yeni kelime ya da kanca cümlesi yazarken

Bu dosya 7 Ekim 2026'da, kullanıcıyla üç tur düzeltmeden sonra oturan
mantığı tutuyor. Yeni kelime eklerken, kanca ya da cümle değiştirirken
**önce bunu**, görsel üretirken ayrıca `tools/gorsel-recetesi.md`'yi oku.

## Kanca

1. **Gerçek bir Türkçe kelime** olsun, İngilizce okunuşa yakın:
   dock ≈ **dokun**, brake ≈ **bırak**, nerve ≈ **nevri**, blade ≈ **biley**.
   "breyn", "şugar", "vayp" gibi okunuşun yazımı kanca değildir.
2. **Bir kartın kancası başka bir kartın anlamı olamaz.** ball'un kancası
   "bal" iken honey ≈ "hani" olmaz; brake'in anlamı "fren" iken friend ≈ "fren"
   olmaz (→ "frenk"). `node tools/yeni-kelimeler.mjs` bunu setle ve kendi
   içinde denetler; çakışmada durur.
3. **İngilizcede başka bir kelimeyi çağırmasın.** boat ≈ "bot" iyi ama görselde
   bot *ayakkabı* çizilirse öğrenci "boot" ile karıştırır. boot ≈ **but**.
4. Aynı kanca iki kartta kullanılmaz.
5. Kanca = anlam olan tanıdık kelimeler (lamp ≈ lamba, pilot ≈ pilot) kanca
   gerektirmez; cümleleri olduğu gibi kalır, yeni kelime seçerken alınmaz.

## Çağrışım: ses VE yazılış (18 Ekim 2026)

Kullanıcıya "kanca" denmez, **çağrışım** denir (kodda ve notlarda "kanca"
kalır). Bir kelime **Hafıza Teknikli** sayılır, eğer:

- **Ses çağrışımı:** okunuşu gerçek bir Türkçe kelimeye benziyor —
  succeed ≈ **saksı**, duty ≈ **düdük**, genius ≈ **cin**, ancient ≈ **enişte**.
- **Yazılış çağrışımı:** yazılışının içinde gerçek bir Türkçe kelime görünüyor —
  **deli**cious, des**sert**, **dev**ice, re**fuse** (füze), **in**vite,
  **at**tend, in**credi**ble (kredi), **tas**ty. Rakiplerde yok; **farkımız**.
- İkisi birden en güçlüsü: **sur**vive (sur), **deli**cious.

**Zorla, olmazsa sadeleştir.** Her kelimede önce ses, sonra yazılış
çağrışımı aranır; iki parçalı ("ek sepet") ve iki kelimelik kancalar serbest.
Sonuç **çok alakasız** kalırsa kelime **görsel çağrışım** olur: kanca yok,
anlamı gösteren tek sahne. Yukarıdaki 14 örnek kullanıcı onaylı ölçü
(`tools/mufredat/lgs8-etiket.txt`). Yazılış çağrışımlı kartta doğru İngilizce
ses ayrıca vurgulanır (öğrenci "deliciyus" diye okumasın).

## Güvenlik — Çocuk ve LGS (18 Ekim 2026)

Kanca, cümle ve görselde **olmaz**: silah, şiddet, suç; alkol, sigara, gece
hayatı; din ve siyaset (din adamı, dini yapı kanca olmaz); korku, ölüm, kan;
engel, beden ya da görünüşle alay; romantik/cinsel ima; çocuğun taklit
edebileceği tehlike; hakaret olarak da kullanılan kelime ("it" köpek anlamıyla).
Kelimenin kendisi böyleyse (gun, tomb, burglary) Çocuk'a girmez; LGS'de
yalnız metin ya da en masum sahne (gun → su tabancası). 18 Ekim'de
düzeltilen kartlar: gun, night, shake, slap, rob, eat, referee
(`tools/guvenlik-cumleleri.mjs`).

## Cümle

- **Kanca ile anlam aynı sahnede ve birbirine bir şey YAPIYOR.**
  ✓ "Botla tekneye çarptık" · "Tır kamyonu solladı" · "Koç antrenörü tosladı"
- **Kısa:** kanca + anlam + tek fiil. Fazladan nesne/sahne ekleme.
  ✗ "Rotayı çizdim, yol haritadan taştı" → ✓ "Rotayı çizdim, yolum belli"
- **Tanım cümlesi yok:** ✗ "Bot küçük bir tekne", ✗ "Tim bir takımdır".
- **"=" ve "gibi" yok:** ✗ "Kap = fincan", ✗ "Pilav gibi kabarık yastık".
- **Çalışan cümleye dokunma.** Kancanın anlamı doğrudan taşıdığı kısa
  cümleler iyidir: "Şort kısa", "Kot ceket", "Forklift çatallıdır",
  "Futbol ayakla oynanır". Kullanıcı bunlar için "süper, kalsın" dedi.
- Saçmalık iyidir ama ancak öğe eklemeden geliyorsa
  ("Mopetle paspas yaptı", "Kaynana çok nazik çıktı").

## Akış (bir tur)

1. Adaylar `tools/yeni-kelimeler.json`'a (en|anlam|kanca|cümle|ses 3/2|not),
   sıra = derste çıkış sırası, sık kullanılan önce.
2. `node tools/yeni-kelimeler.mjs` → `yeni-kelimeler.xlsx`; kullanıcı
   "SENİN KARARIN" sütununu doldurur (elle yazılanlar yeniden üretimde korunur).
   Mevcut kartların cümlelerini puanlamak için aynı düzen:
   `tools/kanca-cumleleri.{json,mjs}` → `kanca-cumleleri.xlsx`.
3. Onaylananlar `kart-havuzu-300.xlsx`'e sonraki sıra numarasıyla eklenir
   (sütunlar: #, Kelime, Anlam, Zorluk, Kanca, Cümle, Sınıf, Görsel notu, Karar),
   sonra `npm run import:cards`.
4. Görsel: sahne İngilizce tek cümle, kanca ile anlamın etkileşimini
   gösterir → `tools/gorsel-sahneleri.json`. Reçete ve dersler
   `tools/gorsel-recetesi.md`'de. **Kredi harcar: adet ve kredi söylenip
   kullanıcı onayıyla** (75 kredi/görsel; ~%10 yeniden deneme).
5. 12'lik partiler, her parti `gorsel-izgara.mjs` ile kontrol; kenara taşan,
   metin çıkan, eylemi yanlış çizilen görsel yeniden üretilir.
6. `npm run import:images` → test → build → site → iki depo push
   (kullanıcı onayıyla).

## Görülmüş tuzaklar

- Görselde anlam (tekne) öne çıkmalı, kanca (bot ayakkabı) değil.
- Eylem görselde zorlanmalı: "dişiyle tuşa bastı" → model elle yazdırıyor;
  "elleri arkada bağlı" ile düzeldi. Ayrıntılar reçetede.
- Kanca nadir/argo ise (luzer) kullanıcıya sor; o "lazer"i seçti.
