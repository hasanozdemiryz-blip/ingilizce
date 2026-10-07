# Kart görseli üretim reçetesi

Tutarlılığın tek kaynağı bu dosya. Üç kaldıraç birden gerekir; biri değişince
çizgi kalınlığı ve palet kayar:

| | |
|---|---|
| Model | `imagen-nano-banana-2` (Google Nano Banana Pro) |
| Seed | `20260918` — **değiştirme** |
| Oran | `4:3` (1024×768) |
| Sahneler | `tools/gorsel-sahneleri.json` — kart → [sahne, zemin tonu] (6 Ekim: 166 kart) |
| Stil referansı | ilk `snake` kartı, creation `VXEgEPIMMU` |
| Maliyet | 75 kredi/görsel |

> Bu reçete bir süre yalnızca sohbet geçmişinde vardı; ikinci parti üretilirken
> Magnific'teki eski creation'ların prompt'undan geri çıkarıldı. Bir daha
> kaybolmasın diye burada.

## İskelet

Her kart yalnızca **ilk satırı** ve **arka plan tonunu** değiştirir. Gerisi
kelimesi kelimesine aynı kalır.

```
<SAHNE — tek cümle; insan varsa yüzünü ve "full body including both feet
with empty space below them" yaz>

Copy only the drawing style of the reference image (line weight, flat colours), NOT its subject.

COMPOSITION: the subject occupies about 65% of the frame height, fully visible, with a WIDE even margin of empty background on all four sides — nothing touches or comes near the frame edge. Seen straight on, flat, not in perspective. Centred.

NO white outline around the subject. NO sticker border, NO die-cut edge, NO cut-out effect. The artwork sits directly on the flat background.

ABSOLUTELY FLAT colour fills. NO gloss, NO shine, NO metallic sheen, NO specular highlights, NO reflections, NO gradients, NO soft shading, NO texture, NO drop shadow, NO ground shadow, NO shadow under feet or objects, NO ambient occlusion, NO 3D depth. Each object is a base colour plus at most one slightly lighter flat tone.

Every shape outlined with a confident medium-thick, evenly rounded stroke in a darker tone of its own fill colour, the same weight as the reference.

BACKGROUND: one single very pale washed-out <TON> tint, extremely light, close to white. Completely empty — no scene, no props, no horizon, no pattern.

Inanimate objects have NO faces, NO eyes, NO mouths, NO limbs.

No text, no letters, no numbers, no logos anywhere in the image.
```

Tonlar: `cream`, `mint`, `green`, `sky-blue`, `lavender`, `pink`, `peach`,
`yellow`. İnsan sahnesinde "Inanimate objects…" satırı çıkarılır (yüzü de
siliyor). Etiketli nesnede (kitap, torba, takvim) sona `The … is blank.`
eklenir; sayı çıkabilecekse `no digits` da.

> 6 Ekim öncesi iskelette özne %75'ti ve "Copy the reference image's drawing
> style exactly" yazıyordu. İlki ayakları kesti, ikincisi nesne sahnelerinde
> referanstaki yılanı kopyaladı. Eski 100 kart o iskeletle; fark gözle
> görülmüyor.

### Duruma göre eklenen bloklar

- **İnsan varsa** — tam gövde iste ve **kıyafeti yaz**. Yazmayınca çıplak gövde
  çiziyor; gövdesiz uzuv (yalnız ayak, yalnız el) kesik uzuv gibi çıkıyor.
- **Metin gerekiyorsa** — son satır: `The only text in the image is the word
  "DUR" written clearly in white on the red sign. No other text...`
  Türkçe metin sorun değil, `İ` dahil ilk denemede doğru çıkıyor.
- **Duvara/yüzeye monte bir şey varsa** — `flat against the wall — no bracket,
  no post, no pole, no metal mounting hardware, no shadow, no 3D depth`.

## Üretimde öğrenilenler

| Ders | Neden |
|---|---|
| "Özne çerçeveyi doldursun" deme | Model bunu "taşır" diye anlıyor; 5 görselin 4'ü alt kenardan kesildi |
| İnsanı tam gövde + kıyafetli iste | Gövdesiz uzuv rahatsız edici, kıyafetsiz istek çıplak gövde getiriyor |
| Kalabalığı tek tek yasakla | `deep`'e denizaltı, batık gemi, hazine sandığı koydu |
| Ölçek farkını nesneyle kur | `large`'da insan + dev gömlek iki denemede de aynı boyda çıktı |
| Spor/nesne adını tarif et | "football" → Amerikan futbolu topu; "round soccer ball with black pentagon patches" → doğru |
| Gölgeyi ayrıca yasakla | "NO drop shadow" yetmiyor, "NO ground shadow, NO ambient occlusion" da gerekiyor |
| "%75 yükseklik" yetmiyor | Merdiven kenarlara dayandı; "WIDE empty margin on all four sides, nothing comes near the edge" ayrıca yazılınca düzeldi |
| Bant zeminini görselden al | Kırpmak özneyi kesiyordu; görselin köşe pikselinden ton alınıp bant zemini yapılınca `contain` ile hiçbir şey kesilmiyor (bkz. `tools/site.mjs` `zeminTonu`) |
| İnsan sahnelerinde arka planı tek tek yasakla | "otobüste" deyince otobüs içi, pencere, diğer yolcular geliyor; "no other passengers, no windows, no bus interior" gerekti |
| Koyu sahne isteme | "karanlıkta yanan mum" arka plan kuralını bozuyor; sahneyi aydınlık kur |
| Özne %65, insan "ayaklar dahil, altında boşluk" | 6 Ekim partisi: %75'te ayak alttan kesiliyordu (dirt); %65 + bu cümleyle 99/100 temiz |
| "NO shadow under feet or objects" ayrıca yaz | "NO ground shadow" varken bile ayak altına hafif gölge koyuyordu |
| Nesne sahnelerinde "only the drawing style, NOT its subject" | `plain` (plan çizimi) istenince model referans snake'i aynen kopyaladı |
| İnsana yüzü açıkça iste | "Inanimate objects have NO faces" kuralı smokinli adamın yüzünü de sildi |
| "rapper" isteği reddedildi | "hip-hop singer" ile geçti; reddedilen istek kredi düşmüyor |
| Zemin/ışık huzmesi isteme, ya da boyunu sınırla | 7 Ekim: `floor`'da tahta zemin, `torch`'ta el feneri huzmesi kenara taştı; "small patch … does NOT reach the edges" ile düzeldi |
| Prens/kral → "short hair, beard, clearly a man" | `rinse`'te uzun saçlı prens prenses gibi okundu |
| Nesneyi "kendi kendine" hareket ettir | `chalk`'ta "swirled" deyince kenardan gövdesiz el girdi; "by itself, no hands" ile düzeldi |
| Eylemi vücut bölümüne zorla | `tooth`'ta "dişiyle tuşa bas" iki kez elle yazdı; "hands tied behind his back" ile düzeldi. `book`'ta "bending" tutmaya döndü; "visibly bent into a deep U shape" gerekti |
| Bina/tabela isteme ya da "NO sign" yaz | `rob`'da banka binasına "BANK" yazdı |
| Meyveyi tanımla | `cow`'da "yellow melon" bal peteğine benzedi; "striped rind, orange flesh, seeds" ile düzeldi |
| Ağaç/direk kısa olsun | `tie`'da ağaç üst kenara dayandı; "small sapling, fully visible" ile düzeldi |

## Boru hattı

```
üret → gorseller/<kart-id>.png → npm run import:images
     → src/assets/cards/<kart-id>.webp (800×600, q82, ~14 KB)
```

`content.ts` klasörü `import.meta.glob` ile tarar; `cards.json`'a dokunmak
gerekmez, dosyayı koyman yeter. Kart kendiliğinden sete girer.

> exFAT tuzağı: `gorseller/` içine kopyalarken macOS `._*` gölgeleri bırakıyor,
> importer bunları "tanınmayan kart id'si" diye uyarıyor.
> `find . -name '._*' -delete`

## İş akışı (bir parti)

Üretim Claude'un Magnific bağlantısıyla yapılıyor (claude.ai → Ayarlar →
Bağlayıcılar → Magnific). Her parti **kullanıcı onayıyla**, adet ve kredi
söylenerek.

1. `node tools/kart-inceleme.mjs` → `tools/gorsel-sirasi.json`: görseli
   olmayan, düzeltme gerektirmeyen, kalite ≥2 kartlar.
2. Her kart için sahne + ton `tools/gorsel-sahneleri.json`'a yazılır.
3. `images_generate` (model, seed, referans yukarıda) — 10-12'lik partiler,
   ardından `creations_wait` (8'erli).
4. `sh tools/gorsel-indir.sh kart URL …` → `gorseller/<kart>.png`
   (klasör depoda değil).
5. `node tools/gorsel-izgara.mjs izgara.jpg kart …` → tek bakışta kontrol;
   kusurlu olanlar seed `20260919` ve düzeltilmiş sahneyle yeniden.
6. `npm run import:images` → `src/assets/cards/<kart>.webp` (800×600).
   Görseli olan kart **kendiliğinden sete girer**.
7. `npm test && npm run build`, sonra site: `npm run site -- ../hasanozdemiryz-blip.github.io`
   (sayfadaki kelime sayısı değişir), iki depoda commit + push.

**Depodaki tek kaynak webp'ler.** Ham PNG'ler yalnızca bu makinede
(`gorseller/`) ve Magnific'te (Personal proje) duruyor. Yeni makinede
yeniden üretmek gerekmez; yalnızca yeni kartlar için `gorseller/` boş
başlar.
