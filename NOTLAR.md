# Çalışma notları

Kararların **neden** öyle olduğunu tutar. Ne yapıldığı git geçmişinde,
nasıl çalıştığı README'de; burası sebepler için.

---

## 2026-09-18 — Merdiven, tek akış ve puanlama

Tek oturumda yapılan büyük yeniden kurgu. Sıralı olarak ne değişti ve niçin.

### Ölçüm bozuktu

`firstRecallOk` ilk tekrarda, yani kart hâlâ L3'teyken ölçülüyordu. L3 soru
yüzünde görsel, kanca **ve cümle** var — ve cümlelerin **%80'inde Türkçe
karşılık geçiyor** (`door/kapı → "Kapıda DUR"`). Yani neredeyse her zaman
`true` dönecekti. Ölçtüğü şey "hatırladın mı" değil **"okuyabildin mi"**ydi.

Bunu veriyle doğruladım: 100 kartın 80'inde cevap cümlenin içinde.

Ölçüm noktaları baştan tanımlandı: kancanın **ekranda olmadığı** basamaklardan
önce alınan hiçbir "doğru" kanca hakkında bir şey söylemiyor.

### İki eksen tek merdivene indi

`support` (3→0) + `stage` (recall/produce/listen) yerine tek `step` (1–6):

```
1 Eşleştirme · 2 Çoktan seçmeli · 3 Ters seçmeli
4 Harf dizme · 5 Yazma · 6 Dinleme
```

Sebep: kullanıcı iki ekseni anlamıyordu, kodda iki kavram taşımak da
gereksizdi. Kayıp: "kart uzun aralıkta ama hâlâ çok destekli" gibi ince
durumlar artık ifade edilemiyor — bilinçli takas.

Geçiş kuralı üç durumlu: **yanlış** geri · **kancayla doğru** yerinde ·
**yardımsız doğru** ileri. Ortadaki önemli — ipucu kullanmak başarısızlık
değil, aracı kullanmaktır; doğru cevabı geri atmak kullanıcıyı ipucundan
kaçınmaya, sonra tahmin etmeye iter.

### Beyan yerine ölçüm

Tanış'ta *"Kanca tuttu mu? [Tuttu] [Tutmadı]"* soruluyordu ve cevap ilk FSRS
notu oluyordu. Bu bir **beyan**dı. Kaldırıldı: artık tanışmanın hemen
ardındaki öğrenme testi hem ilk notu veriyor hem kancanın tutup tutmadığını
**ölçüyor**.

### Tek akış

Üç giriş noktası (Tanış · Tekrarla · Deste testi) tek "Başla"ya indi.
Kullanıcı her açılışta "hangisine basayım" diye düşünüyordu. Ders üç bölüm
hâlinde arka arkaya geliyor: yeni kelimeler → öğrenme testi → tekrar.

Deste kavramı tamamen kalktı — 20 numaralı kare "ilerleme göstergesi" değil
karar yükü yaratıyordu.

### Ders bütün

Yeni kelimeler önce bellekte tutulur, veritabanına ancak öğrenme testi
bitince yazılır. Önce her kart görülür görülmez yazılıyordu; yarıda çıkan
kullanıcının kartları "tanışıldı" sayılıp öğrenme testini hiç görmüyor,
ertesi gün 1. basamakta geri geliyordu — ne bitmiş ne bitmemiş.

Çıkışta kart içi uyarı: ne kaybedileceği açıkça yazıyor. Tarayıcının
`confirm()` kutusu kullanılmıyor — PWA'da bloklayan sistem diyalogu.

### Günlük hedef gerçek sınır

Bir ara tavan kaldırılmıştı; sonucu tekrar borcunun sessizce şişmesiydi.
Günde 15'in üstü, ertesi gün kaldırılamayan bir tekrar yığını demek.
Ayarlar'dan 5/10/15, **15 aşılamaz**. Dolunca ana ekran **"Hızlı tekrar"**a
döner ve gün boyunca orada kalır.

### Puanlama

"Nerede duruyorsun" altı satır sayı gösteriyordu — bir **dağılım**, bir
değerlendirme değil. Yerine iki yüzde:

- **Başarı** — cevapların ne kadarı doğru (Gün/Hafta/Ay). Bunun için
  doğru/yanlış **gün bazında** kaydedilmeye başlandı; önce yalnızca kaç kart
  çalışıldığı tutuluyordu.
- **Ustalık** — kelimelerin merdivendeki ortalama yüksekliği.

Ders bitişinde seansın kendi oranı, yanında **"N kelime bir basamak
ilerledi"**. İkincisi daha önemli: doğru cevap vermek ilerlemek demek değil.
Sıfırsa satır hiç gösterilmez.

### "Kelimelerin nerede" yanıltıcıydı

Panel basamakları birbirini dışlayan üç kutuya bölüyordu. Kullanıcı anlamadı;
açıklarken asıl sorun çıktı: gösterim **yanlıştı**. *"Tanıma 2"* yazınca
"sadece 2 kelimeyi tanıyorum" gibi okunuyor, oysa hepsini tanıyor — ikisi o
basamakta *duruyor*.

Beceri birikimli: 5. basamaktaki kelime 3'ten geçerek geldi. Panel artık
"Neler yapabiliyorsun" ve sayım birikimli — üç çubuk iç içe doluyor.

### Kalite panelleri kullanıcıdan çekildi

"Kancalar nasıl gidiyor" ve "Gözden geçirilecek kancalar" İlerleme
sekmesindeydi. Kullanıcı ikisini de anlamadığını söyledi — haklıydı, çünkü
ikisi de **öğrenene değil içerik yazarına** bakıyordu.

İki ayrı sorun vardı: öğrenen için gürültü, yazar için de tek kişinin verisi
karar vermeye yetmiyor. Bu ölçüm ancak çok kullanıcıdan toplanınca anlam
kazanır ve local-first olduğu sürece yazara zaten ulaşmıyor.

Sinyaller toplanmaya devam ediyor (yedeğe de giriyor), paneller geliştirme
panelinde duruyor. Backend geldiğinde asıl yerine oturur.

### Isı haritası kaldırıldı

12 haftalık takvim: serinin zaten söylediğini 84 kareyle tekrar ediyordu,
*"ceza yok"* ilkesine aykırı bir **kaçırılan günler defteri**ydi, telefon
genişliğine sığmıyordu — ve en önemlisi *çalıştığını* gösteriyordu, *ne kadar
iyi* çalıştığını değil. Düzenlilik tek satıra indi: "Son 7 günde 3 gün
çalıştın."

*(Kaldırılmadan önce gerçek bir hizalama hatası da bulunmuştu: son 84 gün
alınıp yedişerli dilimleniyordu, sütunlar haftanın rastgele bir gününden
başladığı için "Pt / Ça / Cu" etiketleri yanlış günleri gösteriyordu.)*

### Yazı karakteri: Fredoka → Nunito

Başlık fontunda **ğ, Ğ, İ, Ş, ş glifleri yoktu** — fontun tamamını indirip
glif tablosunu okudum: 320 glif, o beş harf yok. Türkçe bir uygulamada başlık
fontu olamaz.

Ayrıca `latin` @font-face'lerinde `unicode-range` eksikti. Aralığı olmayan bir
yüz tüm Unicode'u kapsadığını iddia edip `latin-ext`'i eziyor; `ş` aslında
latin-ext dosyasında **var**ken tarayıcı onu, o glifi içermeyen latin
dosyasına yönlendirip sistem fontuna düşürüyordu. Bu hata tek başına bile
gövde metnini bozuyordu.

`.word` kuralı katman dışında olduğu için Tailwind'in `font-semibold` /
`font-bold` sınıflarını da eziyordu — 20 yerde yazılı ağırlık sınıfı ölü
koddu, her başlık 600'de çiziliyordu.

### Telaffuz

Tarayıcının ses sentezi; dosya, backend, API anahtarı yok. **Nerede çaldığı
bilinçli:** kanca `sell ≈ sel` derken yanlış telaffuz öğretiyor, o yüzden
doğru ses kanca ekrandan kalkarken (3. basamak) devreye giriyor.

Ses seçiminde gerçek bir tuzak vardı: macOS'ta `en-US` listesinin yarısı
**şaka sesi** (Bahh meliyor, Boing zıplıyor, Zarvox robot) ve alfabetik ilk
sıra "Albert". Tercih listesi tutmazsa uygulama telaffuzu bir karikatür sesle
öğretecekti. `pickVoice` saf fonksiyona çıkarıldı ve gerçek macOS listesiyle
test edildi. İsimlerin yerelleştiği de ortaya çıktı ("Good News" → "İyi Haber").

### Giriş akışı

Üç adım: vaat → **kendin dene** → günlük hedef → doğrudan ilk ders.

2. adım asıl olan. Önce kart yalnızca *gösteriliyordu*; kullanıcı "güzelmiş"
deyip geçiyor ama kancanın işe yaradığına **inanmıyordu**, çünkü kendi
denemedi. Şimdi 15 saniyede kendi hafızasının çalıştığını görüyor.

**Eklenmeyenler:** isim sorma (hesap yok, karşılığı olmayan sürtünme) · seviye
testi (havuz sıklık sırasında) · çok ekranlı tur (kimse okumuyor) · ses izni
ekranı (telaffuz 3. basamakta başlıyor).

### Logo

Yatay kilit 28px başlıkta yazısı ~10px'e düşüyor, okunmuyordu — kilitler
~40px altında çalışmaz. Logo uygulama içinden tamamen kalktı, açılış ekranına
taşındı (orada işaret + isim + her açılışta değişen bir kanca çifti).
Başlıkta isim **metin** olarak duruyor.

---

## Tarayıcıda tıklayarak bulunan hatalar

Elle test olmadan hiçbiri görünmüyordu.

| Hata | Neydi |
|---|---|
| Kartlar kaydedilmiyordu | Ders bitiyor, veritabanı boş kalıyordu — `introduceCard` hiç çağrılmıyormuş |
| "Kancayı göster" yanlış yerde | L1/L2'de de çıkıyordu ama kanca zaten ekrandaydı; basınca **cümleyi** açıyor, cevabı sızdırıyordu |
| Geri bildirim etiketi ters | `Doğrusu  c̶a̶t̶` — yani "doğrusu cat" gibi okunuyordu |
| Şıklar yeniden karışıyordu | `secenekler` her render'da çağrılıyordu; ipucuna basınca seçenekler parmağın altında yer değiştiriyordu |
| Eşleştirmede hata görünmüyordu | Sadece Türkçe karo kızarıyor, İngilizce olan sessizce seçimi bırakıyordu |
| Düğmeler alt menünün altında | Egzersiz ve seçim ekranlarında; menü gizlenerek çözüldü |
| Kelimelerim'de çift hoparlör | |
| Türkçe sayı eki | "41'si doğru" yanlış — ekler sayının okunuşuna göre değişiyor (41'i, 6'sı, 3'ü). Ek gerektirmeyen ifadeye çevrildi |
| Deste testi tekrardan kolaydı | 4 şıklı ve çeldiriciler aynı desteden geliyordu; eleme ile geçilebiliyordu |

---

## Kart görselleri

100 kartın görseli Magnific üzerinden **Nano Banana Pro** (`imagen-nano-banana-2`)
ile üretiliyor. 4:3, `seed 20260918`, stil referansı olarak elle üretilmiş
`snake` kartı veriliyor.

**Tutarlılık nasıl sağlanıyor.** Bu hesapta LoRA / stil eğitimi yok, kütüphane
boş, flow tanımlı değil. Geriye üç kaldıraç kalıyor ve üçü birden gerekiyor:
aynı **stil referansı**, aynı **prompt iskeleti**, aynı **seed**. Üçünden biri
değişince çizgi kalınlığı ve palet kayıyor.

Prompt iskeleti sabit bloklardan kuruluyor: sahne tarifi → KOMPOZİSYON →
(insan varsa) YÜZ + KARAKTER → "beyaz kontur yok" → "kesinlikle düz dolgu" →
kontur ağırlığı → ARKA PLAN tonu → cansız nesnenin yüzü olmaz → metin kuralı.
Her kart yalnızca ilk satırını ve arka plan tonunu değiştiriyor.

### Üretimde öğrenilenler

| Ders | Neden |
|---|---|
| "Özne çerçeveyi doldursun" deme | Model bunu "taşır" diye anlıyor; 5 görselin 4'ü alt kenardan kesildi. Doğrusu: "%75 yükseklik, dört kenarda eşit boşluk, hiçbir şey kenarı geçmesin" |
| İnsanı tam gövde iste | Gövdesiz uzuv (`foot` ilk hali) kesik uzuv gibi çıkıyor, rahatsız edici |
| Kıyafeti açıkça yaz | Yazmayınca çıplak gövde çiziyor (`laugh` ilk hali) |
| Kalabalığı tek tek yasakla | `deep`'e denizaltı, batık gemi, hazine sandığı koydu; "balık yok, denizaltı yok, batık yok" deyince düzeldi |
| Ölçek farkını nesneyle kur | `large`'da insan + dev gömlek iki denemede de aynı boyda çıktı; iki kutu tek denemede tuttu |
| Spor/nesne adını tarif et | "football" → Amerikan futbolu topu. "round soccer ball with black pentagon patches" → doğru |
| Gölgeyi ayrıca yasakla | "NO drop shadow" yetmiyor, "NO ground shadow, NO ambient occlusion" da gerekiyor |
| 3B montaj parçası yasakla | `door`'da DUR levhasını duvara metal braketle monte etti; "flat against the wall, no bracket, no shadow, no 3D depth" ile düzeldi |

**Türkçe metin sorun değil.** `SATILIK`, `DUR`, `DİP`, `FUL`, `SON` hepsi ilk
denemede doğru çıktı — `İ` dahil. Metin gereken kartlarda kelimeyi prompt'a
yazmak güvenli.

### Kredi hesabı

| Aşama | Görsel | Kredi |
|---|---:|---:|
| İlk deneme (tuz, stil arayışı) | 2 | 150 |
| Deste 1 ilk tur | 5 | 375 |
| `door` + `dust` düzeltme turları | 6 | 450 |
| Deste 1 kalan üçü | 3 | 225 |
| Deste 2–5 | 20 | 1.500 |
| Düzeltmeler (`eye` `foot` `laugh` `large` `deep` `sun`) | 6 | 450 |
| Son iki düzeltme (`foot` `large`) | 2 | 150 |
| **Toplam** | **44** | **3.300** |

Görsel başına liste fiyatı 75 kredi. Teslim edilen 26 kart için 3.300 kredi
harcandı — kart başına **~127 kredi**, yani ortalama **1,7 deneme**. Kalan 74
kart için ham maliyet 5.550, aynı tekrar oranıyla gerçekçi tahmin **~6.700**.

### Boru hattı

`gorseller/<kart-id>.png` → `npm run import:images` → `src/assets/cards/<kart-id>.webp`
(800×600, 4:3, q82). `content.ts` klasörü `import.meta.glob` ile tarıyor —
`cards.json`'a dokunmaya gerek yok, dosyayı koyman yeter.

Kart başına ortalama **14 KB**. 100 kart ≈ **1,4 MB**; bu boyutta workbox
precache stratejisini değiştirmeye gerek yok.

> exFAT tuzağı: `gorseller/` içine kopyalarken macOS `._*` gölgeleri bırakıyor,
> importer bunları "tanınmayan kart id'si" diye uyarıyor. `find . -name '._*' -delete`.

---

## Android paketi

PWA iki yoldan telefona giriyor:

- **PWA kurulumu** — GitHub Pages adresini Chrome'da aç, "Uygulamayı yükle".
  `main`'e her push'ta kendini günceller. Günlük kullanım için bu.
- **APK** — Capacitor ile WebView'a sarılmış native paket. Sabit sürüm;
  kod değişince yeniden derlemek gerekir. Test ve paylaşım için.

**Neden Capacitor, neden TWA değil.** TWA'da adres çubuğunun kalkması için
`assetlinks.json`'un alan adının **kökünde** durması gerekiyor. GitHub Pages
projeyi `/hafizada-ingilizce/` alt dizininde servis ediyor; köke dosya koymak
ayrı bir `<kullanici>.github.io` deposu ister. Capacitor'da bu sorun hiç yok.

### APK nasıl çıkar

```
npm install
npm run build
npx cap add android          # android/ .gitignore'da, her seferinde üretilir
npm run icons:android        # uygulama simgesi + açılış — cap add üretmiyor
npm run icons:bildirim       # durum çubuğu ikonu — cap add üretmiyor
npm run android:release      # versionCode/versionName + imza yapılandırması
cd android && ./gradlew assembleDebug
```

Son iki betik `cap add android` **sonrasında** çalışmalı; ikisi de `android/`
içine yazıyor ve `android/` depoda tutulmuyor.

`icons:bildirim` atlanırsa bildirimin durum çubuğu ikonu uygulama simgesine
düşer ve beyaz bir leke olarak çıkar (bkz. aşağıda *Bildirim ikonu*).

Çıktı: `~/Library/Caches/hafizada-android/_app/outputs/apk/debug/app-debug.apk`
(~5 MB, 26 kart görseli dahil tamamen çevrimdışı).

### İki tuzak

**Gradle ara çıktıları exFAT'te duramıyor.** macOS her yeni dizinin yanına
`._ad` gölgesi bırakıyor, Gradle kaynak tarayıcısı bunu gerçek dizin sanıp
`'._drawable' is not a directory` ile patlıyor. `android/build.gradle`
`buildDirectory`'yi `~/Library/Caches/hafizada-android` altına alıyor — bu
blok `cap add android` sonrası **elle geri konmalı**, çünkü `android/`
depoda tutulmuyor.

**Java sürümü iki taraftan sıkışıyor.** Capacitor 8 **21+** istiyor (JDK 17
`invalid source release: 21` veriyor), Gradle 8.14 ise **25'i tanımıyor**
(`Unsupported class file major version 69`). Bir süre Android Studio'nun
kendi JDK'si kullanılıyordu; Android Studio güncellenince o JDK 25 oldu ve
derleme kırıldı. Doğru çözüm ikisinin arasında sabit bir sürüm:

```
brew install openjdk@21
export JAVA_HOME="/opt/homebrew/opt/openjdk@21"
export ANDROID_HOME=~/Library/Android/sdk
```

> Ders: derleme zincirini bir IDE'nin paketindeki sürüme bağlamak, IDE
> güncellenince sessizce kırılıyor. Sürümü projenin kendisi sabitlemeli.

### APK'yı telefona ulaştırmak

Tünel üzerinden **çalışmıyor**: uygulamanın service worker'ı o kaynağa kurulu
ve `navigateFallback: index.html` ayarı yüzünden `/hafizada.apk` isteğini
yakalayıp APK yerine uygulamayı açıyor. (`curl` bunu yaşamaz, service worker'ı
yoktur — yanıltıcı.) Çalışan yol: dosyayı Drive'a koyup telefondan indirmek.

---

### APK'da ses yoktu

Derlenen pakette telaffuz tamamen kayboldu: hoparlör düğmesi yok, Ayarlar'daki
"Telaffuz sesi" satırı yok, dinleme egzersizi yazmaya dönmüş. Hiçbiri hata
değildi — `telaffuzVar()` false döndüğü için üç yer de kendini doğru şekilde
gizledi. Eksik olan motorun kendisiydi.

**Sebep:** Android System WebView, Web Speech API'nin sentez tarafını
uygulamıyor; `speechSynthesis` orada tanımsız. Android **Chrome**'da var, yani
PWA kurulumunda uygulama konuşuyor, Capacitor APK'sında susuyor. iOS'un
WKWebView'ında API duruyor, orada sorun yok.

**Çözüm:** `@capacitor-community/text-to-speech` (8.0.2, `@capacitor/core >=8`
istiyor — bizim sürümle birebir). `speech.ts` artık üç durumlu bir motor
tutuyor: `web` · `native` · `yok`. Çağrı noktalarının hiçbiri değişmedi;
dosyanın başındaki *"aynı arayüz başka bir kaynağa bağlanabilir"* sözü tutuldu.

**Neden asenkron bir hazırlık adımı var.** Motorun varlığı köprüden geliyor,
render sırasında senkron sorulamıyor. İyimser davranıp düğmeyi hemen göstermek,
İngilizce ses verisi kurulu olmayan cihazda hiçbir şey yapmayan bir düğme
bırakırdı. Bu yüzden telaffuz açılışta "yok" sayılıyor, motor bulununca
`useSyncExternalStore` üzerinden arayüz kendiliğinden açılıyor —
`telaffuzVar()` yerine bileşenler `useTelaffuz()` kullanıyor.

**Native tarafta ses seçilmiyor.** `pickVoice`ın çözdüğü sorun macOS'a özgü
(şaka sesleri); Android'de varsayılan motor sesi zaten doğru tercih. Test
edilemeyen bir ses indeksi göndermek iyileştirmez, bozabilir. Web yolu ve
`pickVoice` testleri olduğu gibi duruyor.

**Boyut:** eklenti dinamik `import` ile çağrılıyor, web paketine girmiyor —
ayrı bir 1,7 KB parça olarak duruyor, yalnızca native kabukta indiriliyor.

---

## 2026-09-19 — v1 kapsamı: 26 kart ve tasarlanmış final

### Kapsamı görsel çiziyor

v1 artık 100 kart değil, **görseli hazır olan 26 kart**. Sebep parasal:
kalan 74 kartın görseli ~6.700 kredi ve elimizde tek bir D1/D7 verisi yok.
Kimsenin ulaşmadığı kartlara ödeme yapmak yerine küçük ama tam bir ürünle
çıkıp veriyi toplamak seçildi.

Kod tarafında sınır **elle tutulan bir liste değil**: `content.ts` yalnızca
`src/assets/cards/<id>.webp` dosyası olan kartları sete alıyor. Görsel
konulan kart kendiliğinden girer, `cards.json`'a dokunulmaz. Kalan 74 kart
dosyada duruyor, sette görünmüyor.

Neden ölçüt görsel: bu üründe görsel süsleme değil **yöntemin kendisi**.
Görseli olmayan kartta ekranda brief metni duruyordu — o kart kancayı
anlatmıyor, sadece bir kelime listesi oluyor. Yarım bir kartla çıkmak
yöntemin kendisini zayıf gösterirdi.

### Havuzun bitmesi bir kusur değil

26 kart, günde 10 hedefle ~3 günde biter. Eskiden o noktada ekran sıradan
bir *"Bugünlük tamam 🌿"*e düşüyordu — kullanıcı setin sonuna geldiğini
hiç anlamıyordu.

Artık iki yerde **final** var (`SetFinale`):

- **Seti bitiren dersin sonunda** — o dersin yüzdesi geri çekiliyor. O an
  "%80 aldın" anı değil "bitirdin" anı; iki başlık yan yana ikisini de
  küçültürdü. Yüzde zaten İlerleme'de duruyor.
- **Ana ekranda**, sonraki günlerde tekrar da kalmadığında.

Final yalnızca **yeni kelime getiren** derste çıkıyor. Set bittikten sonraki
tekrar dersleri de "set bitmiş" durumda biter; her seferinde kutlarsa
kutlama anlamını yitirir.

Finalin ortasındaki düğme **kanca panosu paylaşımı**. Gelir modeli kitle
üzerinden olduğu için paylaşım bir ekstra değil dağıtım kanalı, ve seti
bitiren kullanıcı paylaşmaya en yakın kişi. Altındaki satır bilinçli:
*"tekrarların devam ediyor"* — yoksa "bitti" kelimesi uygulamayı silmenin
davetiyesi olur.

Ana ekranda günlük hedef çubuğu da değişti: yeni kelime kalmadığı için
"0 / 10" her gün öyle kalacak ve kullanıcı yapmadığı bir şey yüzünden eksik
görünecekti. Set bitince çubuk "Set tamamlandı · 26 / 26" oluyor.

### Panoda 24 satır, başlıkta 26 yazıyordu

Kanca panosu en fazla 24 çift çiziyor ama başlığı `pairs.length`'ten
alıyordu. 26 kartlık sette bu, **"26 kelime, 26 kanca"** yazan ve 24 satır
gösteren bir görsel demekti — tarayıcıda çizdirmeden görünmüyordu. Sınır
26'ya çıkarıldı (tam set tek panoya sığsın) ve başlık artık çizilen satırı
sayıyor.

### Havuz testleri hangi havuza soruluyor

`judge`'ın "havuzdaki başka bir kelime asla *yakın* değil" davranışı
`short/shore` ve `dönmek/dövmek` çiftleriyle ölçülüyordu. Çiftlerin yarısı
görselsiz olduğu için artık v1 setinde yok; setin havuzuyla sorulunca
testler haklı olarak düştü.

Ayrım şu: **`judge`'ın sözleşmesi** tüm havuza sorulur (2. set geldiğinde de
geçerli olmalı), **setin kendi içinde çarpışma var mı** sorusu ise yalnızca
v1 setine. İkisi ayrı testler olarak duruyor.

---

## 2026-09-21 — Gün sınırı, ölçülen puanlama, renk sistemi

Yayın öncesi revizyon turu. İki karar geri alındı, iki ölçüm baştan kuruldu.

### Uygulama günün değiştiğini fark etmiyordu

Ana ekran, günlük hedefi dolduran bir günün **ertesinde de** "Hızlı tekrar"
diyordu. Sebep koddaydı: `new Date()` yalnızca render anında okunuyor, render
ise ancak veritabanı değişince ya da sekme değişince oluyordu. Telefonda
uygulama açık dururken gece yarısı geçilince ekran dünün durumunda donuyor.
`visibilitychange`, zamanlayıcı, gün kontrolü — hiçbiri yoktu.

`today.ts`: gün anahtarı bir store'da; sekmeye dönüşte, pencere odağında ve
dakikada bir kontrol ediliyor. Haber **yalnızca gün gerçekten değişince**
veriliyor — her tikte vermek bütün ekranı dakika başı boşuna çizerdi.
Zamanlayıcı tek başına yetmiyor (arka planda uyutuluyor), uygulamanın öne
gelmesi asıl güvenilir sinyal; ikisi birlikte tutuluyor.

Aynı temelin üstüne **"Yeni güne başla"** oturdu: o günün ilk girişinde
kahraman kart bunu söylüyor, ilk ders bitince normale dönüyor. Bilerek bir
**an**, sürekli bir etiket değil — gün içinde tekrarlanan bir "yeni gün"
anlamını yitirir.

### Geri alınan karar: doğrudan ilk derse girme

Karşılamadan sonra doğrudan derse giriliyordu ve gerekçesi "bir karar daha
eksilsin"di. Kötü tarafı şuydu: kullanıcı hazır olup olmadığı sorulmadan
derse düşüyor ve geri çıkmanın tek yolu *"ders yarıda kalacak"* uyarısı
oluyordu. Başlama kararı kullanıcıya geri verildi. Ana ekran boş kalmıyor:
ilk ders orada kendi kartı olarak duruyor (*"İlk dersin hazır"*).

### Geri alınan karar: "Dün" kapsamı

Egzersizdeki `🌙 Dün` kutusu sık sık boştu. Kullanıcının hatası değil,
**yapısal**: bir gün ara verildiğinde ya da o gün yalnızca tekrar yapıldığında
dün tanışılan kart yok. Aynı hata birinci kutuda daha büyüktü — `☀️ Bugün`
**set bitince sonsuza kadar** boşalıyor, çünkü artık hiçbir gün yeni kelime
gelmiyor.

Birim takvim gününden **derse** çevrildi: birinci kutu *en son ders*, ikincisi
*ondan önceki*. Tanım gereği çakışmazlar ve iki dersi olan herkeste ikisi de
dolu. Başlık da uyarlanıyor: bugün yeni kelime geldiyse "Bugün", gelmediyse
"Son ders". Boş kapsam kutusu artık basılamıyor — önce basılıyor, hiçbir şey
olmuyordu.

### Ayrı "eskileri tekrar et" düğmesi açılmadı

İstendi, açılmadı. Üç giriş noktasını tek *Başla*'ya indirmek bu ürünün en
büyük kazancıydı; tekrarı atlanabilir yapmak tekrar borcunu sessizce büyütür,
ki günlük hedefin 15'te sabitlenme sebebi de buydu.

Yerine üç küçük müdahale, üçü de aynı isteği karşılıyor:

- Dersin içinde **"Bölüm 2/3 · Tekrar"** göstergesi. Ayrı düğme isteği
  buradan doğuyordu: tekrarın derse dâhil olduğu görünmüyordu.
- Tekrar yükü ağırken *Başla*'nın altında ikincil **"Önce N tekrarı yap"**
  satırı — aynı ders, yalnızca **sıra** değişir, hiçbir bölüm atlanmaz.
- Egzersiz'de **⏰ Bekleyen tekrarlar** kapsamı: açıkça sadece tekrar isteyen
  oraya gidiyor.

Bölüm sırası artık tek bir listede duruyor; "önce tekrar" isteği tek satırda
ifade ediliyor ve ekranda bölüm sayısı yazmak mümkün oluyor.

### Başarı: iki tasarım hatası, ikisi de gerçek veriyle görüldü

**Birinci hata — toplu sayaç.** Doğru/yanlış gün bazında toplanıyordu
(`days[gün] = { r, i, d, y }`). Bir kelimeyi yanlış yapıp sonra üç kez doğru
yapınca gün %75 oluyordu: eski yanlış hiç silinmiyor, yalnızca seyreliyordu.
İstenen davranış "yeniden çalışınca düzelsin"di ve o sayaçla bu
**matematiksel olarak** karşılanamaz — hangi cevabın hangi kelimeye ait olduğu
bilgisi atılmış oluyor. Çözüm: her cevabı tek satır olarak tutmak (`answers`).
Ham veri durduğu sürece yüzdenin tanımı sonradan da değiştirilebilir.

**İkinci hata — birim kelime.** "Her kelimenin en son cevabı" kuralı ilk
gerçek derste çöktü. Öğrenme testi aynı kelimeyi **altı kez, gittikçe
zorlaşan** basamaklarda soruyor ve en sonda dinleme var:

```
door [0,1,0,1,1,0]   dust [1,1,1,1,1,0]   salt [1,1,1,1,1,0]
sell [1,1,1,1,1,0]   sick [0,0,1,1,1,0]
30 cevap · 21 doğru · ekranda yazan: %0
```

Beş kelimenin de son cevabı dinleme, beşi de yanlış. "Son cevap" *daha
sonraki bir çalışmada* anlamlı, **aynı testin daha zor basamağı** için değil;
karşılaştırma aynı basamakla yapılmalı. Birim `kelime × basamak` oldu, aynı
ders **%83** verdi. İstenen davranış da duruyor: aynı hücre yeniden
çalışılınca üzerine yazılıyor.

Geçişte başarı geçmişi **bilerek sıfırdan** başladı: eski toplu sayaçlar
kelime bazında geri üretilemiyor, ikisini tek rakamda toplamak iki farklı
şeyi karıştırmak olurdu. Kelime ilerlemesi (step/FSRS) etkilenmedi.

### "Neler yapabildin" merdivene değil yapılana bakıyor

Panel `step >= 3` ve `>= 5` eşiklerine bakıyordu. Sonucu: kullanıcı derste
kelimeyi ters seçmeli, harf dizme ve yazmayla doğru yapıyor, alt iki satır
yine **0** duruyordu — çünkü merdiven öğrenme testinde oynamıyor ve 3.
basamağa çıkmak günler sürüyor. Kullanıcı panelin bozuk olduğunu düşündü;
haksız değildi: *"neler yapabildin"* sorusunun cevabı "bugün baştan yazdın"
olmalı.

Artık cevap günlüğüne bakıyor: o basamakta **en az bir kez, kancaya basmadan**
doğru yapmış olmak yetiyor. Bunun için günlüğe `step` ve `ipucu` eklendi.

Bedeli bilinçli: **unutulan kelime de sayılmaya devam eder**, çünkü soru
"hâlâ biliyor musun" değil "yapabildin mi". "Hâlâ" sorusunun cevabı kalıcılık
yüzdesi. İki panel yan yana duruyor ve ayrı şeyler söylüyor.

### Öğrenme testi artık bir basamak kazandırıyor

Merdiven test *sırasında* hâlâ oynamıyor — kelime taze, oradan gelen başarı
kalıcı hafızanın kanıtı değil. Ama hiç basamak vermemenin sonucu şuydu: ilk
gün hiçbir şey ilerlemiyor, ders *"0 kelime ilerledi"* ile bitiyordu.

İlk ölçüt "testin **altı görevi de** temiz" oldu ve pratikte hiç tutmadı:
yukarıdaki gerçek derste beş kelimenin beşinde de en az bir hata var,
**hiçbiri ilerlemezdi**. Ölçüt tek ve nete indi: **2. basamağı (çoktan
seçmeli) kancaya basmadan doğru yapmak**. Aynı veride 5 kelimenin 4'ü
ilerliyor. Tavan yine 2 — tanıma tarafı; üretim basamakları (≥3) hâlâ yalnızca
gerçek tekrarla kazanılıyor.

### Aralıklı tekrar çalışmıyordu

Altı günlük tam bir tur (her gün 5 kelime, 26 kelimenin sonuna kadar) elle
oynanınca çıktı: **1., 2. ve 3. günde hiç tekrar gelmedi.** Veriye bakınca
sebep netti.

```
1 ders sonrası:   reps 6 · stabilite 2,3 gün
1 tekrar sonrası: reps 7 · stabilite 13,9 gün → vade 12–15 gün
26 kartın ortalama sıradaki vadesi: 7 gün (max 15)
```

Öğrenme testi aynı kelimeyi altı kez soruyor ve **her cevap FSRS'e ayrı bir
not** yazıyordu. FSRS her notu "aralıklı bir hatırlama" sayar; oysa altısı da
iki dakika içindeydi. Kelime daha ilk gün iki güne, ilk tekrardan sonra iki
haftaya fırlıyordu — kitaptaki *"cramming aralıkları şişirir"* hatası. Ürünün
bütün vaadi aralıklı tekrardı ve tam orası bozuktu.

**Düzeltme iki parça:**

1. **Öğrenme testi FSRS'e tek not verir**, o da testin sonunda (geçti → Good,
   geçemedi → Again). Anki'deki "öğrenme adımları → mezuniyet" düzeninin
   karşılığı. `learningCheck` artık yalnızca ölçüyor (`firstCheckOk`),
   zamanlamaya dokunmuyor.
2. **Aynı gün ikinci kez doğru bilmek aralığı uzatmaz.** Hızlı tekrar ve ders
   tekrarı aynı kelimeyi gün içinde defalarca soruyor. Yanlış cevap her zaman
   sayılır — bilmediğin kelimenin aralığı uzamamalı. Kural yalnızca mezun
   olmuş kartlar için; öğrenme adımındaki kart gün içinde birkaç kez sorulmak
   üzere tasarlanmıştır.

Aynı turla ölçülen sonuç: ortalama vade **7 → 3,2 gün**, ilk tekrar **4. gün →
2. gün**, ikinci tekrardan sonraki stabilite **13,9 → 7,3 gün**.

> Bu hata elle tek tek tıklayarak da bulunamazdı: tek bir ders kusursuz
> görünüyor. Ancak altı günlük turu koşturup `fsrs.reps` ile `stability`
> değerlerine bakınca ortaya çıktı.

### "Ustalık" kimseye bir şey söylemiyordu

Adı soruldu. Bir etiketi kullanıcı soruyorsa o etiket çalışmıyor demektir.
**"Kalıcılık"** oldu ve kutunun altına tek satır tanım kondu. Sayının kendisi
değişmedi: merdivendeki ortalama yükseklik.

### Logo: mavi kare rozetten iki renkli beyne

Eski işaret mavi yuvarlak kare + beyaz kare çerçeve + sarı çapraz izdi ve
**kurumsal** duruyordu. Sebebi tek cümleyle: **taşıyıcı kap, işaretin
kendisinden daha baskındı** — kare çerçeve herhangi bir SaaS ikonu olabilirdi,
içindeki form hiçbir şey anlatmıyordu.

**Instagram'daki kimlikle kopukluk asıl sorundu.** Hesabın profil fotoğrafı
siyah daire + beyaz "Hafızada" + **sarı bantta "İNGİLİZCE"**, ve aynı rozet
18 gönderinin hepsinde filigran; 5.000'den fazla takipçi onu tanıyor. Yani
sarı bant zaten markanın işaretiydi, uygulamanın mavi karesi ise oraya hiç
bağlanmıyordu.

**Neden beyin.** Kategori taraması: Duolingo baykuş, Babbel konuşma balonu,
Busuu/Memrise tek harf, Mondly küre — hepsi maskot, harf ya da balon, renk
neredeyse hep yeşil/mavi. Beyin bu kategoride yok; beyin *Lumosity · Elevate ·
Peak* gibi **zihin egzersizi** uygulamalarının işareti. Normalde bu bir
kategori hatası olurdu — ama bu markanın adı **Hafızada**, vaadi hafıza
teknikleri, Instagram bio'su bile *"Hafıza Teknikleri ile Kolay İngilizce"*.
Beyin burada süs değil, **farkın kendisi**.

**Seçilen biçim:** dikey ortadan ikiye ayrılmış beyin — sol yarı lacivert,
sağ yarı sarı, ortada kenetleniyor. İki dil, tek hafıza. Dört aday (beyin+`≈`,
beyin+fosforlu iz, iki yarım beyin, beyin+balon) 160/72/**40** pikselde yan
yana konup seçildi; küçük boyda ayakta kalan tek aday buydu. Elenenlerden biri
öğreticiydi: **beynin üzerinden geçen çapraz sarı iz 40 pikselde "yasak"
işaretine dönüşüyor** — eğik çizgi evrensel olarak "hayır" demek.

**Boru hattı vektöre taşındı.** Eski kaynak 1,1 MB'lik bir PNG'ydi ve tüm
türevler ondan kırpılıyordu: 40 pikselde kenarlar dağınıktı, rengi değiştirmek
dosyayı yeniden üretmek demekti. Üretilen görsel vektöre çevrildi
(`brand/logo-isaret.svg`), renkleri marka paletine **sabitlendi** (izleyici
#1C2940/#FECC47 çıkarmıştı, #16233A/#FFD23F'e çekildi) ve bütün türevler
artık o tek dosyadan geliyor.

**İki varyant zorunlu çıktı.** Lacivert zeminde beynin lacivert yarısı
kayboluyor ve geriye yarım beyin kalıyordu; koyu zeminde o yarı krem oluyor.
Sarı her iki zeminde de aynı.

**Yazı tipi tuzağı.** Kilit yazısı Nunito 800 olmalı ama `public/fonts`
altındakiler **woff2** ve resvg woff2 okumuyor — hata da vermiyor, yazıyı
sessizce çizmiyor. Üstelik font iki alt kümeye bölünmüş: `ı` latin'de,
`İ/ğ/ş` latin-ext'te. fontTools ile ikisi 800 ağırlığında örneklenip
birleştirildi, `brand/fonts/Nunito-800.ttf` o dosya.

### Ana ekranın boşluğu: iki deneme, iki geri alma

Uzun ekranda kahraman bloğun üstünde geniş bir boşluk kalıyor. İki şey denendi,
ikisi de çıkarıldı — kayda geçsin ki tekrar denenmesin.

**Günün kancası** — hedef çubuğunun üstünde tek satır (`boat ≈ bot`), o günün
dersinden, gün içinde sabit. Çıkarıldı: hemen altındaki *"Son tanıştıkların"*
şeridi zaten aynı kancaları gösteriyor; satır o bilgiyi ikinci kez yazmaktan
başka bir şey yapmıyordu. (Önce kahraman bloğun **altındaydı** ve orada
tekrar daha da göze batıyordu; üste taşımak da kurtarmadı.)

**Marka filigranı** — işaret %5 opaklıkta, üst şeritte, kenardan kırpılmış.
Çıkarıldı: boşluğu kapatıyordu ama ekrana hiçbir şey **katmıyordu** ve
ortadayken kelime şeridinin arkasına yayılıp o bölgeyi lekeli gösteriyordu.

Çıkan ders: **o boşluk bir sorun değil, bir sonuç.** Ana ekranın işi tek karar
verdirmek; boşluk o kararın etrafındaki sessizlik. Doldurmak için konan her
şey ya bilgiyi tekrar ediyor ya da hiçbir şey söylemiyor. Bir gün oraya bir
şey girecekse, **kendi başına bir işi olan** bir şey girmeli — boşluk
doldurmak bir iş değil.

### Renk sistemi

Palet zaten genişti ama tek renk taşıyordu: `blush` hiç kullanılmıyor, her
seçili kutu aynı maviydi. Renk artık anlam taşıyor ve **iki eksen birbirine
karışmıyor**: kapsam renkli, egzersiz tipi lacivert.

Merdivenin üç bölgesi üç renk (tanıma mavi · geçiş sarı · üretim nane) ve
bunlar İlerleme'deki çubukların **aynı** renkleri — iki ekran aynı şeyi aynı
renkle söylüyor.

Kart yüzüne ve soru ekranına dokunulmadı: `spark` (kanca sarısı) başka hiçbir
yerde vurgu rengi değil. Kancanın yanına ikinci bir renk girerse kanca dikkat
çekmeyi bırakır.

---

## 2026-09-22 — İkon seti: emojiden markaya

### Emoji marka değildir

Arayüzün her yerinde emoji vardı: alt menüde `🌱 🎯 📊 ⚙️`, egzersiz
kapsamlarında `☀️ 🌙 ⏰ 🩹 🕰️`, merdivenin altı basamağında `🔗 ✅ 🔄 🔤 ✍️ 🔊`.
Tek tek bakınca sorun görünmüyordu; sorun **kimin çizdiğiydi**.

Emojiyi uygulama çizmiyor, **cihazın yazı karakteri** çiziyor. Yani aynı ekran
Android'de Noto, iOS'ta Apple Color Emoji, masaüstünde bir üçüncüsüyle
görünüyordu — üç ayrı stil, üç ayrı çizgi kalınlığı, üç ayrı palet. Hiçbiri de
logonun iki rengini taşımıyordu. Uygulamanın en çok tekrar eden görsel öğesi,
markanın hiç söz sahibi olmadığı tek öğeydi.

20 ikonluk set bunun için üretildi: lacivert çizgi + sarı vurgu, logonun
kendisiyle aynı iki renk.

### Kaynak sayfa doğrudan kullanılmadı — üç sebep

`brand/ikon-sayfasi.png` **kaynak**, `src/assets/ikonlar/` **üretim**; arada
`tools/make-ui-icons.mjs` var. Ara adımın her biri gerçek bir kusuru kapatıyor:

1. **Renk.** Model kremi `#FBF3D7`, laciverdi `#0B203A`, sarıyı `#FFCC08`
   çizdi; markanınkiler `#FFF7E4`, `#16233A`, `#FFD23F`. Yan yana konunca
   görülüyor: ikonun sarısı kancanın sarısından daha turuncu. Her piksel
   markanın **tam token değerine** yazılıyor.
2. **Ters varyant.** Seçili sekme, seçili kapsam kutusu ve dinleme düğmesi
   koyu zeminde; lacivert ikon orada kayboluyor. Ters varyantta mürekkep
   logonun kremine döner, sarı yerinde kalır.
3. **Optik boyut.** Her çizim hücresini farklı dolduruyor. Uzun kenardan
   sığdırmak yetmiyor: `harf` beş karo genişliğinde ve o yolla komşularının
   yanında küçük kalıyordu. Ölçek **√alan**'a göre veriliyor, tuval yine de
   aşılmıyor.

> Ders: üretilen varlık **kaynak**tır, ürün değil. Araya bir üretim adımı
> koymak "elle düzelt"ten ucuz: aynı kusur bir daha gelirse yine düzelir —
> ve elle kırpmak, kusuru üretimin kendisine yazmak demekti.

### İki ikon yanlış adla gelmişti

Kırpılmış dosyalar arasında `ara.png` bir **hoparlör** çizimiydi,
`dinleme.png` ise harf karoları. İkisi de yanlış yerdeydi ve sebebi yine
kırpmaydı — kaynak sayfaya bakınca hoparlörün `ses`, karoların `harf`
olduğu, `ara`nın ise hiç çıkarılmamış **büyüteç** olduğu görüldü.

Setteki adlar **ne gösterdiğine** değil **nerede kullanıldığına** göre anılıyor:
`ses` bir hoparlör çizimi ama uygulamada telaffuzun adı.

### Kırpılmış PNG'ler kaynak sanılmıştı

Depoda `brand/ikonlar/` altında 20 tane 64px'lik PNG duruyordu ve bunlar
"ikonlar" sanılıyordu. Ekranda üç ayrı kusur çıktı, üçü de aynı kökten:

- `egzersiz`in (hedef tahtası) **alt halkası düz kesikti**.
- `bugun` ve `zor`un üstünde, gövdeden boş bir satırla ayrılmış **yabancı
  çubuklar** vardı.
- `harf` (harf karoları) ile bir başka karo çizimi **neredeyse aynıydı**;
  ikisini iki ayrı ikon sanıp birini kelime listesine koymuştum.

Kök sebep: ikonlar tek tek üretilmemişti. Hepsi **tek bir sayfada**,
5×5'lik bir ızgarada birlikte çizilmişti ve o sayfadan gözle kırpılmıştı.
Dar kutular şekilleri kesiyor, komşu hücrelerden parça bulaştırıyordu —
ve beş karo genişliğindeki `harf` ikonu **ortadan ikiye bölünmüştü**. İki
"ayrı" karo ikonu aslında aynı ikonun sol ve sağ yarısıydı.

### Yeniden üretmek değil, yeniden indirmek

Kullanıcı "tekrar indirip ayarlar mısın" dedi ve doğru olan buydu: sayfa
Magnific'te duruyordu (`iGdE85Q3uK`). **Var olan bir üretimi indirmek kredi
harcamıyor**, yalnızca üretmek harcıyor — yani kredi bitmiş olması bu işi
engellemiyordu.

İndirilen sayfa 1152×928: hücre başına ~230px, eldekinin **4 katı
çözünürlük**. İçinde bir de hiç çıkarılmamış **büyüteç** varmış, artık
arama kutularında duruyor. Model dört ikonu ikişer kez çizmiş; ikizlerden
sarı vurgusu olanı alınıyor, çünkü setin kuralı "her ikonda bir sarı
vurgu" ve vurgusuz olan onu bozuyordu (`bekleyen` bu yüzden değişti).

Kırpmayı artık göz değil ölçüm yapıyor: satır izdüşümünden satır bantları,
**her satırın kendi içinde** sütun bantları. Sütunları tüm sayfadan aramak
işe yaramıyor — geniş `harf` ikonu üstteki sütun boşluklarını kapatıp
ızgarayı 5 yerine 4 sütun gösteriyor.

Bir ikon kopuk parçalardan oluşabiliyor (hoparlörün konisi ile ses dalgaları
arasında 5 piksel var), o yüzden 40 pikselden yakın bantlar birleştiriliyor;
hücreler arası boşluk 80 pikselden geniş olduğu için eşik ikisini ayırıyor.

### Krem zemin alfaya nasıl çevrildi

Sayfanın zemini krem, ikonların olması gereken yer şeffaf. Sert bir renk
anahtarı (krem → şeffaf) kenarları tırtıklı bırakırdı: çizginin kenarındaki
piksel krem ile mürekkebin **karışımı**.

Onun yerine her piksel iki karışım doğrusuna izdüşürülüyor
(zemin→mürekkep, zemin→kanca): hangi doğruya daha yakınsa rengi o, doğru
üzerindeki konumu da alfası. Yumuşak kenar korunuyor, renk tam token oluyor.

İki renk + alfa rampası 16 girdilik palete rahat sığıyor. 40 dosya
128 pikselde **114 KB** — eski 64 piksellik setten (151 KB) küçük.

### Kelime listesi kart destesi taşıyor

"Kelimeler" listesine konan karo ikonu `harf`in yarısı çıkınca yeri boşaldı.
Liste artık `kartlar` (kalpli kart destesi) taşıyor — Egzersiz'deki "Kartlar"
kutusuyla **aynı ikon**. Zorlama değil: ikisi de aynı şeyi gösteriyor,
öğrendiğin kartlar.

> Ders: "set tamam görünsün" diye boş slotu doldurmak, boş bırakmaktan kötü.
> Bir ikonun iki anlamı olması, bir kavramın ikonsuz kalmasından daha çok
> karıştırıyor — üstelik buradaki "iki ikon" hiç var olmamıştı bile.

### `dark` kartı kendi çerçevesiyle gelmişti

100 kartı yan yana dizince biri ayrıksı duruyordu: `dark`. Sebebi kırpma
değil, **çizimin kendisiydi** — model onu tuvalin ortasına, etrafında geniş
boş pay bırakan bir yuvarlak dikdörtgen içine çizmişti. İçerik 1200×896'lık
tuvalin yalnızca %62'sini kaplıyordu ve `cover` o payı olduğu gibi koruyordu.

`import-images.mjs` artık listelenen id'lerde çerçeveyi atıyor: içeriğin sınır
kutusu bulunuyor, sonra kutu 4:3'e **genişletiliyor** — kırpılmıyor. Kenarda
226 piksel pay olduğu için genişletme gerçek piksellerden geliyor; uydurma
zemin eklenmiyor, çizimden de bir şey kesilmiyor.

Liste elle tutuluyor, kural otomatik değil: kartların çoğunda zemin düz bir
renkle kenardan kenara doluyor ve orada "içerik kutusu" çizimin *kendisi*
olur — kırpmak onları yakınlaştırıp bozardı.

> Dikkat: kancası "dark ≈ **dar**" ve görsel notu "iki duvar arasında daralan
> karanlık sokak". Yani sokağın dar olması yöntemin kendisi; düzeltilen şey
> çizimin kendi çerçevesi içinde küçük kalmasıydı.

### Sette çalışmayan tek ikon: harf

`harf` artık tam ve doğru ama **beş karo genişliğinde**, yani 4:1 bir çizim.
Egzersiz kutusundaki 20 pikselde 20×5 piksele sıkışıyor ve koyu bir leke
olarak okunuyor. Rayı kesip kırpmak yeni bir kesik kenar yaratacağı için
elle düzeltilmedi; kredi gelince o hücre üç karo olarak yeniden çizilmeli.

### `ikon` alanı resim değil, AD taşıyor

`exercise.ts` merdivenin kurallarını tutuyor ve **saf** — DOM yok, varlık yok,
test edilebilir. Basamağa doğrudan resim URL'si koymak o saflığı bozardı.
Onun yerine `IkonAd` taşıyor; adın hangi dosyaya düştüğünü yalnızca
`icons.ts` biliyor.

Bu bağ **çalışma anında** kuruluyor, yani tip sistemi göremiyor: `brand/`
içinde bir dosyanın adı değişip `IKONLAR` listesi eski adda kalırsa derleme
sessizce geçer, ekranda ikon kaybolur. `icons.test.ts` tam bunu tutuyor —
her adın iki dosyası var mı, ve üretilen her dosya listede mi.

### Paketin yarısı base64'e gömülüyordu

İlk derlemede 40 ikonun 17'si dosya, 23'ü **base64 olarak paketin içinde**
çıktı. Sebep Vite'ın varsayılan 4 KB sınırı: set tam ortasına düşüyor. İki
sonucu vardı — ana paket ~100 KB'lik base64 ile şişiyor ve *aynı setin*
ikonları birbirinden farklı davranıyordu.

`assetsInlineLimit` bir işlevle daraltıldı: `/assets/ikonlar/` altındakiler
hiç gömülmüyor. Uygulama zaten çevrimdışı, servis çalışanı `**/*.png`'yi
ön-belliyor — dosya olmaları hiçbir şey kaybettirmiyor, ana paket 573 KB'den
476 KB'ye indi.

> Tuzak: `assetsInlineLimit` işlevi `true` dönerse **zorla gömer**. İlk
> yazılışta yüklem ters kurulmuştu ve kart görselleri o dala düşüp ana paketi
> 2,3 MB yapmıştı. Doğrusu: `false` = gömme, `undefined` = her zamanki sınır.

### Sette olmayan üç ikon

`🔥` (seri), `❄️` (seri koruma) ve `🎉` (set finali) hâlâ emoji — setin bu üçü
için çizimi yok ve üretim kredisi bitti. Elle çizilen, setin çizgi kalınlığını
tutturamayan bir alev koymaktansa tanınır bir emoji bırakmak daha az kötü.
Kredi gelince üretilecek ilk üç ikon bunlar.

`✓`, `←`, `›` ise **tipografik** ve öyle kalmalı: onlar ikon değil, işaret.

### Bildirim ikonu: örnek değer üretimde kalmış

`capacitor.config.json` Capacitor'un **belgelerindeki örnek değeri**
taşıyordu: `smallIcon: "ic_stat_icon_config_sample"`. Eklenti böyle bir
drawable göndermiyor (`@capacitor/local-notifications` içinde yalnızca
`ic_transparent.xml` var), yani ad hiçbir şeye çözülmüyor ve Android
uygulama simgesine düşüyordu — durum çubuğunda **beyaz bir leke**.

Günlük hatırlatma gerçekten gönderildiği için (Ayarlar'daki o satır, APK'da)
bu görünen bir kusurdu.

**Neden logo kullanılamadı.** Durum çubuğu ikonu bir ALFA MASKESİDİR: Android
bütün opak pikselleri beyaza boyar, renk atılır. Logonun dolu beyin formu
böyle olunca 24 pikselde tanınmaz bir lekeye dönüşüyor — denendi, görüldü.

**Çözüm ikon setinden geldi.** Setteki çizimler *çizgi* çizimi; içleri şeffaf
olduğu için siluete çevrilince yapılarını koruyorlar. `ogren` (filiz) seçildi:
zaten "Öğren" sekmesinin sembolü, yani bildirim uygulamanın kendi diliyle
"öğrenme vakti" diyor. 24 pikselde okunuyor.

`iconColor` da değişti: `#16233A` → `#4F92F6`. Bildirim gölgesinde küçük ikon
bu renkle boyanıyor; koyu lacivert, koyu temadaki gölgede kayboluyordu.
Marka mavisi hem açık hem koyu gölgede okunuyor.

**Yerleştirme ayrı bir adım.** `android/` depoda tutulmuyor, her seferinde
`cap add android` ile üretiliyor; `@capacitor/assets` ise launcher ve açılış
ekranını üretiyor, bildirim ikonunu **üretmiyor**. Bu yüzden
`npm run icons:bildirim` `cap add android` SONRASINDA çalıştırılmalı —
tıpkı build.gradle'daki `buildDirectory` bloğu gibi.

> Betik çalıştırılmazsa davranış bugünküyle aynı kalır (ad çözülmez,
> uygulama simgesine düşer), yani unutmak bir gerileme yaratmıyor —
> sadece düzelme olmuyor.

---

## 2026-09-22 — Ders içinde ritim: geçiş anı

### İstek kutlamaydı, çıkan şey kutlama olmadı

İstek şuydu: *"her aşama bittikten sonra kutlama olsun, tebrikler bitirdiniz
tarzı"*. Altında gerçek bir kusur vardı — ders **uzun bir düz akış**. Beş
kelime × altı basamak = otuz soru, arada hiçbir kapanış hissi yok.

Ama kutlama yanlış araçtı, üç sebeple:

1. **Ödül enflasyonu.** Bu üründe kutlanacak iki an zaten var ve ikisi de
   nadir: ders sonu (`SessionDone`) ve setin bitmesi (`SetFinale` — dosyanın
   kendi yorumunda "bir kez yaşanan an" diye geçiyor). Her aşamaya tebrik
   koymak o ikisini düzleştirir.
2. **Akış maliyeti.** Bu ürünün en büyük kazancı üç düğmeyi tek "Başla"ya
   indirmekti. Aşama başına kutlama, her aşamanın arasına bir duraklama
   koyar.
3. **Yanlış şeyi kutlamak.** 1-2. basamakta kanca ekranda duruyor —
   `olculebilir()` bu yüzden orada `false` döndürüyor. Oradaki doğru
   "kanca tuttu" demiyor. Katılımı ödüllendirmek, "beyan yerine ölçüm"
   ilkesinin tam tersi.

Onun yerine **geçiş anı**: ne kapandı, kaç doğru, ne açılıyor. Tebrik dili
yok, konfeti yok, sayı gerçek.

### Kaç tane olacağı zaten belliydi

İlk öneri "bölüm araları" idi (2 geçiş) ama kodu okuyunca görüldü ki öğrenme
testi merdivenin **altı basamağını da** sırayla koşuyor
(`ADIMLAR.flatMap(...)`) — yani kullanıcının tarif ettiği aşamalar gerçekten
var. Dosyanın tepesindeki açıklama hâlâ "merdivenin 1-2. basamağı" diyordu,
bayat kalmış; düzeltildi.

Altı geçiş fazlaydı, ikisi azdı. Doğru sayı **üçtü** — çünkü merdivenin üç
bölgesi zaten iki ekranda yaşıyordu: Egzersiz'de basamak kutularının rengi
(mavi/sarı/nane), İlerleme'de "Neler yapabildin" çubukları. Geçiş anı yeni
bir kavram icat etmiyor, var olanı tekrar ediyor:

| Basamak | Renk | Geçişte |
|---|---|---|
| 1–2 | mavi | **Tanıdın** → "Şimdi kanca ekrandan kalkıyor" |
| 3–4 | sarı | **Hatırladın** → "Şimdi kelimeyi baştan sen yazacaksın" |
| 5–6 | nane | **Ürettin** |

Başlıklar **geçmiş zaman**: bölge bittiğinde gösteriliyor, yani az önce
yapılan şey. "Tanıma" değil "Tanıdın".

### Üç bölge artık tek kaynakta

`BOLGELER` + `bolgelereBol()` `exercise.ts` içinde — modül saf kalıyor, ikon
ve renk **ad** olarak taşınıyor (`ADIM`'ın `ikon` alanıyla aynı desen).
Egzersiz ve İlerleme ekranları bir gün buradan beslenebilir.

### Runner'a dokunulmadı

Motor bir basamağın bittiğini dışarı vermiyor. Ona olay eklemek yerine
öğrenme testi **bölge bölge koşturuluyor**: her bölge kendi `Runner`'ını
alıyor, `onDone` zaten aradığımız sınır. Motorun sözleşmesi değişmedi.

Son bölgenin geçişi aynı zamanda bölümün geçişi — üst üste iki ekran
çıkmasın diye `bolumGecisi('ogrenme')` bilerek `null` dönüyor. Son bölümün
ardından geçiş anı hiç gösterilmiyor: orada `SessionDone` var ve asıl
kutlama o.

### Ertelenen: hesap

Aynı turda "kullanıcı oluşturma mantıklı mı" diye soruldu. Cevap **hayır,
bu aşamada değil** — gerekçesi "Sırada" listesindekiyle aynı: yayın → D1/D7
→ sonra karar. Kayıt duvarı "haa" anından önce konursa hesabın kurtardığından
fazlasını kapıda kaybettirir.

İstenen şeyin özü hesap değilmiş: *"kendi hesabı gibi görsün, yedeği yine
cihaza alsın, ismini kendi seçsin"*. Bu **yerel profil** demek ve sunucusuz
yapılabilir; ileride bulut gelirse bu profil çapa olur. Ayrı bir tura bırakıldı.

> Dikkat: yerel profil "kaç kişi kullanıyor" sorusunu ÇÖZMÜYOR. Cihazda duran
> bir isim kimseye ulaşmaz; sayım ayrı bir iş ve tek yolu anonim bir ping
> (ya da APK Play'e girerse Play Console).

---

## 2026-09-22 — Yerel profil, avatarlar ve çerçeveler

### Kredi bitmemişti

Bu turun başında "Magnific kredisi bitti" varsayımıyla üç iş ertelenmişti:
beş karolu `harf` ikonu, `🔥`/`❄️`/`🎉` emojileri ve çerçeve fikri.
Bakiye kontrol edilince **192.535 kredi** çıktı (planın 216.000'inin
23.465'i harcanmış). Erteleme gereksizmiş.

> Ders: "kredi yok" bir varsayımdı, bir ölçüm değil. Maliyeti olan bir
> karar vermeden önce bakılacak bir sayı varsa bakılır.

### Hesap değil, PROFİL

İstek "kullanıcı oluşturma" diye başladı, konuşunca özü çıktı: *"kendi
hesabı gibi görsün, yedeği yine cihaza alsın, ismini kendi seçsin"*.
Yani istenen şey hesap değil, **kimlik hissi**.

Kurulan şey tamamen yerel: e-posta yok, şifre yok, giriş yok, sunucu yok.
Uygulama içinde her yerde "profil" denir — "hesap" denirse insanlar
verilerinin bulutta olduğunu sanıp yedek almayı bırakır ve veri kaybı
**artar**.

**Profil kendiliğinden oluşur.** İlk açılışta ad ve avatar üretilir
(`profilSagla`), kullanıcıya "adın ne" diye sorulmaz. Kayıt duvarı yeni
bir uygulamanın en pahalı ekranıdır ve "haa" anından önce konursa
kazandırdığından fazlasını kapıda kaybettirir. İsteyen Ayarlar'dan
değiştirir, istemeyen hiç fark etmez.

**Ad ile yüz aynı yerden geliyor.** Otomatik ad sıfat + hayvan
("Meraklı Tilki") ve avatar da o hayvan. Kullanıcı hiçbir şey yapmadan
kendine ait bir şeye bakıyor. `HAYVANLAR` listesi ile avatar klasörü
ayrışırsa profil adsız bir yüze düşer — test ikisini karşılaştırıyor.

### İleride bulut istenirse ne işe yarar

Soru buydu ve cevabı net: **ad ve fotoğraf değil, `id` işe yarar.**

`Profil.id` rastgele, kalıcı, görünmez bir kimlik. Ad kimlik değildir —
iki kişi de "Meraklı Tilki" olabilir, kullanıcı adını her gün
değiştirebilir. Bu alan olmadan bulut senkronu geldiğinde *"bu aynı
kişinin yeniden kurulumu mu, yoksa başka biri mi"* sorusu cevapsız kalır
ve herkes sıfırdan başlar. Üretildiği an dışında hiç değişmiyor,
kullanıcıya hiç gösterilmiyor, hiçbir yere gönderilmiyor — ama **yedeğe
giriyor**, yani cihaz değiştiren kişi kimliğini de taşıyor.

`olusturuldu` ikinci yarısı: iki cihaz birleşirse hangisinin eski olduğu
oradan bilinir.

> Yine de: yerel profil **"kaç kişi kullanıyor"u çözmüyor.** Cihazda duran
> bir isim kimseye ulaşmaz. Sayım ayrı bir iş; tek yolu anonim bir ping
> (aynı `id` kullanılabilir) ya da APK Play'e girerse Play Console.

**Fotoğraf ayrı tutuldu.** `Avatar` birleşim tipinde `foto` ayrı bir dal:
bulut senkronu gelirse hayvan/ikon seçimi zararsızca taşınır ama fotoğraf
**kişisel veridir** ve ayrı bir onay ister.

### Çerçeveler satılmıyor, kazanılıyor

İstek "oyunlardaki premium çerçeveler, hatta bazen satılıyor" idi. Altı
çerçeve üretildi (halka, halat, taşlı, defne, güneş, kraliyet) ama
satılmıyorlar: **gerçek ilerlemeyle** açılıyorlar — 10/25/50 kelime,
7 günlük seri, seti bitirmek. Şart "uygulamayı 3 gün aç" gibi bir
katılım ölçüsü değil, iş ölçüsü; bu üründe ödül yapılan şey için verilir.

Hak edilmemiş çerçeve **okurken** düzeltiliyor (`gecerliCerceve`): yedek
başka cihazdan gelirse ya da ilerleme sıfırlanırsa profil varsayılana
düşer. Kayda dokunulmuyor — koşul yeniden sağlanırsa çerçeve geri gelir.

### Çerçevenin deliği ölçülüyor — bu işin can alıcı yeri

Altı çerçeve aynı sayfada çizildi ama birbirinin aynı değil: defnenin
yaprakları dışa taşıyor, dikenli taç çok daha geniş, kraliyetin tepesinde
taç var. Hepsini aynı **dış** kutuya oturtmak işe yaramaz — o zaman iç
delikler farklı büyüklükte olur ve avatar kimi çerçevede taşar, kiminde
ortada küçücük kalır.

Hizalama bu yüzden dışarıdan değil **içeriden**: her çerçevenin deliği
flood fill ile bulunuyor (merkez + yarıçap), sonra çizim o delik sabit
bir orana gelecek şekilde ölçekleniyor ve delik merkezi tuval merkezine
oturtuluyor. Kutu merkezi kullanılamazdı: taç yüzünden çizim simetrik
değil, delik kutunun ortasında durmuyor.

Oran da elle yazılmıyor. En geniş çerçeve (dikenli taç) deliğin 1,67 katı
olduğu için delik ancak 0,58 olabiliyor; üretim bunu hesaplayıp
`olcu.json`'a yazıyor, `Avatar` bileşeni oradan okuyor. İki yerde tutulan
bir sayı, çerçeve seti değişince avatarın sessizce kayması demekti.

### Çerçeveler madeni kademeye döndü

İlk set altı ayrı süslemeydi (halka, defne, taşlı, dikenli, halat,
kraliyet) ve hepsi lacivert + sarıydı. Ekranda görülünce eksik olan şey
belli oldu: **hangisinin daha değerli olduğu anlaşılmıyordu.** Altı farklı
şekil, altı eşit görünüm — sıra ancak altındaki yazı okunarak biliniyordu.

Son dördü madeni kademeye çevrildi: **bakır → gümüş → altın → platin**.
Kademe artık renkten okunuyor. İlk ikisi markanın kendi dilinde kaldı —
başlangıç çerçevesinin arayüzün geri kalanıyla aynı dilde olması doğru.

Bu, "düz dolgu, gradyan yok" kuralının bilerek delindiği tek yer: bunlar
arayüz ikonu değil, **kazanılan nesneler**. Üretim tarafında da ayrı bir yol
gerekti — `boya()` her pikseli iki karışım doğrusundan birine indirgiyor,
madeni geçişler onlarca ton taşıyor. `renkliKes()` alfayı zeminden
uzaklıkla veriyor ve rengi karışımdan geri çözüyor
(`F = (P − (1−a)·BG) / a`), yoksa yarı saydam kenarlarda krem bir hale
kalıyordu.

### Seri kırılınca çerçeve geri alınıyordu

Çerçeve kilidi `streakCount`'a, yani **mevcut** seriye bakıyordu. Yani 7
günlük seriyle Gümüş'ü açan biri bir gün kaçırınca çerçeveyi kaybediyordu.

Bu bir ceza ve serinin kendi kuralıyla çelişiyor: *"ödül var, ceza yok —
kırılınca suçlayıcı bildirim gelmez"*. Kazanılmış bir nişanı geri almak,
suçlayıcı bildirimden daha ağır.

`AppState.bestStreak` eklendi: yalnızca büyüyen bir sayı, her seans
sonunda `max` ile güncelleniyor. Kilitler ona bakıyor. Eski kayıtlarda
alan yok, `getState` onu mevcut seriyle dolduruyor — geçmişteki daha uzun
bir seri bilinmiyor ama kullanıcıyı bugün sahip olduğundan geride
göstermek yanlış olurdu.

> Ders: "kazanıldı" ile "şu an geçerli" ayrı şeyler. Bir rozet ikincisine
> bağlanırsa rozet değil, kira olur.

### Seçim halkası resimden büyüktü — iki ayrı sebep

Hayvan seçme ızgarasında seçili olanın etrafındaki halka resimden belirgin
biçimde genişti, bozukluk gibi duruyordu. İki sebebi vardı ve ilki
düzeltilince ikincisi ortaya çıktı.

**Birincisi:** `Avatar` sabit piksel ölçüsüyle çiziliyordu (68px) ama düğme
ızgara hücresi kadar genişti; halka düğmeyi sarıyor, resim içeride küçük
kalıyordu. `w-full` sınıfı işe yaramıyordu çünkü satır içi `style` onu
eziyor. `boyut="tam"` eklendi: sabit piksel yerine kapsayıcıyı dolduruyor,
iç çember de yüzdeyle veriliyor.

**İkincisi — asıl inatçı olan:** `Avatar`'ın kökü `inline-grid`'di. Satır
içi bir öğenin altında **taban çizgisi boşluğu** kalıyor, yani kapsayıcı
düğme resimden birkaç piksel uzun oluyor ve halka bir daire değil hafif
oval, resimden büyük bir şekil olarak çiziliyordu. `grid`'e (blok seviyesi)
çevrilince boşluk kayboldu: düğme 61,6×61,6, resim 61,6×61,6.

Halka kalınlığı da 3px'ten 2px'e indi.

> Ders: "ölçüyü büyüttüm, hâlâ oturmuyor" dendiğinde ölçü değil YERLEŞİM
> modeline bakılmalı. Tarayıcıda görülen boşluğun kaynağı çoğu zaman
> yazılan bir sayı değil, öğenin satır içi mi blok mu olduğudur.

### Ana ekranda iki bölüm yüzeysizdi

"Bugünün hedefi" çubuğu ve "Son tanıştıkların" cipleri sayfanın zemininde,
kartların arasında **yüzer halde** duruyordu. Ekrandaki her şey bir yüzeyin
üzerindeyken tek başına duran o iki satır eksik görünüyordu — bu uygulamanın
dili kart: *"beyaz, yuvarlak, yumuşak gölgeli bir nesne"*.

İkisi de karta alındı. İki küçük ama gerekli ayrıntı:

- İlerleme çubuğunun zemini `white/70`'ten `sunken`'a döndü — beyaz kartın
  üzerinde beyaz çubuk görünmüyor.
- Kanca çipleri de `white`'tan `sunken`'a; aynı sebep.

"Son tanıştıkların" yanındaki **"12 kelime" sayacı kaldırıldı.** O bölüm bir
ölçüm değil, son öğrenilenlere bakma yeri; sayı zaten hemen üstteki hedefte
ve İlerleme sekmesinde duruyor. İki yerde duran sayı, üçüncü yerde gürültü.

### Geri alınan: ikon avatarları

Avatar olarak marka ikonu + renkli zemin de seçilebiliyordu (23 × 6 = 138
kombinasyon). Ekranda görülünce kalktı: **hayvan portrelerinin yanında
sönük duruyordu.** Çizilmiş, ifadeli, renkli dokuz yüzün yanına iki renkli
bir arayüz ikonu koymak, ikisini de zayıflatıyor — biri profil resmi gibi
durmuyor, diğeri de artık "tek seçenek" olmanın netliğini kaybediyor.

Seçenek sayısı düştü ama seçim kolaylaştı: hayvan ya da kendi fotoğrafın.

Tip birleşiminden de çıkarıldı, yani artık üretilemez. Eski bir kayıtta
kalmış olabilir diye `profilDuzelt` okurken onu hayvana çeviriyor —
tercihen **adın kendi hayvanına** ("Şen Baykuş" → baykuş).

> Ders: bir seçenek eklemek bedava değil. Yanına konduğu şeyi de
> değiştiriyor.

### Emojiler bitti

`seri`, `koruma`, `kutlama` ikinci ikon sayfasıyla geldi; `🔥 ❄️ 🎉`
kalktı. Arayüzde artık `✓`, `←`, `›` dışında emoji yok — o üçü de
tipografik işaret, ikon değil.

İkinci sayfanın ilk denemesi **dolu siluet** olarak geldi ve setin çizgi
diliyle örtüşmedi. Atılmadı, stil açıkça tarif edilip bir kez yeniden
üretildi: *"bunlar KONTUR ikonları, içi boş, dolu glif değil"*.

---

## 2026-09-22 — "Bunu biliyorum" ve kancanın bedeli

### İstek kelime seçtirmekti, çıkan şey o olmadı

İstek şuydu: ilk derste kullanıcı kendi kelimelerini seçsin, bir de
"rastgele seç" düğmesi olsun. İkisi de yapılmadı, sebepleriyle:

**Rastgele** mevcut sırayı bozar. Sıra rastgele değil, tasarlanmış:
sıklık sırası + ilk beş kartta zayıf kanca yok (`far ≈ far` gibi kartlar
yöntemin ne yaptığını göstermiyor, bilerek geriye itilmişler). Rastgelelik
özgürlük değil; iyi bir sıralamayı kötüsüyle değiştirmek.

**İlk derste seçtirmek** üç sebeple en kötü an: (1) kullanıcının karar
verecek bilgisi yok — kelimeleri bilmediği için buradalar, (2) ilk beş
kart vitrin, kendi seçerse ilk izlenimi "bu zaten aynı kelime" olabilir,
(3) "tek akış, tek karar" kazancını en kırılgan noktada harcar.

Ama altındaki ihtiyaç gerçekti. İnsanların kelime seçmek istemesinin
sebebi genelde *"bunu zaten biliyorum, boşa çalışmayayım"*dır — bu
**planlama değil tepki**, ve tepki çok daha ucuz.

### Kayma, kararın kilit taşı

"Biliyorum" denince yerine sıradaki kelime kayıyor. Alternatif ders
kısalmasıydı ve o günlük hedefi **yalancı** yapardı: "5/5 kelime" derken
aslında 4 öğrenilmiş olurdu. Hedefin anlamı korunması gereken şeydi.

Kaymanın şartı: atlanan kelime **günlük sayacı yememeli**. `introduced:
false` bunu kendiliğinden sağlıyor.

### `introduced: false` bir numara değil, doğru olan

Kelime uygulamada öğrenilmedi: kanca gösterilmedi, soru sorulmadı, hiçbir
şey ölçülmedi. Onu "öğrenilmiş" saymak veriyi kirletirdi.

Yan faydası büyük: `introduced` süzen **her yer** onu kendiliğinden eliyor —
puanlama, set bitişi, günlük sayaç, kapsamlar, paylaşım panosu. Elle
elenmesi gereken yalnızca iki yer kaldı (`nextBatch` ve `dueQueue`) ve
ikisi de açıkça yazıldı.

> Ders: doğru veri modelini seçmek, yirmi yerde "bunu da ele" yazmaktan
> ucuz. Bayrak eklemeden önce var olan alanın ne anlattığına bakılmalı.

### Kancaya basmanın bedeli — sanılandan azmış

"Kancaya basınca olumsuz etkisi olmasın" istendi. Koda bakınca çıkan:
zaten neredeyse yok.

| | |
|---|---|
| Başarı yüzdesi | doğru sayılıyor, `ipucu` süzülmüyor |
| FSRS zamanlaması | `Rating.Good`, aralık normal uzuyor |
| "Neler yapabildin" | o cevap sayılmıyor ama sonradan kancasız yapınca sayılıyor |
| `unaidedOk` / `hookRevealCount` | yalnızca geliştirme paneline gidiyor |
| **Merdiven** | **yerinde kalıyor** — tek gerçek etki |

Merdiven ilerlemesi bilerek engelli: merdivenin tek işi *"artık kancasız
yapabiliyor musun"* sorusuna cevap vermek. Kancayla ilerletirsek yeteneği
değil katılımı ölçer ve kullanıcı 6. basamakta kanca yokken çuvallar.

**Eksik olan ceza değil, geri bildirimdi.** Kancayla doğru bilince ekranda
hiçbir şey olmuyordu: "Doğru" yazıyor, merdiven kımıldamıyor, sebebi
söylenmiyor — bu cezalandırılmış gibi hissettiriyor. Tek satır eklendi:
*"kancayla bildin · bir dahakine kancasız dene"*. Puanlamaya dokunulmadı.

### Kenarda duran kusur

`unaidedOk` ilk ölçülebilir cevapta **bir kez** yazılıp bir daha
güncellenmiyor; tek bir erken an kalıcı damga bırakıyor. Kullanıcıya zararı
yok (yalnızca geliştirme paneli) ama ölçüm olarak zayıf. Bilerek bu turda
dokunulmadı.

---

## 2026-09-22 — Kullanım ölçümü (kendi Supabase tablomuz)

### Bu karar "veri toplamıyoruz" sözünü bitiriyor

Uygulamanın en net özelliklerinden biriydi ve Play'in Veri Güvenliği
formunu "hiçbir veri toplanmıyor" diye doldurmayı planlıyorduk. Artık
öyle diyemeyiz.

O yüzden kodla **birlikte** yasal metinler de yazıldı. Play'de asıl
ret/kaldırma sebebi analitik kullanmak değil, **beyan uyuşmazlığıdır**.

### Önce Firebase kuruldu, sonra Supabase'e geçildi

Bir tur Firebase Analytics kurulu kaldı. Sonra Supabase hesabının zaten
açılmış olduğu ortaya çıktı — ve ikisinin **aynı işi yapmadığı** yanlış
anlaşılmıştı. Karşılaştırma:

| | Firebase | Supabase |
|---|---|---|
| Panolar | Hazır (retention, huni) | Yok — SQL yazılır |
| Veri kimde | Google'da | Bizde |
| Paket | ~45 KB ayrı parça | `fetch` ile **0 KB** |
| KVKK | Google'a aktarım ayrıca anlatılır | Tek işleyen, barındırma |

Asıl soru *"kaç kişi kullanıyor, geri geliyorlar mı"* ve Supabase buna
fazlasıyla yetiyor. Firebase'in fazlası (hazır panolar, huni, A/B) bu
aşamada gerekmiyor — 0 kullanıcıda değil, 1.000'de gerekir.

Geçiş ucuzdu çünkü `analitik.ts` baştan **sınır** olarak yazılmıştı:
uygulamanın geri kalanı yalnızca `olay()` çağırıyor, arka ucu tanımıyor.
Değişen tek dosya o oldu. Toplam JS 553 → 509 KB.

> Ders: dış bir servisi doğrudan çağrı noktalarına serpiştirmek ucuz
> görünür; bir sınır dosyası yazmak, fikir değiştirince bedava çıkar.

### SDK yok

`@supabase/supabase-js` ~40 KB getirir ve karşılığında auth, realtime,
storage verir — hiçbirini kullanmıyoruz. Tek ihtiyacımız bir INSERT;
PostgREST düz bir HTTP ucu, `fetch` yetiyor.

### Kuyruk: çevrimdışı çalışan bir uygulamada şart

Olaylar `localStorage`'da biriktirilip 5 saniyede bir toplu gönderiliyor.
Gönderim başarısız olursa kayıtlar **kuyrukta kalıyor** — uygulama
çevrimdışı çalışabildiği için "gönderemedim, attım" ölçümün yarısını yok
ederdi. Kuyruk 200 kayıtla sınırlı; sayfa gizlenirken `keepalive` ile
boşaltılıyor.

Kalıcı hatada (4xx — şema uyumsuzluğu gibi) kuyruk temizleniyor, yoksa
sonsuza kadar aynı hatayı tekrarlardı.

### Supabase kurulumu

Şema artık **panelde değil, depoda**:
`supabase/migrations/20260922000000_olaylar.sql`.

Bir süre bu SQL burada, bu dosyada duruyordu ve SQL Editor'e elle
yapıştırılıyordu. Böyle olunca "üretimdeki tablo hangi halde" sorusunun
cevabı hiçbir yerde yazmıyordu. Artık `supabase db push` uyguluyor ve
değişiklikler yeni bir migration dosyası olarak birikiyor.

Migration'ın kendisi neden öyle yazıldığını anlatıyor; buraya
tekrarlanmayacak kadar yorumlu. Üç karar özetle:

- **`ad` sütununda enum/check yok.** Kısıtlasaydık, kodda yeni bir olay
  eklenip migration unutulduğunda sunucu 4xx döner, istemci de 4xx'i
  "kalıcı hata" sayıp kayıtları atardı — sessiz ve geri dönülmez veri
  kaybı. Yazım hatasını zaten `type Olay` yakalıyor.
- **RLS yalnızca INSERT.** `anon` anahtarı gizli değil, APK'dan
  çıkarılabilir. Güvenliği sağlayan şey anahtarın saklanması değil, bu
  politika: kimse yazılanı geri okuyamaz, güncelleyemez, silemez.
- **`olustu` istemciden, `alindi` sunucudan.** Cihaz saati yanlış
  olabilir; ikisinin farkı saat kaymasını gösteriyor.

#### Saklama süresi — artık bağlı

`public/gizlilik.html` 5. maddede kullanım olaylarının **en fazla 24 ay**
saklanacağı yazıyor. Bir süre bunu yapan hiçbir şey yoktu: metin söz
veriyor, kod tutmuyordu.

`pg_cron` ile bağlandı (`20260922000100_olaylar_saklama_zamanlamasi.sql`):
her ayın 1'i 04:00 UTC'de `bakim.olaylari_temizle(24)` çalışıyor. Ayrı
migration dosyası, çünkü `pg_cron` her projede açık değil — tablo her
koşulda kurulsun, zamanlama takılırsa yalnızca kendisi takılsın.

Fonksiyon `ay = 0` ile çağrılıp gerçekten sildiği doğrulandı.

#### Kurulum yapıldı — ve iki hata çıktı

Şema 22 Eylül 2026'da uygulandı (Supabase MCP üzerinden, `apply_migration`).
İkisi de ancak gerçekten çalıştırınca ortaya çıkan iki hata vardı:

**1. İndeks hiç çalışmıyormuş.** `(kimlik, (olustu::date))` yazılıydı,
Postgres reddetti: *"functions in index expression must be marked
IMMUTABLE"*. `timestamptz → date` çevirimi sunucunun TimeZone ayarına
bağlı. Bu SQL aylardır NOTLAR'da duruyordu, demek ki **hiç
çalıştırılmamış** — panele elle yapıştırma yöntemiyle de aynı hatayı
alacaktık. Şemayı migration'a taşımanın karşılığını ilk gün verdi.
Düzeltme: düz `(kimlik, olustu)`.

**2. Ölçüm sorguları yanlış günü sayıyormuş.** Aynı `olustu::date`
sorgularda çalışıyor (STABLE yeterli) ama **UTC'ye göre** gün kesiyor.
Türkiye UTC+3; gece 00:00–03:00 arası ders yapan biri bir önceki güne
düşüyordu. Hem günlük aktif kullanıcıyı hem D1/D7'yi kaydıran sessiz bir
hata. Düzeltildi: `at time zone 'Europe/Istanbul'`.

#### RLS iddia ettiğini yapıyor mu — ölçüldü

"Yalnızca INSERT" bir niyet beyanı olarak kalmasın diye `anon` rolüyle ve
gerçek HTTP ucuyla denendi:

| Deneme | Sonuç |
|---|---|
| INSERT | 201 — yazdı |
| SELECT | `[]` — 0 satır |
| DELETE | HTTP 204 döndü ama **0 satır silindi** |
| UPDATE | 0 satır |
| `bakim.olaylari_temizle()` RPC | 404 / permission denied |

DELETE'in 204 dönmesi ilk bakışta korkutucu: PostgREST politika olmadığı
için 0 satır etkileyip yine de "başarılı" diyor. Satır sayısı kontrol
edildi, hiçbir şey silinmemişti.

Uçtan uca da denendi: uygulama başsız tarayıcıda açıldı, `uygulama_acildi`
olayı kuyruğa girdi, 5 sn sonra POST 201 aldı, kuyruk boşaldı ve satır
tabloya düştü. Giden tek kimlik rastgele UUID; isim, fotoğraf, cevap,
konum yok. `alindi - olustu = 5 sn` — toplu gönderim penceresinin kendisi.

#### Fonksiyon neden `public` dışında

PostgREST yalnızca `public` şemasını dışa açıyor. `olaylari_temizle`
orada olsaydı, `security definer` bir silme fonksiyonu anon anahtarıyla
RPC olarak çağrılabilirdi — yani herkes ölçümü süpürebilirdi. O yüzden
`bakim` şemasında ve `anon`dan yetkisi alınmış durumda.

### Ölçüm sorguları

**Gün sınırı UTC'de değil, Türkiye saatinde.** Sorguların ilk hali düz
`olustu::date` yazıyordu; o, sunucunun TimeZone ayarına (Supabase'de UTC)
göre gün kesiyor. Türkiye UTC+3 olduğu için gece 00:00–03:00 arasında ders
yapan biri **bir önceki güne** sayılırdı — hem günlük aktif kullanıcıyı
hem D1/D7'yi sessizce kaydıran bir hata. Onun yerine açıkça
`at time zone 'Europe/Istanbul'`.

```sql
-- Günlük tekil kullanıcı
select (olustu at time zone 'Europe/Istanbul')::date gun,
       count(distinct kimlik) kisi
from olaylar where ad = 'uygulama_acildi'
group by 1 order by 1 desc;

-- D1 / D7: ilk günden sonra geri gelen oranı
with olay as (
  select kimlik, (olustu at time zone 'Europe/Istanbul')::date gun
  from olaylar
),
ilk as (select kimlik, min(gun) g0 from olay group by 1)
select
  count(*) filter (where var1)::float / nullif(count(*), 0) d1,
  count(*) filter (where var7)::float / nullif(count(*), 0) d7
from (
  select i.kimlik,
    exists (select 1 from olay o where o.kimlik = i.kimlik and o.gun = i.g0 + 1) var1,
    exists (select 1 from olay o where o.kimlik = i.kimlik and o.gun = i.g0 + 7) var7
  from ilk i
  where i.g0 < (now() at time zone 'Europe/Istanbul')::date - 7
) t;
```

`nullif(count(*), 0)` da sonradan eklendi: henüz 7 günü dolmuş kimse
yokken payda sıfır oluyor ve sorgu bölme hatasıyla patlıyordu. Yayının
ilk haftasında tam olarak bu durumda olacağız.

### Üç kural (değişmedi)

1. **Yapılandırma yoksa sessizce kapalı.** Adres ve anahtar
   `VITE_SUPABASE_*` ortam değişkeninden; yoksa hiçbir şey gönderilmiyor
   ve Ayarlar'daki anahtar bile görünmüyor.
2. **Kullanıcı kapatabilir.** Varsayılan açık ama ilk açılışta izin
   diyaloğu **sorulmuyor**: karşılama akışı bu ürünün en korunan yeri.
3. **Kişisel veri gönderilmiyor.** Tek kimlik `Profil.id`.

### Olay adları sabit liste

`type Olay` bir birleşim tipi, serbest metin değil. Serbest olsaydı bir
gün `ders_bitti`, başka gün `dersBitti` yazılır ve tabloda iki ayrı olay
birikirdi. Yazım hatası artık derlemede yakalanıyor.

### Sürüm tek kaynaktan

Ayarlar'da elle `"0.1.0"` yazılıydı ve paketin sürümüyle ayrışabilirdi.
Artık `package.json`'dan derleme sabiti olarak geliyor (`__APP_VERSION__`)
— hem ekranda hem ölçüm kayıtlarında aynı sayı.

### Play Veri Güvenliği formu için cevaplar

Uygulama veri **topluyor** (artık "hayır" denemez). Beyan edilecekler:

| Kategori | Ne | Amaç |
|---|---|---|
| Uygulama etkinliği | uygulama içi olaylar | Analiz |
| Cihaz veya diğer kimlikler | uygulamanın ürettiği rastgele numara | Analiz |

Konum **beyan edilmez** — Firebase'den farklı olarak toplamıyoruz. Hepsi
için: aktarım şifreli · kullanıcı silme talep edebilir · veriler
satılmıyor · reklam yok.

### Android tarafı

Firebase kaldırılınca `google-services.json` gereği de kalktı. Supabase
düz HTTPS olduğu için native tarafta **hiçbir kurulum gerekmiyor**.

---

## Ortam

`/Volumes/TwinMOS` **exFAT**. macOS her dosyanın yanına `._` gölgesi bırakıyor;
git bunları `.git/objects` içinde gerçek pack sanıp `non-monotonic index`
hatası veriyor, vitest de test dosyası sanıp parse hatası veriyor. `.gitignore`
ve vitest `exclude` ile kapatıldı. Yine de çarparsa: `find . -name '._*' -delete`.

---

## 2026-09-22 — Yedekleme buluta değil, kullanıcının kendi Drive'ına

### Fikir büyük okundu, küçüğü doğruydu

İstek "Supabase + Google hesabıyla bulut senkronizasyonu" diye geldi ve
ben bunu tam bir hesap sistemi olarak okudum: kullanıcı tablosu, misafir→
hesap göçü, iki cihaz arası çakışma çözümü, satır bazında "son yazan
kazanır". Buna göre beş başlıklı bir risk listesi çıkardım.

Kastedilen o değilmiş. İstenen şey WhatsApp'taki gibi: **Ayarlar'dan
"Yedekle" deyip Google hesabını seçmek, yedek kullanıcının kendi
Drive'ına gitmek.** Kayıt yok, hesap yok, sürekli senkron yok.

Fark küçük görünüyor ama analizin dördünü buharlaştırıyor:

| Endişe | Tam senkronda | Kendi Drive'ına yedekte |
|---|---|---|
| Çakışma çözümü | Gerekli (`guncellendi` damgası şart) | Yok — yedek bir anlık görüntü |
| Misafir→hesap göçü | Kural yazılmalı | Yok |
| Kullanıcı tablosu + RLS | Gerekli | Yok |
| Yasal metinler | Baştan yazılır | **Değişmiyor** |

Son satır en önemlisi. `public/gizlilik.html` birinci paragrafta
"yalnızca kendi cihazında durur; **bize hiç ulaşmaz**" diyor. Tam senkron
bunu yalan yapıyordu. Kendi Drive'ına yedekte veri bize değil kullanıcının
kendi hesabına gidiyor — cümle doğru kalıyor, e-posta toplamıyoruz, Play
Veri Güvenliği beyanı olduğu gibi kalıyor.

### Aşama 1: paylaş menüsü, hiç OAuth yok

Karar: önce OAuth'suz olanı yapmak, "sonra gelişecek" diye not düşmek.

Yedek dosyası zaten üretiliyor (Ayarlar → Yedek al). Tek eklenen şey onu
Android'in paylaş menüsüne vermek; kullanıcı oradan "Drive'a kaydet"i
seçiyor. Geri yükleme de dosya seçiciyle.

Bunun bedeli: Google'a tek bir OAuth isteği gitmiyor, doğrulama süreci
yok, SHA-1 yok, keystore bağımlılığı yok, Play beyanı değişmiyor. Kimlik
doğrulamayı **işletim sistemi** yapıyor, biz değil. Maliyet ~1 gün.

Karşılığında kaybedilen tek şey otomatiklik: kullanıcı her seferinde elle
seçiyor. Gerçek entegrasyon (bkz. Sırada) bunu çözecek ama release
keystore'a bağlı olduğu için yayından önce yapılamaz — ters sırada
yapılırsa aynı iş iki kez yapılır.

## 2026-09-22 — APK derlemesi Java 21 istiyor

`./gradlew assembleDebug` şu hatayla düştü:

```
Cannot find a Java installation ... matching: {languageVersion=21}
```

Java 21 **kuruluydu** (`/opt/homebrew/opt/openjdk@21/...`) ama `JAVA_HOME`
17'yi gösteriyordu ve Gradle toolchain'i brew'un dizininde bulamadı.
Çözüm, derlemeye 21'i açıkça vermek:

```
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  ./gradlew assembleDebug
```

Kalıcı çözüm istenirse `JAVA_HOME`'u kabuk profilinde 21'e çekmek ya da
`android/gradle.properties` içine `org.gradle.java.home` yazmak. İkincisi
depoya girer ve başka makinede yanlış yolu gösterir; o yüzden yapılmadı.

## 2026-09-22 — Yedek paylaş menüsüne bağlandı (Drive, Aşama 1)

Aşama 1 yapıldı: yedek dosyası artık işletim sisteminin paylaş menüsüne
gidiyor, kullanıcı oradan Drive'ı seçiyor. Tek bir OAuth isteği yok.

### Plan "~1 gün, hiç eklenti yok" diyordu — değilmiş

Aşama 1 tasarlanırken varsayım şuydu: dosya zaten üretiliyor, tek eklenen
şey `navigator.share`. Koda bakınca varsayım düştü ve sebebi **daha önce bir
kez çarptığımız duvarın aynısıydı**.

Android System WebView `navigator.share`'i uygulamıyor — tıpkı
`speechSynthesis`i uygulamadığı gibi (bkz. *APK'da ses yoktu*). Üstelik
`a.download` da orada çalışmıyor. Yani APK'da "Yedekle" düğmesi **hiçbir şey
yapmayan bir düğme** olacaktı; Android Chrome'da (PWA kurulumu) ise
çalışacaktı. Sessiz kalite hatalarının tam da kaçınılmak istenen türü.

Çözüm `speech.ts` ile aynı desen: üç durumlu bir geçit.

```
native — Capacitor kabuğu: önbelleğe yaz, URI'yi paylaş menüsüne ver
web    — tarayıcının kendi navigator.share'i
indir  — klasik a.download (masaüstü)
```

`@capacitor/share` + `@capacitor/filesystem`, ikisi de **dinamik `import`**
ile — web paketine giren bayt sayısı sıfır, ayrı parça olarak yalnızca native
kabukta iniyor. Ana paket 506,4 → 507,6 KB; o 1,2 KB geçidin kendi kodu.

### Neden iki dosya tek kapıdan geçiyor

`share.ts` içinde `paylas()` diye özel bir yardımcı vardı ve **aynı kusuru
taşıyordu**: kanca panosu da APK'da paylaşılamazdı. İki ayrı düzeltme yazmak
yerine `dosya.ts` tek kapı oldu; `share.ts` artık onu çağırıyor.

Kanca panosunun APK'da çalışması bu turda istenmemişti — bedava geldi, çünkü
düzeltilen şey paylaşımın kendisi değil, **dosyayı dışarı verme yolu**.

### Önbellek dizini, belgeler değil

Native yol dosyayı `Directory.Cache`'e yazıyor. Bu dosya bir **çıktı**,
saklanacak veri değil: kullanıcı Drive'a kopyaladıktan sonra işletim sistemi
onbelleği temizleyebilir. `Documents` seçilseydi her yedekleme cihazda kalıcı
bir çöp bırakırdı.

### İptal iki dilde geliyor

Web tarafı `AbortError` atıyor, Capacitor'ın Share eklentisi ise platforma
göre değişen bir **metin** ("Share canceled" / "cancelled"). İkisi de
yakalanmazsa vazgeçen kullanıcının dosyası bir de ayrıca inerdi — yani
"vazgeç" düğmesi dosya indirirdi.

### Arayüz metni yola göre değişiyor

Paylaş menüsü açılacaksa düğme **"Yedekle"**, dosya inecekse **"Yedek al"**.
Aynı düğmeye iki farklı şey yaptırıp tek isim vermek, ikisinden birinde yalan
söylemek olurdu.

### Kalan

Native taraf `npx cap add android` sırasında kendiliğinden kuruluyor (`add`
zaten `sync` çalıştırıyor), yani APK adımları değişmiyor. `android/` **zaten
duruyorsa** eklentiler girmez; o durumda `npx cap sync android` gerekir.

Paylaş menüsü **gerçek cihazda denenmedi** — telaffuz ve bildirim ikonuyla
aynı sırada bekliyor.

---

## 2026-09-22 — Play yayını: sürüm ve imza

APK'ya kadar olan her şey **debug** derlemesiydi. Play'e çıkmak üç şeyi
değiştiriyor ve üçü de `android/` depoda tutulmadığı için ayrı bir adım
gerektiriyor.

### versionCode her derlemede 1'e dönüyordu

`cap add android` üretilen `build.gradle`'a her seferinde aynı şeyi yazıyor:

```
versionCode 1
versionName "1.0"
```

Play ise her yüklemede versionCode'un **artmasını** şart koşuyor. İlk yükleme
geçer, ikinci güncellemede yine 1 üretilir ve Play reddeder. *"android/
tutulmaz"* kararı tek başına Play'e çıkmaya yetmiyor.

`tools/android-release.mjs` eksik parçayı kapatıyor: sürümü `package.json`'dan
alıp enjekte ediyor.

**Neden `package.json`.** Sürüm zaten tek kaynaktan geliyor — Ayarlar ekranı
`__APP_VERSION__` ile, ölçüm kayıtları `surum` sütunuyla oradan besleniyor.
Android'in ayrı bir sayı taşıması, kullanıcının ekranda gördüğü sürüm ile
Play'deki sürümün sessizce ayrışması demekti.

**Kod şeması:** `major*10000 + minor*100 + patch` — `1.2.3` → `10203`.
Yalnızca minor ve patch 100'ün altında kaldıkça monoton artıyor; aşılırsa
sessizce çakışırdı, o yüzden betik açıktan kontrol edip patlıyor. Play daha
küçük bir versionCode'u kabul etmiyor ve **geri dönüş yok**.

### İmza bilgileri depoya girmiyor

Aynı betik `signingConfigs.release` bloğunu da enjekte ediyor; değerleri
`android-imza.properties`ten okuyor. O dosya ve `*.jks` `.gitignore`'da.

Dosya yoksa blok yine yazılıyor ama boş kalıyor: debug derlemesi çalışmaya
devam eder, release derlemesi *"imzasız"* diye düşer. Sessizce imzasız bir
paket üretmektense açıkça patlaması iyi.

> **Keystore kaybolursa uygulama bir daha güncellenemez.** Play aynı imzayı
> şart koşuyor ve kurtarma yolu yok. Dosyanın ve parolanın yedeği depoda
> değil, ayrı bir yerde durmalı.

### Play APK değil AAB istiyor

Yeni uygulamalarda `.aab` zorunlu:

```
cd android && ./gradlew bundleRelease     # Play'e yüklenecek
cd android && ./gradlew assembleRelease   # kendi dağıtımın için imzalı APK
```

İkisi de aynı keystore'la imzalanıyor.

### İmzasız paket sessizce üretiliyordu — iki tur sürdü

İlk yazılışta `signingConfig signingConfigs.release` **koşulsuz** bağlıydı ve
imza bloğu keystore yokken boş kalıyordu. `bundleRelease` şunu verdi:

```
Execution failed for task ':app:signReleaseBundle'.
> java.lang.NullPointerException (no error message)
```

1 dakika 17 saniye derledikten sonra, eksik olanın ne olduğunu söylemeyen bir
NPE. Bağlama koşullu yapıldı — ama tek başına bu da yetmiyordu: dosya yokken
bu sefer **imzasız bir AAB sessizce üretiliyor** ve bu ancak Play'e yükleyip
reddedilince anlaşılıyor. Sessiz bir başarı, okunur bir hatadan kötü.

Çözüm `gradle.taskGraph.whenReady`: görev grafiği hazır olur olmaz bakıyor,
derlemeye hiç başlamadan **18 saniyede** düşüyor ve hangi dosyanın eksik
olduğunu satır satır yazıyor. Debug derlemesi etkilenmiyor.

> Kaçış tuzağı: hata metni önce bir JS şablon dizgisinden, sonra Groovy'den
> geçiyor. `
` ikisinde de çözülüp dizgiyi ikiye bölüyor ve `build.gradle`
> hiç derlenmiyordu — **debug dahil her şey** kırılmıştı. Metin Groovy'nin üç
> tırnaklı dizgisinde, kaçışsız.

### İmza dosyası BOM'la yazılınca Gradle "null" diyor

İlk imzalı derleme şununla düştü:

```
A problem occurred evaluating project ':app'.
> Cannot convert 'null' to File.
```

Sebep `android-imza.properties`in **UTF-8 BOM**'uyla yazılmış olmasıydı.
Java'nın `Properties.load`u dosyayı ISO-8859-1 okuyor ve BOM baytlarını
(`EF BB BF`) **ilk anahtarın adına** yapıştırıyor: `storeFile` değil
`﻿storeFile`. Değer null kalıyor, Gradle da BOM'dan hiç söz etmeden
"null" diyor.

Windows'ta tuzağa düşmek **varsayılan davranış**: PowerShell 5.1'de
`Set-Content -Encoding utf8` tam da BOM'lu yazıyor. `android-release.mjs`
artık dosyanın başına bakıp BOM'u sessizce temizliyor.

### Üretilen paketler doğrulandı

```
bundleRelease + assembleRelease → BUILD SUCCESSFUL (38 sn)
app-release.aab  5,35 MB   jarsigner: "jar verified"
app-release.apk  5,48 MB   apksigner: Verifies (v2 scheme)
```

Debug APK 6,5 MB'tı; release'in daha küçük olması beklenen (debug simgeleri
ve test altyapısı yok).

`v1 scheme: false` bilerek — JAR imzası yalnızca API 24 altı için gerekiyor,
bizim `minSdk` zaten 24.

**İmza sertifikasının SHA-1'i:**

```
6a:37:b9:61:aa:27:bb:60:c5:89:1a:3b:99:3c:40:5c:b3:7b:40:14
```

Bu değer Faz 2'de (gerçek Drive entegrasyonu) OAuth istemcisi için
gerekecek — notlarda *"release keystore'un SHA-1'i"* diye geçen şey bu.
Artık var.

### sdkmanager kaldırılmış

`sdkmanager --licenses` ve `sdkmanager "platforms;android-36"` artık uyarı
basıp **boş dönüyor**: Google yerine `android` CLI'ını koymuş.

```
android sdk install "platforms;android-36"
android sdk install "build-tools;36.0.0"
```

Lisans onayı da ayrı bir adım değil, kurulumun içinde. Eski komut hata
vermeden hiçbir şey yapmadığı için fark edilmesi zor.

### Windows — doğrulandı

- **JDK 21** (Microsoft OpenJDK 21.0.12), `JAVA_HOME` makine düzeyinde
- **Android SDK**: cmdline-tools + platform-36 + build-tools 36.0.0 +
  platform-tools, `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`, ~426 MB
- `./gradlew` yerine `gradlew.bat`
- exFAT'e özgü `buildDirectory` bloğu **gerekmiyor** — o `._` gölgeleri
  macOS'un sorunuydu

Capacitor 8'in istediği: `compileSdk 36`, `minSdk 24`, AGP 8.13.

`assembleDebug` **BUILD SUCCESSFUL**, APK 6,5 MB. Paket içi doğrulandı
(`aapt2 dump badging`): `com.hafizada.ingilizce`, versionCode **10000**,
versionName **1.0.0**, minSdk 24, targetSdk 36.

Derleme sırasında `SDK XML version 4 ... only understands up to 3` uyarısı
çıkıyor; AGP ile SDK araçlarının farklı zamanlarda çıkmasından, zararsız.

> Tuzak: `npm run android:release | Select-Object -First 4` betiği **erken
> öldürüyor** — PowerShell boru hattını kapatıyor ve node dosyayı yazmadan
> ölüyor. Çıktı normal göründüğü için fark edilmiyor; `versionCode 1` kalıyor.

---

## 2026-09-23 — Cihaz turundan çıkanlar

İlk gerçek telefon turu. Telaffuz sorunsuz çıktı. Geri kalanı bu bölüm.

### Cihazda doğrulananlar — ölçümle

Telefonda denenen her şey **ölçüm kayıtlarıyla** karşılandı; "çalışıyor
gibi görünüyor" ile yetinilmedi:

| Ne | Kanıt |
|---|---|
| Telaffuz | Cihazda duyuldu; `sesVar` true, Ayarlar satırı görünür |
| Paylaş menüsü | `yedek_alindi {yol: "native"}` — menü gerçekten açıldı |
| Telefona kaydet | `yedek_alindi {yol: "telefon"}` |
| Hatırlatma + saat seçici | `hatirlatma_degisti {saat: 1, dakika: 46}` |
| Bildirim ikonu | Cihazda görüldü |
| Geri tuşu | Cihazda denendi |
| Profil fotoğrafı | `profil_degisti {avatar: "foto"}` |

`yol` alanının değeri bu yüzden konmuştu: *"Android'de paylaş menüsü
gerçekten açılıyor mu"* sorusu tek bir telefonun tarifiyle değil, kayıtla
cevaplandı.

### Saat seçici `change`i iki kez gönderiyor

```
hatirlatma_degisti  {saat:1, dakika:46}  01:45:12
hatirlatma_degisti  {saat:1, dakika:46}  01:45:12
```

Android'in saat seçicisi tek seçim için iki olay üretiyor. `ders_bitti`
ile aynı sınıftan: zarar ölçümle sınırlı değil, bildirim de iki kez
kuruluyordu. `hatirlatmayiAyarla` artık gelen değer mevcutla aynıysa
hiçbir şey yapmadan dönüyor.

> Bu iki çift kaydın ikisi de ancak ÜRETİMDE, gerçek cihazda ortaya çıktı.
> Tarayıcıda tıklayarak da, testle de görünmüyorlardı — ölçümün ilk
> karşılığı bu oldu.

### Uygulama simgesi hiç üretilmiyormuş

Kurulan APK'da **Capacitor'ın varsayılan simgesi** duruyordu. 21 Eylül'de
"düzeltildi" diye kayda geçmişti ama düzeltmenin yarısı yapılmış: kaynaklar
`resources/` altına konmuş, onları Android'e çeviren adım hiçbir yere
bağlanmamış. `@capacitor/assets` bağımlılıklarda bile yoktu.

`android/app/src/main/res/mipmap-*/ic_launcher.png` dosyalarının tarihi
**11 Eylül** — yani Capacitor'ın şablonundan beri hiç değişmemişler.

Bildirim ikonuyla birebir aynı sınıftan bir boşluk: `android/` depoda
tutulmadığı için `cap add` sonrası çalışması gereken bir adım var ve o adım
unutulunca hiçbir hata vermiyor, sadece yanlış görsel kalıyor.

`npm run icons:android` eklendi, YAYIN.md'deki zincire girdi.

### Geri tuşu — iki ayrı iş

**Ekrandaki düğme** tipografik `←` karakteriydi, 36×36 kutu içinde.
Karakterin çizgisi yazı tipinden geliyor ve ince kalıyordu; kullanıcı
"bulamıyorum" dedi. Artık SVG çizim (2.75 kalınlık, ikon setiyle aynı dil),
48×48, dolu beyaz zemin ve halka. Sorun yalnızca dokunma hedefi değil
**kontrasttı**.

**Donanım geri tuşu** hiç ele alınmamıştı: nerede olursan ol, geri =
uygulamadan çık. Ders ortasında yanlışlıkla basan kullanıcı dışarı
düşüyordu.

Gezinme URL tabanlı değil state tabanlı, yani tarayıcının geçmişi "nerede
olduğumuzu" bilmiyor — o bilgi ekranlarda. `geri.ts` bir işleyici yığını
tutuyor; her ekran kendi davranışını kaydediyor.

> **Öncelik, kayıt sırası değil.** React `useEffect`leri çocuktan ebeveyne
> koşuyor: iç ekran ÖNCE kaydolur, App SONRA. Sırayla gidilseydi en son
> kaydolan (App) en üstte çıkar ve iç ekranlar hiç söz alamazdı.

> **İşleyici ref'te tutuluyor.** Doğrudan kaydedilseydi yalnızca ilk
> render'ın kapanışı kaydolur ve state hep başlangıç değeriyle okunurdu —
> Egzersiz'in `calisiyor` kontrolü sonsuza kadar `false` görür, App de her
> zaman çıkış onayını açardı. Sessizce yanlış çalışan türden.

Sıra: açık bir akış varsa kapat → sekme ana sekme değilse oraya dön → ana
ekranda çıkış onayı. Onayda birincil düğme **Vazgeç**; çıkış ikincil.

### Yedekleme: paylaş menüsü kısıtlanamıyor

İstek "sadece Drive ve telefondaki klasör görünsün"dü. **Mümkün değil** —
paylaş listesini Android hazırlıyor, içinde hangi uygulamaların görüneceğini
seçen bir API yok.

Menüyü kısıtlamak yerine menüye alternatif kondu: **"Telefona kaydet"**
dosyayı doğrudan `Belgeler/Hafizada/` altına yazıyor, menü hiç açılmıyor,
ekranda nereye kaydedildiği yazıyor. Yanında **"Paylaş"** duruyor.

`Directory.Documents` bilerek — kanca panosunun kullandığı `Cache`in aksine
kalıcı ve kullanıcı dosya yöneticisinden görebiliyor. Yedeğin bulunabilir
olması tek işi.

Gerçek Drive entegrasyonu (tek dokunuş, menü yok) hâlâ Faz 2; tek engeli
olan release keystore SHA-1'i artık var.

### Hatırlatma saati serbest

Dört sabit seçenek vardı (9/13/19/21) ve gerekçesi "az seçenek, hızlı
karar"dı. Kullanıcı serbest seçim istedi — haklı: günün hangi saatinde
çalışıldığı kişiye göre değişiyor ve dördünden biri tutmuyorsa hatırlatma
tamamen işe yaramaz hale geliyor.

`type="time"` kullanıldı: Android WebView burada **sistemin kendi saat
seçicisini** açıyor. Kendi çarkımızı çizmek hem daha kötü çalışırdı hem
cihazın 12/24 saat tercihini bilmezdi. `reminderMinute` eklendi; eski
kayıtlarda yok, varsayılanı 0, yani eski kullanıcının 19:00'ı 19:00 kalıyor.

---

## 2026-10-04 — Web yayını, üyelik ve senkron

Tek günde web sürümü yayına çıktı, tasarım dili değişti ve üyelik
gerçekten bir şey ifade eder hale geldi. Sıra şu: **alan adı → tasarım →
üyelik → senkron.**

### Alan adı ve yayın

`hafizada.com` alındı (Natro), DNS **Cloudflare**'de. Depo `ingilizce`
olarak yeniden adlandırıldı; kullanıcı sitesi (`hasanozdemiryz-blip.github.io`)
alan adını taşıyor ve proje depoları ondan miras alıyor:

| | |
|---|---|
| `hafizada.com/` | tanıtım sayfası (portal deposu) |
| `hafizada.com/ingilizce/` | uygulama (`ingilizce` deposu) |

**HTTPS'te saatler kaybedildi.** A kayıtları doğruydu, Cloudflare proxy'si
kapalıydı, CAA engeli yoktu, proje deposu çakışmıyordu — GitHub yine de
sertifika üretmiyordu. Eksik olan **AAAA kayıtlarıydı**. Dördü eklenince
(`2606:50c0:8000::153` … `8003::153`, hepsi gri bulut) sertifika dakikalar
içinde onaylandı ve HTTPS zorlaması açıldı.

> Apex alan adında GitHub Pages AAAA istiyor. Belgelerde "önerilir" diyor
> ama pratikte sertifika üretimi bunsuz başlamıyor.

### Tasarım: ölçülen değerler

Memrise referans alındı. İlk denemede dili doğru okuyup **değerleri tahmin
ettim** ve ortaya karikatürü çıktı — kullanıcının tepkisi "kaba durdu"
oldu, haklıydı. İkinci turda memrise.com'un hesaplanmış stilleri tarandı:

| | Memrise | İlk denemem |
|---|---|---|
| Başlık ağırlığı | 700 | 900 |
| Kenarlık | 2px | 3–4px |
| Sert gölge | `0 2px 0` | `4px 4px 0` |
| Düğme köşesi | 6–8px | hap (999px) |
| Harf aralığı | normal | −0.028em |
| Sarı | `#FFC000` | `#FFD23F` |

**Ders:** referans alırken gözle bakma, `getComputedStyle` ile ölç. Her
boyutta yaklaşık iki katına çıkmışım.

Yazı tipi Archivo'dan **Nunito**'ya döndü: Memrise'ın Boing'i yuvarlak
geometrik, Archivo sıkı bir grotesk — sertliğin bir kısmı oradan geliyordu.
Nunito zaten uygulamanın başlık fontu, yani tanıtım sayfasıyla uygulama
artık aynı yüzü kullanıyor.

**İki register, tek marka.** Tanıtım sayfası kalın çerçeve + sert gölge +
koyu bölümler (tanımadığını ikna etmesi gerekiyor); uygulama açık, yumuşak,
krem (her gün geleni yormaması gerekiyor). Memrise'ın kendi ayrımı da bu.

Uygulama paleti gök mavisinden **kreme** döndü, geniş ekranda alt sekme
çubuğu **beyaz yan menüye** dönüşüyor — tek bileşen iki biçim veriyor,
sekme listesi bölünmüyor.

### Üyelik

Sihirli bağlantıyla başladı, **e-posta + şifreye** döndü. Şifresiz yol
tamamen kaldırıldı: iki giriş yolu sunmak kullanıcıyı hangisini
kullandığını hatırlamak zorunda bırakıyor.

**Üyelik = onay + ad.** E-posta onayı tek başına yetmiyor. E-posta ile
kayıt olana ad, seviye ve hedef soruluyor; **Google ile girende ad
sağlayıcıdan geldiği için üyelik ilk anda tamam** ve bilgi adımı hiç
görünmüyor. (Kullanıcının düzeltmesi: "normal sistemlerde nasılsa öyle
olsun.")

Bilgi `user_metadata`da, ayrı tablo yok — oturumla birlikte geldiği için
"tamamlamış mı" sorusu açılışta ek istek olmadan cevaplanıyor.

**Google kodda hazır, sağlayıcı kapalı.** `VITE_GOOGLE_GIRIS=1` secret'ı
verilene kadar düğme görünmüyor; kapalıyken göstermek tıklayan herkese
Google hata sayfası demek.

### İlerleme senkronu — hesabın asıl sebebi

Bir süre üyelik yalnızca "hesap"tı: e-posta vardı, ilerleme cihazdaydı ve
arayüz "telefonunu değiştirsen de devam edersin" diyordu. **Yalandı.**
Proje taramasında yayını durduran tek şey buydu.

Sunucuda kullanıcı başına **tek satır, tek jsonb paket** (`public.ilerleme`,
RLS ile kendi satırına kilitli). Kart başına satır granüler senkron
sağlardı ama her ders sonunda onlarca upsert ve satır bazlı çakışma çözümü
demekti; havuz 300 kelime ve hesabı tek kişi kullanıyor.

**Çakışmayı sunucu değil istemci çözüyor** (`birlestir`, saf, 15 test):

| Ölçek | Kural |
|---|---|
| Kartlar | Kart bazında **son hareket eden**; eşitlikte ileri basamak |
| Seriler | En büyüğü |
| Günler | Aynı gün iki cihazda → en yüksek sayaç (toplamak iki katına çıkarırdı) |
| Cevaplar | Birleşim, tekrarlar ayıklanmış, son 3000 |
| Tercihler | Daha **taze** paketinki |

**Yayına almadan yakalanan hata — paketin tazeliği.** `yereliOku` paketi
*şimdiki zamanla* damgalıyordu, yani yeni kurulmuş boş bir cihaz sunucudaki
paketten hep taze görünüyordu. Çıkış yapıp tekrar giren kullanıcı adını,
günlük hedefini ve serisini kaybederdi. Damga artık **verinin kendisinden**
hesaplanıyor (en son cevap, en son kart hareketi, son ders günü); hiçbir
hareketi olmayan cihaz sıfır döner ve her karşılaştırmayı kaybeder.

> Genel ders: "ne zaman paketlendi" ile "veri ne zaman değişti" aynı şey
> değil. Senkronda ikincisi lazım.

**Çıkışta temizlik.** Çıkan kişinin ilerlemesi cihazda kalmıyor. Önce
gönderiliyor, sonra siliniyor; senkron tutmazsa çıkış **yapılmıyor** ve
sebebi söyleniyor.

**Hesap silme** edge function ile (`hesap-sil`): kullanıcı silmek yönetici
yetkisi istiyor, o anahtar tarayıcıya konulamaz. Silinecek kimlik gövdeden
değil **jetondan** okunuyor. Onay için `SİL` yazdırılıyor.

### Üç hata ve sebepleri

Kullanıcı üç şikâyet etti, üçünün de sebebi farklı çıktı:

| Şikâyet | Sebep |
|---|---|
| "Bilgileri doldurdum, hâlâ tamamla diyor" | Veritabanında kayıtlıydı; `getSession` **depodan** okuyor ve kullanıcının eski halini taşıyabiliyor. Açılışta `getUser` ile tazeleniyor |
| "Kayıtlı adrese posta gelmiyor, uyarı da yok" | Supabase kullanıcı sayımını engellemek için **hata döndürmüyor**, sessizce hiçbir posta göndermiyor. Tek işaret `identities` dizisinin boş olması |
| "Giriş yap derse atıyor" | Kod doğruydu. **Servis çalışanı eski paketi tutuyordu.** `controllerchange` dinlenip sayfa bir kez yenileniyor |

> Üçüncüsü en sinsisi: ben "düzelttim" diyordum, kullanıcıda eski paket
> çalıştığı için düzelmiyordu. PWA'da sürüm geçişi kurulmadan hata
> ayıklamak zaman kaybı.

### Görsel üretimi

Kart reçetesi (`tools/gorsel-recetesi.md`) aynen kullanıldı — aynı stil
referansı, aynı `seed 20260918`, aynı iskelet. Üretilenler:
`brand/anasayfa/` altında üç bölüm çizimi (kulaklık, merdiven, cihazlar) ve
`kisiler/` altında dört kullanım sahnesi. Toplam **~600 kredi**.

İki ders: "%75 yükseklik" demek yetmiyor, kenarlara dayanınca "WIDE empty
margin" diye ayrıca yazmak gerekiyor; ve bant zeminini görselin kendi köşe
tonundan almak kırpmayı tamamen gereksiz kılıyor (`zeminTonu`).

### Akşam turunda çıkanlar

Kullanıcı canlıda gezip tek tek bildirdi; dördü de gerçek hataydı.

**Giriş yapınca ana sayfaya atıyordu.** Başarılı girişten sonra `onKapat`
aynı tikte çağrılıyor ve o kapanış, giriş anındaki **eski render'ın**
kapanışı oluyor — oradaki `uye` hâlâ `null`. "Girmemiş" sanıp geri
gönderiyordu. Kapanışın sebebi artık tahmin edilmiyor, açıktan
bildiriliyor: `onKapat(girisYapildi)`.

> Genel kural: bir geri çağrı "şu an durum ne" diye React state'ine
> bakıyorsa ve o durum aynı tikte değişiyorsa, cevabı **çağıran** vermeli.

**Hesap silme hiç çalışmıyordu.** Edge function `jsr:@supabase/supabase-js`
ile yazılmıştı; Edge Runtime bu biçimi desteklemiyor ve işlev **hiç
başlamıyordu**. İstemci "hesap silinemedi" görüyor, sebebi hiçbir yerde
görünmüyordu. `npm:` biçimine geçildi. Doğrulama da ağ geçidinden alınıp
işlevin içine taşındı (`verify_jwt: false`): geçit doğrularsa hatayı o
döndürüyor ve istemciye anlamsız bir gövde gidiyor.

> Edge function yazarken `npm:` kullan. Ve dağıttıktan sonra jetonsuz bir
> `curl` at — işlev başlıyor mu, orada görülüyor.

**Ad değişmiyor sanıldı, aslında eski paket çalışıyordu.** Yerelde test
edildi, anında değişiyordu. Gün boyunca üç ayrı "düzelmedi" bildiriminin
ikisi bu yüzdendi. Sürüm geçişi düzeltmesi (`controllerchange`) yayında
ama bir kez elle `Unregister` gerekiyor.

**Profil ile hesap karışıyordu.** Ad iki ayrı yerden değiştirilebiliyordu
ve biri diğerini sessizce eziyordu. Artık üyenin adı yalnızca hesaptan;
profil ekranında avatar, fotoğraf ve çerçeve kalıyor.

### Tarayıcıda doğrulama tuzağı

`Page.captureScreenshot` kaydırılmış sayfada değil, **çalışan bir
zamanlayıcı** varken takılıyor. Slider'ın `setInterval`'i sayfayı hiç
durağan bırakmıyordu. Her ekran görüntüsünden önce:

```js
for (let i = 1; i < 9999; i++) { clearInterval(i); clearTimeout(i); }
// + geçişleri kapatan bir <style>
```

## 2026-10-05 — Kullanıcı turu: üyelik kararlılığı, senkron, ders ekranı

Kullanıcı canlıda gezip bir liste getirdi. Sebepler:

| Şikâyet | Sebep | Çözüm |
|---|---|---|
| Bilgiler doldurulduğu halde yenilenene kadar "üyeliğini tamamla" | `useUyelik` anlık görüntüsü yalnızca **kimliği** karşılaştırıyordu; aynı kişinin `bilgi`si değişince ekran tazelenmiyordu | Nesne karşılaştırması |
| Girişliyken "10 kelimeyi kaydetmek için üye ol" anlık çıkıp kayboluyor | SDK açılıştan sonra iniyor; şerit ve ders sonu daveti `hazir`ı beklemiyordu | `hazir` olmadan davet gösterilmiyor |
| Google hesap sormadan giriyor | — | `prompt: select_account` |
| Telefonda avatar/fotoğraf değişmiyor | Senkron tercihleri **paketin ders hareketine** göre seçiyordu; telefonda avatar değişip bilgisayarda ders yapılınca eski profil yenisini eziyordu | `tercihDegisti` damgası (`tercihKaydet`), tercihler kendi damgasıyla birleşiyor; tercih değişince senkron tetikleniyor |
| Gizli sekmede ilerleme "kendiliğinden" geldi | Oturumsuz okuma **mümkün değil** (anon anahtarla `ilerleme` sorgusu boş döndü, RLS doğru). Gizli sekmede Google hesap sormadan aynı e-postayla girmiş; Supabase aynı e-postayı tek hesap sayıyor | Hesap seçimi artık soruluyor |
| Gece yarısı hedef dolmamış göründü | Kartlar **görüldükleri anın** tarihiyle yazılıyordu; 00:00'ı geçen ders iki güne bölünüyordu | Ders başladığı güne yazılıyor (`dersBasi`) |

**Canlı testte ikinci sebep çıktı — yarış.** Damga tek başına yetmedi:
profil ekranı kapanır kapanmaz senkron başlıyor, yeni avatar ondan **sonra**
kaydediliyordu. Ölçüm: 100 ms'de `tilki`, 300 ms'de senkron eski `kedi`yi
geri yazmış. `yereleYaz` artık yazmadan önce cihazı **aynı işlemin içinde**
yeniden okuyup birleştiriyor; ağ beklenirken yazılan hiçbir şey
(profil, ayar, cevap) ezilmiyor. Profil de kapatmadan önce yazılıyor.
Canlıda gerçek hesapla doğrulandı: yerel ve sunucu ikisi de yeni avatarda.

> Genel ders: senkronda "hangi paket daha taze" tek soru değil. Ders
> ilerlemesi ve tercihler ayrı zamanlarda, ayrı cihazlarda değişiyor —
> her birinin kendi damgası olmalı.

**Ders ekranı.** Yazma kutusu ekranın dibinden kartın hemen altına alındı.
Yönergeler ("Ne duyuyorsun?", "Türkçesi hangisi?") 14px soluktan 18px
kalına çıktı (`Yonerge`); hoparlörler büyüdü (dinleme 128px, küçük
düğmeler 44/56px). Geri düğmesi 48px + `-ml-2`'den 40px'e, kenardan boşluklu.

**Metin sadeleştirme.** Kullanıcıya iç işleyişi anlatan cümleler çıkarıldı
ya da kısaltıldı ("kartlar + 6 basamak", "merdivende ne kadar yukarı",
"her alıştırma bir kez sayılır…", "üstü serbest değil"…). Yeni kelimelerin
gece 00:00'da geldiği Ayarlar'da ve hedef dolunca ana ekranda yazıyor.

**Doğrulanmayan:** giriş gerektiren akışlar (bilgi adımı, Google hesap
seçimi, girişli açılışta davetin görünmemesi) kullanıcının hesabıyla
`localhost:5173`'te denenecek — bende test hesabı yok.

## 2026-10-05 (öğleden sonra) — Giriş/çıkış, site çatısı, blog

**Uygulama.** Girişten sonra "Giriş yapıldı" ekranı (ad/seviye/hedef isteğe
bağlı; zorunlu bilgi adımı kalktı). Avatara dokununca hesap menüsü: profil,
ayarlar, **çıkış — iki dokunuş**. Çıkış eskiden Ayarlar'ın dibinde, "Hesabı
sil"in yanında ve kırmızıydı. Girişli kullanıcı deneme dersini görmüyor;
denemede "Atla" var. Tıklanabilir her şeyde el imleci (Tailwind 4 düğmede
varsayılan oku bırakıyor). Sürekli duran "✓ Giriş yapıldı" rozeti kullanıcı
isteğiyle kalktı; menüde e-posta duruyor.

**Site tek kabuk.** `tools/site.mjs` + `site/`: ana sayfa, iletişim, yasal
sayfalar, blog ve kelime sayfaları aynı menü ve footer'la üretiliyor; eski
`anasayfa/sablon.html` kalktı. Görseller artık dosya (`varliklar/`), ana
sayfa 248 KB → 24 KB. `public/*.html` yasal sayfaları yönlendirme oldu
(Play Console'daki adres bozulmasın).

**Yasal metinler senkrona göre güncellendi.** "Verilerin cihazından hiç
çıkmaz" diyordu; senkrondan beri üye için doğru değildi. Üyelik verileri,
iletişim formu ve uygulama içi hesap silme eklendi. Avukat okuması yok.

**Kelime sayfaları: 100 değil 20.** Önce setin tamamı sayfalaştırıldı;
kullanıcı "çok riskli değil mi" diye sordu, haklıydı:

- Kancalar ürünün asıl değeri ([[blarma-rakip]]); yüzünü aramaya açmak
  kopyalanmayı kolaylaştırır.
- "X ne demek" aramalarında Google kendi çeviri kutusunu ve sözlükleri
  gösteriyor; yeni sitenin oradan trafik alması zor.
- Aynı şablondan yüz sayfa "toplu üretilmiş içerik" sayılıp bütün sitenin
  sıralamasını düşürebilir.

Karar: blog + sıklık sırasına göre ilk **20** kelime (`VITRIN`). Blogdaki
yayında olmayan kelime bağlantıları üretimde düz yazıya dönüyor. Search
Console verisi gelince (4–6 hafta) genişletme kararı verilecek.

**İngilizce arayüz.** `src/dil.ts` + `src/dil/en.ts`: anahtar Türkçe
metnin kendisi (`t('Devam')`), sözlükte ~400 karşılık. Kart içeriği
(Türkçe anlam, Türkçe kanca) çevrilmiyor — yöntem Türkçe konuşana göre.
Dil değişince uygulama yeniden açılıyor (modül düzeyindeki listeler bir
kez çevriliyor). `dil.test.ts` üç şeyi yakalıyor: sözlükte olmayan
anahtar, `t()` dışında kalan Türkçe metin, Türkçe harfi olmayan ama
çevrilmemiş metin ("Atla" böyle kaçmıştı) ve yer tutucu uyumsuzluğu.

> Varsayılan **Türkçe**, tarayıcı diline göre otomatik seçim yok:
> tarayıcısı İngilizce olan Türk kullanıcılar güncellemeyle bir anda
> İngilizce arayüze düşerdi. Seçim karşılama ekranında ve Ayarlar'da.

> Sayfa `lang="en"` iken CSS `uppercase` "İngilizce"yi "İNGILIZCE"
> yapıyor; marka kilidi `lang="tr"` taşıyor.

**İletişim formu açık.** CLI girişi bu makinede çalışmadı (TTY'siz ortam
tarayıcı akışına izin vermiyor), kurulum panelden yapıldı: SQL editörde
migration, Edge Functions → editörden `iletisim`, **Verify JWT kapalı**.
Alıcı/gönderen/tuz varsayılanları kodda; tek sır `RESEND_API_KEY`.
**Kullanıcı e-posta bildirimi istemedi** ("panelden bakarım, daha az
uğraş"); anahtar eklenmedi, mesajlar Table Editor → `iletisim`te okunuyor
(`eposta_gitti = false`). Yasal metinler buna göre: e-postayla iletim yok.
İleride bildirim istenirse yalnızca sır eklemek yetiyor, kod hazır. Gönderen
`iletisim@hafizada.com` — giriş postaları da Resend'de aynı alan adından.

## 2026-10-06 — Kart incelemesi ve 166 yeni görsel (set 266)

**İnceleme** (`kart-inceleme.xlsx`, kaynak `tools/kart-inceleme.json`): 300
kartın her biri tür (G gerçek ses kancası 134 / O tanıdık-ödünç 132 / Y
yalnızca okunuş 34), kalite, kategori, sözcük türü ve önerilen kararla.
38 kart "düzelt"; çoğuna yeni kanca önerisi var (chew ≈ çiğ, brake ≈
bırak, shake ≈ şeyh, sugar ≈ şu gar…). Kullanıcı hatalılara sonra bakacak.

**Üretim:** 100 görsel (+4 yeniden), ~7.800 kredi. Seçim: görselsiz,
düzeltme gerektirmeyen, kalite ≥2 kartlar (`tools/gorsel-sirasi.json`).
Düzeltilecek kartların görseli kanca netleşince — yoksa eski kancayı
resmeder. Dersler reçetede.

**Sete girme kuralı değişti:** sınıf ("tutan"/"kurtarılabilir") değil
**görsel** belirliyor. 32 kurtarılabilir kart incelemede "kalsın" çıktı
(key ≈ keyif, arm ≈ armut) ve görselleriyle sete girdi.

**İkinci parti (aynı gün):** kalan 66 hazır kart da üretildi (+2 yeniden:
`net` üstten kesik, `week` çok küçük), 5.100 kredi (bakiye 5.460 düştü;
360'ın kaynağı bilinmiyor). Set **266**. Görseli olmayan 34 kartın hepsi
"düzelt" ya da kalite 1 — kanca netleşince. Zayıf kalanlar: `draft`
(taslak yerine renkli ev çizdi), `valve` (boru kenardan kenara); istenirse
yenilenir (150 kredi). Magnific bakiyesi 6 Ekim sonunda 146.052.

İndirme ve inceleme ızgarası artık depoda: `tools/gorsel-indir.sh`,
`tools/gorsel-izgara.mjs`; adım adım akış `tools/gorsel-recetesi.md`'de.

**Kanca panosu** en fazla 104 kanca çiziyor; set 104'ü geçince tamamı
sığmıyor. Başlık/paylaşım metni çizilen sayıyı yazıyor (yalan yok). Çoklu
pano ileride.

**Site:** vitrin 20 kelime artık açık liste — set büyüdükçe kayıp
Google'daki adresleri kırmasın.

## 2026-10-07 — Telefon düzeltmeleri, favicon, İngilizce ana sayfa

- **Snake karşılaması yalnızca "Hemen başla"ya** (`/ingilizce/?basla=1`,
  `src/karsilama.ts`). Başka yoldan gelen başlamamış, girişsiz kullanıcı
  tanıtım sayfasına `replace` ile gidiyor; çıkış/hesap silme de `replace`.
  Geri/ileri gezintisi asla karşılama açmıyor. APK, ana ekran uygulaması
  ve geliştirmede karşılama her zaman açık (tanıtım sayfası yok). Döngü
  emniyeti: 5 sn içinde ikinci yönlendirme yapılmıyor. Ayarlar → Sıfırla
  artık kullanıcıyı uygulamada tutuyor.
- **Klavye:** `interactive-widget=resizes-content` artık global değil;
  yalnızca `Runner` (ders/egzersiz) açıkken (`src/klavye.ts`). Yazı alanlı
  pencereler (giriş, giriş yapıldı, hesap silme) telefonda üstte duruyor —
  altta olunca klavye sayfayı yukarı itiyordu.
- **"Giriş yapıldı" geri tuşunda tekrar çıkıyordu:** Google dönüşünde
  depoda zaten oturum varsa yeni giriş sayılmıyor.
- **Yükleme bildirimi kapalı** (`beforeinstallprompt` → `preventDefault`).
- **Favicon seti:** `npm run icons` → `public/favicon.ico` (16/32/48) ve
  `favicon-96x96.png`; site kökünde de `/favicon.ico`.
- **İngilizce ana sayfa** `/en/` (`site/sayfalar/anasayfa.en.html`), üst
  şeritte TR | EN seçici, ana sayfalarda `hreflang`. Kabuk metinleri
  `KABUK` sözlüğünde, küçük parçalar `EN_PARCA`da (eşleşmezse derleme
  durur). Seçici `hafizada-dil`i yazıyor — uygulama da o dilde açılıyor.
  Diğer sayfalar yalnızca Türkçe. **Ana sayfa metni değişirse iki dosya.**

## 2026-10-07 (akşam) — UX incelemesi ve geliştirme turu

Uygulama telefon boyutunda ilk açılıştan 2. güne denendi, rakipler
incelendi; plan: https://claude.ai/artifact/KLeXfAaCkf2sZRUbSbiPTR.
**Karar: ders içeriği kısaltılmıyor** (altı basamak, soru sayısı aynı);
yalnızca gereksiz dokunuş ve ekranlar azaltıldı.

Her madde **ayrı commit** — beğenilmeyen tek tek `git revert <commit>`:

| Commit | Ne |
|---|---|
| `d525928` | Tanışma kartında kelime okunuyor + dinleme düğmesi |
| `360b6ff` | Doğru cevapta 1,6 sn sonra kendiliğinden geçiş; yanlışta duruyor |
| `db9f020` | Dersteki ara ekranlar (`Gecis`) ve "BÖLÜM 1/2" etiketi kalktı; tek ilerleme çubuğu |
| `1612cdc` | Ana ekran: üyelik şeridi yok, ders kartında anlam yok, tekrarlı başlıklar düzeldi |
| `3673588` | Üyelik davetleri tek metin (`DAVET_METNI`, ders sonu + Ayarlar) |
| `64ee3cb` | Metin temizliği: "·" ve "—", uzun açıklamalar |
| `123d9a8` | Öğrenme testinde soru türleri karışık sıra (`kademeliKaristir`) |
| `dbca61b`, `e8619f1` | Ders sonu ekranı öğrenilen kelimeleri kancalarıyla gösteriyor |
| `f5eb450` | Egzersiz: "Hızlı pratik" + 3 hazır seçenek, ayrıntı "Kendin seç" altında |
| `5b1b607` | İlerleme: set çubuğu (X / 266), tek doğruluk satırı, sağlam kelimeler |
| `cffa160` | Ayarlar: sık kullanılanlar üstte, yedek/ölçüm/sürüm "Gelişmiş" altında |
| `7cf1e57` | Site: kahramanda mini ders, sarı şerit kalktı, tek slogan, "—" ayıklandı |

**Bilerek yapılmayanlar:**
- İlk derslere "en güçlü kancalar": `kart-inceleme.json`'a göre ilk 10
  kelimenin 9'u zaten kalite 3 (yalnızca `salt` 2). İçerik sırasına
  dokunulmadı.
- İlerleme'ye takvim: ısı haritası daha önce bilinçli kaldırılmıştı
  (bkz. `Progress.tsx` başı); yerine set çubuğu.
- **Web'de hatırlatma bildirimi (Web Push) — kullanıcı kararıyla YOK**
  (7 Ekim: "gerek yok"). Yapılmak istenirse gerekenler: VAPID anahtar
  çifti (gizli anahtar Supabase sırrı), `bildirim_abonelik` tablosu,
  gönderen işlev ve zamanlayıcı (pg_cron). Android uygulamasındaki
  yerel hatırlatma duruyor.

## 2026-10-07 (öğleden sonra) — Ders akışı üç küçük değişiklik

Kullanıcı istedi, onayladı:
- **Tekrar seçimi:** öğrenme testi bitince sırada tekrar varsa ders kendiliğinden
  tekrara geçmiyor; "Yeni kelimeler tamam! N kelime tekrar bekliyor" ekranı
  çıkıyor → [Tekrarı yap] / [Şimdilik bitir]. Bitir derse sayılan kelimeye
  tekrarları katmıyor; tekrarlar ana ekranda bekliyor. Olaylar:
  `tekrara_gecildi`, `tekrar_atlandi`. "Tekrar önce" derste değişiklik yok.
- **Soru türleri yine sıralı:** `123d9a8` (karışık sıra, `kademeliKaristir`)
  geri alındı.
- **Harf dizme kutuları büyük:** boyut kelime uzunluğuna göre (≤4 harf 64×72,
  5 harf 56×64, 6 harf 48×56, 7 harf 40×56); 360px telefona sığıyor.
- **Kelime üretme kuralları depoda:** `tools/kanca-kurallari.md` (CLAUDE.md'den
  bağlı) — başka makinede de aynı mantıkla üretilsin.

Yerelde geçici önizleme sayfasıyla denendi (1 kelimelik ders + 3 tekrar):
harf kutuları ve seçim ekranı doğru, "Şimdilik bitir" sayımı doğru.

## 2026-10-07 — Kanca cümlesi turu ve 100 yeni kelime

**Kural:** kanca ile anlam AYNI SAHNEDE ve birbirine bir şey YAPIYOR, mümkünse
saçma/abartılı. "gibi" benzetmesi ve "=" kalıbı yok. (Kanca yönteminin bilinen
kuralı: etkileşen, tuhaf imge akılda kalıyor.) Kullanıcının örneği:
"Pilav gibi kabarık yastık" → **"Biri yastığın üstüne pilav dökmüş."**

Durum (görselli 266 kart): **104 cümle "=" kalıbında** (89'u O/tanıdık,
10'u G, 5'i Y: "Bot = tekne", "Kap = fincan" — sahne yok), **21 cümle "gibi"
benzetmesi** (17'si G). Örnek öneriler (onaylanmadı):

| Kelime | Şu an | Öneri |
|---|---|---|
| pillow ≈ pilav | Pilav gibi kabarık yastık | Biri yastığın üstüne pilav dökmüş |
| ball ≈ bal | Bal damlası top gibi | Topa bal sürmüşler, eller yapış yapış |
| eye ≈ ay | Gözü ay gibi parlıyor | Ay gökten düşüp gözüne kaçtı |
| wing ≈ vinç | Vinç kolu kanat gibi | Vinç, kuşu kanadından kaldırıyor |
| moon ≈ mum | Ay mum gibi ışık verir | Aya kocaman bir mum dikmişler |
| pinch ≈ pençe | Pençe gibi çimdikler | Kedi pençesiyle kolumu çimdikledi |
| cup ≈ kap | Kap = fincan | Fincan kabın içine düşmüş |

**Durum (7 Ekim, Mac):** 1. adım yapıldı → `kanca-cumleleri.xlsx` (puanlar ve
öneriler `tools/kanca-cumleleri.json`, tablo `node tools/kanca-cumleleri.mjs`;
elle yazılan kararlar yeniden üretimde taşınır). İlk turda 204 öneri vardı;
kullanıcı "çok dağıttın" dedi ("Şort kısa" zaten iyi, fazladan öğe ekleme).
İkinci tur az dokunuşla yapıldı. Üçüncü turda "X bir Y" tanım cümleleri sahneye
çevrildi (kullanıcı: "Bot küçük bir tekne" zayıf → "Botla tekneye çarptık";
görsel maliyeti ölçüt değil). Görselsiz 34 kart da aynı mantıkla tabloya
eklendi (öncelik 0, en üstte; çoğuna yeni gerçek-kelime kanca). Son hal: 300 kart,
137 öneri (35 yeniden + 34 ilk kez çizilecek görsel).
Öneriler kısa: kanca + anlam + tek fiil, birbirine bir şey yapıyorlar.
Kancanın İngilizce başka kelimeye benzediği yerde dikkat: bot ayakkabı → "boot".
**1. iş BİTTİ (7 Ekim):** kullanıcı hepsini onayladı (lose: luzer → lazer,
"Kedi lazeri kaybetti"). 137 cümle + 43 kanca `kart-havuzu-300.xlsx`e işlendi,
`content/cards.json` yeniden üretildi. 69 görsel üretildi (+4 yeniden: floor,
torch kenara taştı; rinse prenses gibi; chalk gövdesiz el), 73 × 75 = 5.475
kredi. **Set 300/300.** Sahneler `tools/gorsel-sahneleri.json`'da. Yayında
(7 Ekim, iki depo push'landı).

**Yeni kelimeler (sıradaki):** 100 aday `yeni-kelimeler.xlsx` (veri
`tools/yeni-kelimeler.json`, tablo `node tools/yeni-kelimeler.mjs`; setle ve kendi
içinde çakışma denetliyor: bir kartın kancası başka kartın anlamı olamaz). 72
güçlü, 27 orta ses benzerliği. Kullanıcı hepsini onayladı (rob: "rob" yerine
"robot" → "Robot bankayı soydu"). Havuza 301-400 olarak eklendi (zorluk
çoğu Kolay; sınıf ses 3 → Tutan, 2 → Kurtarılabilir), sahneler
`tools/gorsel-sahneleri.json`'da. 100 görsel + 9 yeniden (book bükülmemiş, cow
kavun bal gibi, hat palet, tooth ×2 dişle basmıyor, tower/tie kenara taştı, doll
ürkütücü, rob "BANK" yazısı) = 109 × 75 = 8.175 kredi. **Set 400/400.**
Yayında (7 Ekim).


## Sırada

### Nerede duruyoruz (7 Ekim 2026 akşam, Mac)

**Hepsi yayında**, iki depo temiz ve push'lu. **Set 400/400** görselli kart.
266 test, tip denetimi ve derleme temiz. Magnific bakiyesi **130.152**
(bugün 73 + 109 = 182 görsel, 13.650 kredi).

Bugün yapılanlar (sırayla, commit'leriyle):
- Kanca cümlesi turu: 137 cümle + 43 kanca, 69 görsel — `b624630`
- Soru türleri yine sıralı (karışık sıra geri alındı) — `67cd1e6`
- 100 yeni kelime (301-400), 109 görsel — `aa5dc6b`
- Ders sonunda tekrar soruluyor ("Tekrarı yap" / "Şimdilik bitir") — `596c7b9`
- Harf dizme kutuları büyük — `8876e8f`
- Kanca kuralları depoda: `tools/kanca-kurallari.md` — `6d40a53`
- Kanca etiketinin üstünde "ÇAĞRIŞIM" başlığı — `07c884c`
- Soru/cevap ekranında görsel artık kırpılmıyor (16:9 + cover yerine
  %75 genişlikte 4:3; yükseklik aynı)

- Akşam son tur (kullanıcı istedi):
  - **Google ile giriş hatası düzeltildi:** tanıtım sayfasından "Giriş yap" →
    Google → `/ingilizce/?code=...` dönüşünde uygulama SDK kodu oturuma
    çevirmeden kullanıcıyı "girişsiz" sanıp karşılama kuralıyla
    (`karsilama.ts`, sabah eklenen) tanıtım sayfasına yolluyordu; giriş
    hiç tamamlanmıyordu. `uyelik.ts` `acilistaDonus` bayrağı artık
    `oturumVarGibi`ye katılıyor → SDK hazır olana kadar bekleme ekranı.
    **Canlıda bir kez dene** (gizli pencerede hafizada.com → Giriş yap →
    Google). Hâlâ siteye atarsa ikinci şüpheli: Supabase → Auth → URL
    Configuration'da `https://hafizada.com/ingilizce/` izinli dönüş
    adreslerinde yoksa Supabase Site URL'ye (kök) atar.
  - Kartta kelime + küçük hoparlör + anlam tek satırda ("friend 🔊 arkadaş"),
    tanışma ve cevap kartında (`CardFace.tsx` `KelimeSatiri`).
  - Egzersiz "Kendin seç": tam genişlik beyaz kart, belirgin ▾ ok.
  - Site: telefonda üst menüde "Hemen başla" yerine "Giriş yap" (çerçeveli);
    sarı kanca rozetinin başında "ÇAĞRIŞIM" (EN: "MEMORY HOOK") — mini ders,
    "Kanca nasıl bir şey?" kartları ve kelime sayfalarında (`site/stil.css`).

**Kayıtlı hesap (7 Ekim):** 4 (biri kullanıcının kendisi; dışarıdan 3,
hepsi Google, kayıttan sonra tekrar girmemiş). Girişsiz kullananlar sayılmıyor.

**Yeni kelime / kanca / cümle yazarken:** `tools/kanca-kurallari.md`.
Görsel: `tools/gorsel-recetesi.md` (75 kredi/görsel, kullanıcı onayıyla).

**Açık seçenekler (konuşuldu, yapılmadı):** kanca etiketi için anlamı
büyütmek, "≈" yerine "sesi:", cümlede yeşil (anlam) / sarı (kanca) renk
kodu, ilk kartta tek seferlik açıklama. Tekrar bölümünde soru sırası hâlâ
karışık (bilerek); kullanıcı istemedi.

### SIRADAKİ İŞ: Instagram

Plan aşağıda tam (`instagram/` klasörü depoda yok, gitignore). **Mac'te
çalıştırmak için:** `tools/instagram.mjs` Windows'a göre yazılmış —
`CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`
verilmeli ve Reels okunuşu PowerShell/Zira yerine macOS `say` ile
üretilecek şekilde uyarlanmalı. ffmpeg Mac'te var. Kanca cümleleri artık
güçlü (ör. "Botla tekneye çarptık", "Mopetle paspas yaptı") — Reels ve
köprü gönderileri için hazır içerik.

#### Instagram planı

**Profil** (kullanıcı kendisi değiştirecek; Instagram'a erişimimiz yok):
- Fotoğraf `brand/instagram-profil.png` (krem zeminli beyin). Yazılı
  sürümler 110 pikselde okunmuyor; `instagram-profil-lacivert.png` bozuk
  (beynin lacivert yarısı zeminde kayboluyor).
- İsim alanı: `Hafızada | İngilizce Kelime` (aramada taranıyor)
- Bağlantı: `hafizada.com` (ana sayfada mini ders var)
- Biyografi:
  ```
  İngilizce kelimeyi ezberleme, bağla 🧠
  sell ≈ sel: "Sel gelmeden evini sattı"
  Ücretsiz, 15 saniyede dene 👇
  ```
- Eski 18 gönderi kalıyor; yalnızca "Okunuşu" sütunlu 3'ü arşivlenir.

**Paylaşım mantığı — haftada 5:** 3 normal (işe yarar liste: yanlış
söylenenler, kalıplar, kısa cevaplar; beğeni/erişim), 1 köprü (liste + her
kelimenin kancası; kaydettirir), 1 kanca Reels (tek kart, 9 sn; siteye
götürür). Kullanıcı normalleri artırmak istedi. Ölçüt beğeni değil
**kaydetme ve paylaşma**. Reels müziksiz üretiliyor, müzik telefonda
Instagram'ın içinden eklenir.

**Üretici (depoda, sabit şablon):** `tools/instagram.mjs` + içerik
`tools/instagram-icerik.json`. `node tools/instagram.mjs` → çıktı
`instagram/cikti/<id>/` (01.png… 1080×1350, reels.mp4 1080×1920,
aciklama.txt). Yeni makinede gerekenler: Chrome
(`C:/Program Files/Google/Chrome/...`, değilse `CHROME=` ortam değişkeni),
ffmpeg, Windows'un İngilizce sesi (Zira; kanca Reels'i için). Çıktı
klasörü depoda yok — yeni makinede bu komutla aynısı yeniden üretilir.

**Hafta 1 (hazır, içerik dosyasında):** Pzt "Bunu yanlış söylüyorsun"
(7 hata, kaydırmalı + Reels) · Salı "Kafede 6 cümle" · Çarş "8 kısa cevap"
(+ Reels) · Perş köprü "Evdeki 5 eşya, 5 kanca" (box, bucket, pillow,
towel, curtain) · Cmt kanca Reels "sell ≈ sel".

**Açık sorular / sıradaki:**
- Normal gönderiler yalnızca yazı; kullanıcı "daha görselli tutmaz mı"
  dedi. Seçenek: listedeki kelime setteyse kart görseli; değilse kapak
  çizimi = yeni görsel üretimi (onay gerekir).
- Kanca cümleleri güçlenince (1. iş) o saçma sahneler Instagram için de
  birebir içerik ("Yastığa pilav dökülürse" Reels'i).
- Dosyaları telefona aktarmak için Google Drive klasörü önerildi, cevap yok.
- Köprü için hazır gruplar (görselli, kalite 3): Ev: box, bucket, pillow,
  towel, curtain, dust, hole, dirt · Mutfak: bowl, taste, dish, jam ·
  Vücut: eye, chin, leg, itch, sick.
- Meta Pixel yok; reklama başlanınca kurulur (çerez onay bandı + gizlilik/
  KVKK metni güncellemesi şart, gizlilik şu an "izleyici yok" diyor).

### Nerede duruyoruz (6 Ekim 2026)

**Hepsi yayında**, iki depo da temiz ve push'lu. 266 test, tip denetimi ve
derleme temiz.

| | |
|---|---|
| Kart seti | ✅ **266 / 300** görselli kart (6 Ekim'de 100 → 266) |
| Kart incelemesi | ✅ `kart-inceleme.xlsx` — 300 kartın türü, kalitesi, kategorisi, önerilen kararı |
| Site | ✅ `hafizada.com`: SSS, blog (6 yazı), 20 kelime sayfası, yasal sayfalar, iletişim formu |
| Arayüz dili | ✅ Türkçe / İngilizce |
| Üyelik | ✅ e-posta + Google, senkron, profil anında kaydediliyor |
| Search Console | ✅ doğrulandı, site haritası gönderildi |

**Sıradaki iş — kelime havuzu:**

1. **Kullanıcı `kart-inceleme.xlsx`'e bakacak:** 38 "Düzelt" kartı (sarı)
   ve yeni kanca önerileri; "SENİN KARARIN" sütunu. Onaylananlar
   `kart-havuzu-300.xlsx`'e işlenir (`node tools/import-xlsx.mjs` →
   `content/cards.json`),
   sonra o kartların görselleri üretilir → set 300.
2. **Kategoriler:** incelemede her kartın kategorisi var (18 kategori,
   `tools/kart-inceleme.mjs` → `KATEGORI`). Uygulamada nasıl kullanılacağı
   konuşulmadı (konuya göre ders? filtre? rozet?).
3. **Havuzu 300'ün üstüne çıkarmak:** iki parçalı / iki kelimelik kancalar,
   "kolay katman" (tanıdık/ödünç kelimeler ayrı bir seviye), aday üretim
   hattı (aşağıda 6).
4. **Kanca panosu 104'te kesiliyor** — set 266; çoklu pano ya da sayfalama.
5. Zayıf iki görsel: `draft`, `valve` (isteğe bağlı).
6. Sunucuda en kısa şifre 6 → 8 önerisi, **kullanıcı cevabı bekleniyor**.
7. ~15 Kasım: Search Console verisine bakıp kelime sayfası kararı.

### Nerede duruyorduk (4 Ekim 2026)

**Web yayında.** `https://hafizada.com` ve `https://hafizada.com/ingilizce/`
— HTTPS açık ve zorunlu. 257 test, tip denetimi ve derleme temiz.

| | |
|---|---|
| Tanıtım sayfası | ✅ kişi slider'ı, kanca bölümü, yöntem, senkron kartı |
| Üyelik | ✅ e-posta + şifre, doğrulama, şifre sıfırlama, bilgi adımı |
| İlerleme senkronu | ✅ çek-birleştir-yaz, açılışta ve her ders sonunda |
| Çıkışta temizlik | ✅ önce gönder, sonra sil |
| Hesap silme | ✅ edge function + yazarak onay |
| Ölçüm | ✅ `olaylar` tablosu, `pg_cron` temizliği |
| Android | ⏸ imzalı paket hazır, web'e dönünce rafa kalktı |

### Yapılacaklar

#### 1. Sızmış şifre koruması — ücretsiz planda YOK

6 Ekim'de bakıldı: Supabase'de "Prevent use of leaked passwords" yalnızca
Pro planda. Güvenlik taraması bunu uyarı olarak göstermeye devam edecek;
bilinçli kabul. Ücretsiz karşılığı: sunucudaki en kısa şifre 6, uygulama 8
istiyor — sunucuyu da 8 yapmak önerildi, kullanıcı onayı bekleniyor.

#### 2. Google ile giriş — ✅ YAPILDI (4 Ekim)

Çalışıyor ve doğrulandı: sağlayıcı `google`, e-posta onaylı, ad Google'dan
geliyor, üyelik ilk anda tamam (bilgi adımı çıkmıyor), ilerleme senkronu
dönüyor.

Kurulum kayıt olsun diye duruyor:

- **Google Cloud Console** → proje → *Google Auth Platform* → Audience:
  **External** → Branding: App name `Hafızada İngilizce` → **Clients** →
  Web application → Authorized redirect URI:
  `https://safbupshatjmfxdviwvp.supabase.co/auth/v1/callback`
  → **Audience → Publish app**
- **Supabase** → Authentication → Sign In / Providers → Google → Client ID
  + Secret → Save. Redirect URLs'te `https://hafizada.com/ingilizce/**` ve
  `http://localhost:5173/**`.
- **GitHub** → Actions secret `VITE_GOOGLE_GIRIS = 1`

> **Secret eklemek yetmiyor.** Vite yalnizca `env` bloğunda duran
> değişkeni paketliyor; `deploy.yml`'daki `env:` listesine de eklenmeli.
> Bu atlandı ve secret varken düğme görünmedi.

**Onay ekranında uygulama adı yerine `…supabase.co` yazıyor.** Branding'de
ad doğru girilmiş olsa bile böyle: Google doğrulanmamış uygulamalarda
OAuth geri dönüş adresinin alan adını gösteriyor, callback de Supabase'de.
Çözümü ya Google doğrulaması (gizlilik politikası + ana sayfa, günler) ya
da Supabase özel auth alan adı (ücretli). Şimdilik bırakıldı.

**Açık soru:** aynı e-postayla hem şifreyle hem Google'la giriş yapılırsa
tek hesap mı oluyor, iki ayrı hesap mı? Supabase e-posta eşleşmesiyle
birleştiriyor ama **test edilmedi.**

#### 3. Gerçek uçtan uca test

Test adresi bende yok, Resend'in gönderdiği postayı göremiyorum.

- Kayıt → doğrulama postası → bilgi adımı → ana ekranda gerçek ad
- Çıkış → tanıtım sayfasına döner, cihaz temizlenir → tekrar giriş →
  her şey geri gelir
- İki ayrı cihaz/tarayıcı → ilerleme ikisinde de aynı
- Hesabı sil → `SİL` yaz → hesap ve sunucudaki ilerleme gider

> **İlk denemeden önce bir kerelik:** `F12 → Application → Service
> Workers → Unregister`, sonra `Ctrl+Shift+R`. Gün boyunca üç kez
> "düzelmedi" sanmamızın sebebi buydu; sürüm geçişi düzeltmesi artık
> yayında ama bir kez elle temizlemek gerekiyor.

**Kodda bekleyenler:**

4. **Karşılama akışı üyelikten hiç bahsetmiyor.** İlk gelen kişi ürünü
   tanıyor ama hesabın ne işe yaradığını görmüyor.
5. **Android'e dönüş** — paket, imzalama ve sürüm betiği hazır; Play
   Console hesabı ve mağaza varlıkları kaldı (bkz. `YAYIN.md`).
6. **Kanca aday üretim hattı** — havuzu ~600'e çıkaran tek kaldıraç.
   CMU fonetik sözlüğü + Türkçe kelime listesi + fonem mesafesi → sıralı
   aday listesi. "Haa testi" insanda kalır; moat orası.
7. ~~Kalan 200 kartın görseli.~~ 6 Ekim: 266'sı tamam, kalan 34 kanca kararına bağlı.
8. **Drive'a yedek — ikinci aşama.** Aşama 1 (paylaş menüsü) yapıldı.
   Senkron geldiği için aciliyeti düştü; yedek yine de duruyor ve
   öneriliyor (senkron hesaba bağlı, yedek değil).

**Karar bekleyen:** depo herkese açık. Sır sızmıyor (kontrol edildi) ama
`NOTLAR.md` görsel üretim reçetesini ve gelir modelini taşıyor. Pages
ücretsiz planda yalnızca açık depoda çalışıyor, yani kapatmanın bedeli var.

**Açık öneriler (karar verilmedi):** kullanım istatistikleri anahtarını
Ayarlar'ın altına taşımak, istenmese de arada bildirim göndermek, tek kart
paylaşımı (`renderCardPost`) — Instagram içeriği için.

### Başka bilgisayarda devam etmek

İki depo var, ikisi de **aynı klasörde yan yana** olmalı:

```
git clone https://github.com/hasanozdemiryz-blip/ingilizce
git clone https://github.com/hasanozdemiryz-blip/hasanozdemiryz-blip.github.io
cd ingilizce && npm install && npm run dev
```

| | |
|---|---|
| `ingilizce` | Uygulama (`hafizada.com/ingilizce/`). `main`'e push = otomatik yayın |
| `hasanozdemiryz-blip.github.io` | Site (`hafizada.com`). **Elle düzenlenmez**: `npm run site -- ../hasanozdemiryz-blip.github.io` ile üretilir, sonra orada commit + push |

**Depoda olmayanlar (yeni makinede elle):**
- `.env.local` — `.env.example`'a bak. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  (Supabase → Settings → API), `VITE_GOOGLE_GIRIS=1`. Yoksa uygulama
  üyeliksiz çalışır, bir şey bozulmaz.
- Supabase CLI girişi gerekirse gerçek bir Terminal'de `npx supabase login`
  (TTY'siz ortamda tarayıcı akışı çalışmıyor). 5 Ekim kurulumu panelden yapıldı.

**Dış hizmetler (durum 5 Ekim):**
- Supabase: `ilerleme`, `olaylar`, `iletisim` tabloları; `hesap-sil` ve
  `iletisim` işlevleri (ikisinde de Verify JWT kapalı).
- İletişim mesajları e-postayla gelmiyor (kullanıcı kararı) → Supabase →
  Table Editor → `iletisim`.
- Google Search Console: alan adı mülkü doğrulandı (Cloudflare TXT kaydı
  silinmemeli), `https://hafizada.com/sitemap.xml` gönderildi.
- ~15 Kasım: Search Console verisine bakıp kelime sayfalarını (şu an en sık
  20) genişletme kararı.

**Kart görseli üretmek (yeni makinede):** Claude'da Magnific bağlayıcısı
açık olmalı (claude.ai hesabına bağlı, makineye değil). Reçete, seed, stil
referansı ve adım adım akış `tools/gorsel-recetesi.md`'de; sahneler
`tools/gorsel-sahneleri.json`'da. `gorseller/` klasörü depoda yok — yeni
makinede boş başlar, yalnızca yeni kartlar için gerekir. Mevcut 266 görsel
depoda (`src/assets/cards/*.webp`).

**Kart incelemesi:** kaynak `tools/kart-inceleme.json` (kart → `tür|kalite|kategori|karar|not`);
`node tools/kart-inceleme.mjs` hem `kart-inceleme.xlsx`'i hem
`tools/gorsel-sirasi.json`'u yeniden üretir. Excel'e elle yazılan "SENİN
KARARIN" sütunu bu komutla **silinir** — önce kararları işle.

**Claude'a ilk mesaj önerisi:** "NOTLAR.md'nin Sırada bölümündeki SIRADAKİ İŞ kısmını ve
tools/gorsel-recetesi.md'yi oku, kaldığımız yerden devam edelim."

Yayın adımlarının tamamı `YAYIN.md`'de.
