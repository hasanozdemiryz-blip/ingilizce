// LGS ve Cocuk sekmelerinin sayfalari (bkz. NOTLAR, 18 Ekim yol haritasi, Faz 1).
// tools/site.mjs cagiriyor; ortak yardimcilar `c` (baglam) nesnesiyle geliyor.
import { UNITELER, lgsKelimeleri, cikmis, mufredat } from './site-veri.mjs';

/**
 * LGS 2027 tarihi RESMI DEGIL: MEB kilavuzu yayimlanana kadar onceki yillarin
 * takvimine gore tahmin (Haziranin ikinci cumartesisi). Kilavuz gelince guncelle.
 */
export const LGS_TARIH = '2027-06-12';
const LGS_TARIH_YAZI = '12 Haziran 2027 (tahmini; MEB kılavuzu açıklanınca güncellenecek)';

/** Uygulamada LGS yolu henuz yok (Faz 3). Acilinca true: "yakinda" notlari kalkar. */
const LGS_UYGULAMADA = false;
const COCUK_UYGULAMADA = false;

/** Ana sayfadaki dalga gecisleri (anasayfa.html ile ayni). */
const DALGA_UST = '<svg class="ayirac" viewBox="0 0 1440 44" preserveAspectRatio="none" aria-hidden="true"><path d="M0 26 C 180 6, 320 40, 520 24 C 720 8, 900 38, 1100 22 C 1250 10, 1360 30, 1440 18 L1440 44 L0 44 Z" fill="#16233a"/></svg>';
const DALGA_ALT = '<svg class="ayirac" viewBox="0 0 1440 44" preserveAspectRatio="none" aria-hidden="true"><path d="M0 18 C 160 34, 340 6, 540 20 C 740 34, 920 8, 1120 22 C 1270 32, 1370 14, 1440 24 L1440 0 L0 0 Z" fill="#16233a"/></svg>';
const DALGA_SARI = '<svg class="ayirac" viewBox="0 0 1440 44" preserveAspectRatio="none" aria-hidden="true"><path d="M0 24 C 200 8, 380 36, 580 20 C 780 6, 960 34, 1160 20 C 1300 10, 1380 28, 1440 20 L1440 44 L0 44 Z" fill="#ffd23f"/></svg>';

const TUR_ADI = { K: 'Hafıza teknikli', V: 'Hafıza teknikli', T: 'Tanıdık', I: 'Kalıp', R: 'Görsel çağrışım' };
const TUR_SINIF = { K: 'hafiza', V: 'hafiza', T: 'tanidik', I: 'kalip', R: 'gorsel' };

/**
 * Yazilis cagrisiminda Ingilizce kelimenin icindeki Turkce parca alti cizili:
 * **deli**cious. Kanca Turkce harfle yazildigi icin (fuze, kredi) kelimede
 * aynen gecmeyebilir; o zaman gorunen parca burada.
 */
const YAZILIS_PARCA = { refuse: 'fuse', incredible: 'credi' };
function yazilisVurgu(k, esc) {
  if (k.yol !== 'yazılış' && k.yol !== 'ses+yazılış') return esc(k.en);
  const parca = YAZILIS_PARCA[k.en] || k.kanca;
  const i = k.en.toLowerCase().indexOf(parca.toLowerCase());
  if (i < 0) return esc(k.en);
  return `${esc(k.en.slice(0, i))}<u>${esc(k.en.slice(i, i + parca.length))}</u>${esc(k.en.slice(i + parca.length))}`;
}

/** Ayni sirayi her derlemede uretsin (rastgele ama sabit). */
function karistir(dizi, tohum) {
  const a = [...dizi];
  let s = tohum;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const soruAnlam = (c, k, havuz, tohum) => ({
  soru: `<b>${c.esc(k.en)}</b> ne demek?`,
  secenekler: [k.tr, ...karistir(havuz.filter((x) => x.tr !== k.tr).map((x) => x.tr), tohum).slice(0, 3)],
  dogru: k.tr,
});

export function lgsSayfalari(c) {
  const kelimeler = lgsKelimeleri();
  const cikan = cikmis();
  const kart = (en) => c.kartlar.get(en);
  const toplam = kelimeler.length;
  const sayac = (u) => kelimeler.filter((k) => k.unite === u).length;
  const cikanSayisi = (u) => kelimeler.filter((k) => k.unite === u && cikan.has(k.en)).length;

  const yakinda = LGS_UYGULAMADA
    ? ''
    : `<p class="yakinda"><b>Yakında uygulamada:</b> LGS ünite yolu, kalıplar, sesli diyaloglar ve ünite testleri ekleniyor. Bu arada ünite listelerini ve mini testleri buradan çalışabilir, uygulamada genel kelimelerle başlayabilirsin.</p>`;

  /** Hafiza teknikli kart: onayli ya da onerili cagrisim + mevcut kart gorseli. */
  const hafizaKart = (k) => {
    const v = kart(k.en);
    if (v) {
      return `<a class="hk" href="/kelime/${v.id}/">
        <img src="${v.sayfaResmi}" alt="${c.esc(v.sentence)}" width="400" height="300" loading="lazy">
        <span class="hk-alt"><span class="en">${c.esc(k.en)}</span> <span class="tr">${c.esc(v.tr)}</span>
        <span class="kanca-rozet">${c.esc(v.en)} ≈ ${c.esc(v.hook)}</span>
        <span class="cumle">“${c.esc(v.sentence)}”</span>
        ${v.tr !== k.tr ? `<span class="baska-anlam">Bu ünitede: <b>${c.esc(k.tr)}</b></span>` : ''}</span></a>`;
    }
    const vurgu = yazilisVurgu(k, c.esc);
    return `<div class="hk hk-yazi">
        <span class="hk-alt"><span class="en">${vurgu}</span> <span class="tr">${c.esc(k.tr)}</span>
        <span class="kanca-rozet">${c.esc(k.en)} ≈ ${c.esc(k.kanca)}</span>
        <span class="yol-rozet">${k.yol === 'yazılış' ? 'yazılıştan' : k.yol === 'ses+yazılış' ? 'ses + yazılış' : 'sesten'}</span>
        ${k.cumle ? `<span class="cumle">“${c.esc(k.cumle)}”</span>` : ''}</span></div>`;
  };

  const uniteSayfalari = UNITELER.map((u, i) => {
    const liste = kelimeler.filter((k) => k.unite === u.no);
    // Gorselli (mevcut kart) once; gorseli hazirlanan cagrisimlar sonra.
    const hafiza = [...liste.filter((k) => k.tur === 'V' && kart(k.en)), ...liste.filter((k) => k.tur === 'K' && !kart(k.en))];
    const soruHavuzu = liste.filter((k) => k.tur !== 'I');
    const sorular = karistir(soruHavuzu, u.no * 7).slice(0, 10).map((k, j) => soruAnlam(c, k, soruHavuzu, u.no * 31 + j));
    const onceki = UNITELER[i - 1];
    const sonraki = UNITELER[i + 1];
    const baslik = `8. Sınıf İngilizce ${u.no}. Ünite Kelimeleri: ${u.ad}`;
    const tablo = liste
      .slice()
      .sort((a, b) => a.en.localeCompare(b.en, 'en'))
      .map((k) => {
        const v = kart(k.en);
        const ck = cikan.get(k.en);
        return `<tr><td class="en">${v ? `<a href="/kelime/${v.id}/">${c.esc(k.en)}</a>` : c.esc(k.en)}</td><td>${c.esc(k.tr)}</td><td><span class="tur-rozet ${TUR_SINIF[k.tur]}">${TUR_ADI[k.tur]}</span></td><td class="cikti">${ck ? `<span title="${ck.yillar.join(', ')}">${ck.sinav} sınavda</span>` : ''}</td></tr>`;
      })
      .join('\n');
    return {
      yol: u.yol,
      bolum: 'lgs',
      baslik: `${baslik} — Türkçe Anlamları ve Hafıza Teknikleri | Hafızada`,
      aciklama: `8. sınıf İngilizce ${u.no}. ünite (${u.ad}) kelimeleri: ${liste.length} kelime ve kalıp, Türkçe anlamları, hafıza teknikleri, LGS'de çıkanlar ve 10 soruluk mini test. Yazdırılabilir.`,
      ogTur: 'article',
      icerik:
        c.altBaslik(baslik, `${liste.length} kelime ve kalıp, Türkçe anlamları ve hafıza teknikleriyle. LGS'de çıkanlar işaretli.`, [
          ['LGS', '/lgs/'],
          [`${u.no}. Ünite`, u.yol],
        ]) +
        `<div class="kap lgs-unite">
  ${yakinda}
  ${hafiza.length ? `<section><h2>Hafıza teknikli kelimeler</h2>
  <p class="ust-not">Kelimenin sesi ya da yazılışı Türkçe bir kelimeyi çağrıştırıyor. Çağrışımı ve sahneyi hatırla, anlam da gelsin.</p>
  <div class="hk-izgara">${hafiza.map(hafizaKart).join('\n')}</div></section>` : ''}
  <section><div class="baslik-satir"><h2>Ünitenin bütün kelimeleri</h2><button class="btn btn-beyaz yazdir" type="button" onclick="window.print()">Yazdır / PDF</button></div>
  <div class="tablo-kap"><table class="kelime-tablo">
    <thead><tr><th>İngilizce</th><th>Türkçe</th><th>Tür</th><th>LGS'de</th></tr></thead>
    <tbody>
${tablo}
    </tbody>
  </table></div>
  <p class="kucuk">"LGS'de": 2018–2025 arasındaki 8 LGS'nin İngilizce sorularında geçtiği sınav sayısı (<a href="/lgs/en-cok-cikan-kelimeler/">nasıl sayıldı?</a>).</p></section>
  <section class="test-bolum"><h2>Mini test: ${u.ad}</h2>
  <div class="mini-test" data-test="${c.esc(JSON.stringify(sorular))}"><p>Mini test için JavaScript gerekiyor.</p></div></section>
  <nav class="unite-gecis" aria-label="Üniteler">
    ${onceki ? `<a href="${onceki.yol}">← ${onceki.no}. Ünite: ${onceki.ad}</a>` : '<span></span>'}
    <a href="/lgs/#uniteler">Bütün üniteler</a>
    ${sonraki ? `<a href="${sonraki.yol}">${sonraki.no}. Ünite: ${sonraki.ad} →</a>` : '<span></span>'}
  </nav>
  <div class="cagri"><p>Kelimeleri hafıza teknikleri ve aralıklı tekrarla kalıcı öğren. Ücretsiz.</p><a class="btn btn-lacivert" href="${c.baslaYol('lgs')}" data-basla>Hemen başla</a></div>
</div>`,
      script: c.TEST_JS,
      ld: c.jsonld(c.kirinti([['Ana sayfa', '/'], ['LGS', '/lgs/'], [`${u.no}. Ünite`, u.yol]]), {
        '@context': 'https://schema.org',
        '@type': 'DefinedTermSet',
        name: baslik,
        url: `${c.ALAN}${u.yol}`,
        inLanguage: 'en',
        hasDefinedTerm: liste.slice(0, 80).map((k) => ({ '@type': 'DefinedTerm', name: k.en, description: k.tr })),
      }),
    };
  });

  // --- En cok cikan kelimeler ---
  const cikanlar = kelimeler
    .filter((k) => cikan.has(k.en))
    .map((k) => ({ ...k, ...cikan.get(k.en) }))
    .sort((a, b) => b.sinav - a.sinav || b.toplam - a.toplam || a.en.localeCompare(b.en));
  const cikanSayfa = {
    yol: '/lgs/en-cok-cikan-kelimeler/',
    bolum: 'lgs',
    baslik: "LGS İngilizce'de En Çok Çıkan Kelimeler (2018–2025) | Hafızada",
    aciklama: `2018–2025 arasındaki 8 LGS'nin İngilizce sorularında 8. sınıf kelimelerinden ${cikanlar.length} tanesi geçti. Hangi kelime kaç sınavda çıktı, hangi ünitede?`,
    ogTur: 'article',
    icerik:
      c.altBaslik("LGS'de en çok çıkan kelimeler", `2018–2025 arasındaki 8 LGS'nin İngilizce sorularında 8. sınıf ünite kelimelerinden ${cikanlar.length} tanesi geçti.`, [
        ['LGS', '/lgs/'],
        ['En çok çıkanlar', '/lgs/en-cok-cikan-kelimeler/'],
      ]) +
      `<div class="kap lgs-unite">
  <div class="metin-kisa">
    <p>MEB'in yayımladığı 2018–2025 LGS kitapçıklarının İngilizce bölümünü taradık ve 8. sınıf ders kitaplarındaki ${toplam} ünite kelimesinin her birinin kaç sınavda geçtiğini saydık. Kelimenin çekimli halleri de sayıldı (<i>invite, invited, inviting</i>). Liste bir tahmin değil; geçmişte ne çıktığını gösteriyor. Sınavda ünitelerin hepsinden kelime gelebilir.</p>
  </div>
  <div class="baslik-satir"><h2>${cikanlar.length} kelime</h2><button class="btn btn-beyaz yazdir" type="button" onclick="window.print()">Yazdır / PDF</button></div>
  <div class="tablo-kap"><table class="kelime-tablo">
    <thead><tr><th>İngilizce</th><th>Türkçe</th><th>Kaç sınavda</th><th>Yıllar</th><th>Ünite</th></tr></thead>
    <tbody>
${cikanlar
  .map((k) => {
    const v = kart(k.en);
    const u = UNITELER[k.unite - 1];
    return `<tr><td class="en">${v ? `<a href="/kelime/${v.id}/">${c.esc(k.en)}</a>` : c.esc(k.en)}</td><td>${c.esc(k.tr)}</td><td><b>${k.sinav}</b> / 8</td><td class="kucuk">${k.yillar.join(', ')}</td><td><a href="${u.yol}">${u.no}. ${u.ad}</a></td></tr>`;
  })
  .join('\n')}
    </tbody>
  </table></div>
  ${yakinda}
</div>`,
    script: '',
    ld: c.jsonld(c.kirinti([['Ana sayfa', '/'], ['LGS', '/lgs/'], ['En çok çıkanlar', '/lgs/en-cok-cikan-kelimeler/']])),
  };

  // --- LGS ana sayfasi ---
  const ornekler = kelimeler.filter((k) => k.tur === 'K' && /ONAYLI/.test(k.not)).slice(0, 6);
  const SSS_LGS = [
    ['LGS İngilizce için kaç kelime öğrenmem gerekiyor?', `8. sınıf ders kitaplarının sözlüklerinde 10 ünitede toplam ${toplam} kelime ve kalıp var. Ünite başına ortalama ${Math.round(toplam / 10)}. Hepsini ünite ünite burada bulabilirsin.`],
    ['Hangi yılın müfredatı?', '2027 LGS 8. sınıfın bugünkü programıyla yapılacak: 10 ünite (Friendship\'ten Natural Forces\'a). 2028\'de yeni Maarif programı başlıyor; kelimelerin çoğu aynı, gruplama değişiyor. Biz ikisini de takip ediyoruz.'],
    ['Hafıza tekniği ne demek?', 'Kelimenin sesi ya da yazılışı Türkçe bir kelimeyi çağrıştırıyor: succeed ≈ saksı, delicious içinde "deli". Çağrışımı anlamla aynı sahneye koyuyoruz ("Deli aşçının yemeği lezzetli çıktı"). Sahne aklına gelince anlam da geliyor.'],
    ['Ücretli mi?', 'Hayır, şu an her şey ücretsiz ve reklamsız.'],
    ['Sınav tarihi ne zaman?', `Resmi tarih henüz açıklanmadı. Önceki yıllara göre tahmin: ${LGS_TARIH_YAZI}.`],
  ];
  const hub = {
    yol: '/lgs/',
    bolum: 'lgs',
    baslik: 'LGS İngilizce Kelimeleri — Ünite Ünite, Hafıza Teknikleriyle | Hafızada',
    aciklama: `8. sınıf İngilizce ${toplam} kelime ve kalıp, 10 ünite: Türkçe anlamları, hafıza teknikleri, LGS'de en çok çıkanlar ve mini testler. Ücretsiz.`,
    ogTur: 'website',
    icerik: `<section class="bolum-kahraman">
  <div class="kap">
    <div>
      <span class="ust-etiket">LGS 2027 · 8. sınıf İngilizce</span>
      <h1>LGS kelimeleri<br><span class="vurgu-kalem">ezberlenmez, bağlanır.</span></h1>
      <p class="giris">10 ünitenin ${toplam} kelimesi ve kalıbı, Türkçe anlamları ve görselleştirilmiş hafıza teknikleriyle. <b>succeed</b> ≈ <b>saksı</b>, <b><u>deli</u>cious</b> ≈ <b>deli</b>.</p>
      <div class="dugmeler">
        <a class="btn btn-sari btn-buyuk" href="#uniteler">Ünitelere bak</a>
        <a class="btn btn-beyaz btn-buyuk" href="/lgs/en-cok-cikan-kelimeler/">En çok çıkanlar</a>
      </div>
    </div>
    <div class="sayac-kutu" data-lgs="${LGS_TARIH}" data-kelime="${toplam}">
      <p class="sayac-ust">LGS'ye kalan</p>
      <p class="sayac-gun"><b data-gun>—</b> gün</p>
      <p class="sayac-not">${LGS_TARIH_YAZI}</p>
      <div class="hesap">
        <p>Bütün kelimeleri bitirmek için günde</p>
        <p class="hesap-sonuc"><b data-gunluk>—</b> kelime</p>
        <p class="sayac-not">Aralıklı tekrar dahil, günde 10–15 dakika.</p>
      </div>
    </div>
  </div>
</section>
<section class="uniteler" id="uniteler">
  <div class="kap">
    <h2>10 ünite</h2>
    <p class="ust">Okulda hangi ünitedeysen oradan başla. Sıra yok, kilit yok.</p>
    <div class="unite-izgara">
${UNITELER.map((u) => `      <a class="unite-kart" href="${u.yol}"><span class="no">${u.no}. Ünite</span><span class="ad">${u.ad}</span><span class="sayi">${sayac(u.no)} kelime · ${cikanSayisi(u.no) ? `${cikanSayisi(u.no)} tanesi LGS'de çıktı` : "2018–2025'te çıkmadı"}</span></a>`).join('\n')}
    </div>
    ${yakinda}
  </div>
</section>
${DALGA_UST}
<section class="koyu" id="yontem">
  <div class="kap">
    <h2>Nasıl çalışıyor?</h2>
    <p class="ust">Görselleştirilmiş hafıza tekniği: kelimeyi zaten bildiğin bir Türkçe kelimeye bağlıyorsun.</p>
    <div class="adimlar">
      <div class="adim"><span class="no">Sesten</span><h3>succeed ≈ saksı</h3><p>Kulağa saksı gibi geliyor. “Saksıdaki çiçeği büyütmeyi başardı.” Başarmak aklına saksıyla geliyor.</p></div>
      <div class="adim"><span class="no">Yazılıştan</span><h3><u>deli</u>cious ≈ deli</h3><p>Kelimenin içinde “deli” yazıyor. “Deli aşçının yemeği lezzetli çıktı.” Bu teknik bize özgü.</p></div>
      <div class="adim"><span class="no">Tekrar</span><h3>Tam unutacakken</h3><p>Uygulama her kelimeyi unutmana yakın tekrar soruyor. Sınava kadar ünite ünite kalıcı.</p></div>
    </div>
  </div>
</section>
${DALGA_ALT}
<section class="kancalar">
  <div class="kap">
    <h2>Birkaç örnek</h2>
    <p class="ust">LGS kelimelerinden, çağrışımı ve sahnesiyle.</p>
    <div class="hk-izgara">${ornekler.map(hafizaKart).join('\n')}</div>
  </div>
</section>
<section class="veli" id="veli">
  <div class="kap veli-kap">
    <div><h2>Veliler için</h2>
    <p>Çocuğunuz günde 10–15 dakikayla 8. sınıfın bütün İngilizce kelimelerini sınava kadar bitirebilir. Reklam yok, ücret yok, içerik çocuğa uygun: şiddet, korku ya da uygunsuz hiçbir sahne kullanmıyoruz.</p>
    <p>Kelime listeleri MEB'in 8. sınıf ders kitaplarından; "LGS'de çıktı" bilgisi 2018–2025 sınav kitapçıklarından.</p></div>
  </div>
</section>
${c.sssHtml(SSS_LGS)}
${DALGA_SARI}
<section class="kapanis">
  <div class="kap kutu">
    <h2>Bugün ilk üniteyle başla.</h2>
    <p>Ünite listelerine bak, mini testi çöz, uygulamada çalış.</p>
    <a class="btn btn-lacivert btn-buyuk" href="${c.baslaYol('lgs')}" data-basla>Hemen başla</a>
  </div>
</section>`,
    script: `<script>
(function () {
  var k = document.querySelector('[data-lgs]');
  if (!k) return;
  var gun = Math.ceil((new Date(k.getAttribute('data-lgs') + 'T09:30:00+03:00') - new Date()) / 864e5);
  if (gun < 0) return;
  k.querySelector('[data-gun]').textContent = gun;
  k.querySelector('[data-gunluk]').textContent = Math.max(1, Math.ceil(Number(k.getAttribute('data-kelime')) / Math.max(1, gun - 14)));
})();
</script>`,
    ld: c.jsonld(c.kirinti([['Ana sayfa', '/'], ['LGS', '/lgs/']]), {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: SSS_LGS.map(([s, cv]) => ({ '@type': 'Question', name: s, acceptedAnswer: { '@type': 'Answer', text: cv } })),
    }),
  };

  return [hub, ...uniteSayfalari, cikanSayfa];
}

/** Cocuk sekmesi: veliye konusan tek sayfa. Icerik Faz 5'te dolacak. */
export function cocukSayfalari(c) {
  const liste = mufredat();
  const sinif = (g) => liste.filter((x) => x.siniflar[0] === g);
  const ornekKartlar = liste
    .filter((x) => x.kids && x.kartta && c.kartlar.get(x.en))
    .map((x) => c.kartlar.get(x.en))
    .filter((k) => !['gun', 'rob', 'ghost', 'pray', 'night', 'slap', 'deaf', 'beg'].includes(k.id))
    .slice(0, 6);
  const TEMALAR = {
    2: ['Okul hayatı', 'Sınıf', 'Kişisel hayat', 'Aile', 'Ev ve mahalle', 'Şehir ve dünya'],
    3: ['Okul hayatı', 'Sınıf', 'Kişisel hayat', 'Aile', 'Ev ve mahalle', 'Şehir ve dünya'],
    4: ['Sınıf kuralları', 'Milliyetler', 'Serbest zaman', 'Günlük rutin', 'Meslekler', 'Kıyafetler', 'Yiyecekler'],
    5: ['Okul', 'Sınıf', 'Kişisel hayat', 'Aile', 'Mahalle ve şehir', 'Doğa', 'Dünya', 'Evren ve gelecek'],
    6: ['Okul', 'Sınıf', 'Kişisel hayat', 'Aile', 'Mahalle ve şehir', 'Doğa', 'Dünya', 'Evren ve gelecek'],
  };
  const yakinda = COCUK_UYGULAMADA
    ? ''
    : `<p class="yakinda"><b>Hazırlanıyor:</b> Çocuk bölümü okul müfredatıyla birlikte uygulamaya ekleniyor. Şimdilik genel kelimelerle başlayabilirsiniz; hepsi çocuğa uygun.</p>`;
  const SSS_COCUK = [
    ['Kaç yaş için uygun?', 'Okuma yazma bilen çocuklar için: 2. sınıftan 6. sınıfa kadar. Kelimeler okulda işlenen temalara göre sıralanıyor.'],
    ['İçerik çocuğa uygun mu?', 'Evet. Şiddet, korku, uygunsuz ya da kötü çağrışım yapan hiçbir kelime, cümle ve görsel kullanmıyoruz; her kart bu kurala göre hazırlanıyor.'],
    ['Reklam var mı, ücretli mi?', 'Reklam yok. Şu an tamamen ücretsiz.'],
    ['Verilerimiz ne oluyor?', 'Üyelik zorunlu değil. Çocuk hesabı veli tarafından açılır; veriler satılmaz, istediğinizde silinir. Ayrıntılar KVKK metninde.'],
  ];
  return [
    {
      yol: '/cocuk/',
      bolum: 'cocuk',
      baslik: 'Çocuklar için İngilizce Kelimeler — Okul Müfredatına Uygun, Resimli | Hafızada',
      aciklama: '2–6. sınıf için okul müfredatına uygun İngilizce kelimeler: resimli, sesli, görselleştirilmiş hafıza teknikleriyle. Reklamsız, ücretsiz, çocuğa uygun.',
      ogTur: 'website',
      icerik: `<section class="bolum-kahraman">
  <div class="kap">
    <div>
      <span class="ust-etiket">2–6. sınıf · okul müfredatına uygun</span>
      <h1>Çocuklar için<br><span class="vurgu-kalem">resimli İngilizce.</span></h1>
      <p class="giris">Her kelime bir resim, bir ses ve küçük bir hikâyeyle. Çocuğunuz kelimeyi ezberlemiyor, gözünün önüne getiriyor.</p>
      <div class="dugmeler">
        <a class="btn btn-sari btn-buyuk" href="#siniflar">Sınıflara bak</a>
        <a class="btn btn-beyaz btn-buyuk" href="#veli">Veliler için</a>
      </div>
    </div>
    <div class="cocuk-kartlar">
${ornekKartlar.map((k) => `      <a class="mini-kart" href="/kelime/${k.id}/"><img src="${k.sayfaResmi}" alt="${c.esc(k.sentence)}" width="400" height="300" loading="lazy"><span><b>${c.esc(k.en)}</b> ${c.esc(k.tr)}</span></a>`).join('\n')}
    </div>
  </div>
</section>
<section class="uniteler" id="siniflar">
  <div class="kap">
    <h2>Sınıf sınıf</h2>
    <p class="ust">Kelimeler okul kitaplarından; her sınıf kendi temalarıyla.</p>
    <div class="unite-izgara">
${[2, 3, 4, 5, 6].map((g) => `      <div class="unite-kart"><span class="no">${g}. sınıf</span><span class="ad">${sinif(g).length} yeni kelime</span><span class="sayi">${TEMALAR[g].join(' · ')}</span><span class="ornek">${sinif(g).filter((x) => !x.ifade).slice(0, 6).map((x) => c.esc(x.en)).join(', ')}…</span></div>`).join('\n')}
    </div>
    ${yakinda}
  </div>
</section>
${DALGA_UST}
<section class="koyu" id="yontem">
  <div class="kap">
    <h2>Nasıl çalışıyor?</h2>
    <p class="ust">Kısa, renkli ve tekrarlı. Bir ders birkaç dakika.</p>
    <div class="adimlar">
      <div class="adim"><span class="no">Gör</span><h3>Resim ve hikâye</h3><p>Her kelime çocuğun tanıdığı bir şeye bağlanıyor: snake ≈ sinek, “Yılan sineği yutuyor.”</p></div>
      <div class="adim"><span class="no">Dinle</span><h3>Doğru ses</h3><p>Her kelimenin İngilizce okunuşu sesli. Yavaş dinleme seçeneği var.</p></div>
      <div class="adim"><span class="no">Hatırla</span><h3>Tam unutacakken</h3><p>Uygulama kelimeyi unutmaya yakın tekrar soruyor; öğrenilen kalıcı oluyor.</p></div>
    </div>
  </div>
</section>
${DALGA_ALT}
<section class="veli" id="veli">
  <div class="kap veli-kap">
    <div><h2>Veliler için</h2>
    <p><b>Güvenli içerik.</b> Hiçbir kelime, cümle ya da resim şiddet, korku veya kötü çağrışım içermiyor. Bu kural her kart için uygulanıyor.</p>
    <p><b>Reklam yok, ücret yok.</b> Çocuğunuz dikkatini dağıtan hiçbir şey görmüyor.</p>
    <p><b>Okulla aynı yolda.</b> Kelimeler MEB ders kitaplarının sözlüklerinden; sınıf ve temaya göre.</p></div>
  </div>
</section>
${c.sssHtml(SSS_COCUK)}
${DALGA_SARI}
<section class="kapanis">
  <div class="kap kutu">
    <h2>İlk kelime birkaç saniye uzakta.</h2>
    <p>Birlikte deneyin; beğenirse her gün birkaç dakika yeter.</p>
    <a class="btn btn-lacivert btn-buyuk" href="${c.baslaYol('cocuk')}" data-basla>Hemen başla</a>
  </div>
</section>`,
      script: '',
      ld: c.jsonld(c.kirinti([['Ana sayfa', '/'], ['Çocuk', '/cocuk/']]), {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: SSS_COCUK.map(([s, cv]) => ({ '@type': 'Question', name: s, acceptedAnswer: { '@type': 'Answer', text: cv } })),
      }),
    },
  ];
}
