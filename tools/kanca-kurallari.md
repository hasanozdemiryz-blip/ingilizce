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
