// Instagram paylasimlarini marka rehberinin stiliyle uretir.
//
//   node tools/instagram.mjs                 -> tools/instagram-icerik.json'daki hepsi
//   node tools/instagram.mjs do-does-did     -> yalnizca bir paylasim
//
// Cikti: instagram/cikti/<id>/ (depoda degil; instagram/ gitignore'da).
//   poster  -> poster.png (1080x1350) + reels.mp4 (poster dikey tuvalde, 10 sn)
//   kaydir  -> 01.png, 02.png... (1080x1350)
//   reels   -> reels.mp4 (1080x1920) + kapak.png
//   story   -> 1.png...4.png (1080x1920)
//   kapak   -> one cikan kapaklari (1080x1920)
//   her klasorde aciklama.txt (varsa)
//
// Stil: instagram/referans/Hafızada İngilizce Marka Rehberi.png — krem zemin,
// lacivert yazi, sari kutulu vurgu, mavi hoparlor, Poppins. Cizimler
// brand/instagram/*.webp (Magnific, gorsel-recetesi.md tarzi; zemin
// tools/ig-kes.mjs ile silinmis). Kanca kurali: cok kelimeli paylasimda
// kanca yok; kanca yalnizca tek kelimelik paylasimda.
//
// Sayfalar HTML olarak kurulup Chrome'un basliksiz kipiyle cekiliyor.
// Okunus Windows'un Ingilizce sesiyle (Zira). Muzik eklenmiyor, telefonda
// Instagram'in icinden eklenir. Mac'te: CHROME= verilmeli, seslendir()
// `say` ile degistirilmeli.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

const KOK = path.resolve(import.meta.dirname, '..');
const CIKTI = path.join(KOK, 'instagram/cikti');
const GECICI = path.join(CIKTI, '_gecici');
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const icerik = JSON.parse(fs.readFileSync(path.join(KOK, 'tools/instagram-icerik.json'), 'utf8'));

const url = (p) => pathToFileURL(p).href;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Metindeki *vurgu*yu sari kutuya cevirir; geri kalani kacirir. */
const vurgu = (s) => esc(s).replace(/\*(.+?)\*/g, '<mark>$1</mark>');
const resim = (ad) => {
  const p = path.join(KOK, 'brand/instagram', `${ad}.webp`);
  if (!fs.existsSync(p)) throw new Error(`cizim yok: ${ad} (node tools/ig-kes.mjs)`);
  return url(p);
};
const img = (ad, stil = '') => `<img class="ciz" src="${resim(ad)}" style="${stil}" alt="">`;

const font = (agirlik, dosya) =>
  `@font-face{font-family:'Poppins';font-weight:${agirlik};src:url('${url(path.join(KOK, 'brand/fonts', dosya))}') format('truetype')}`;

/** Marka rehberi: renkler, yazi, bilesenler. */
const STIL = `
${font(400, 'Poppins-Regular.ttf')}${font(600, 'Poppins-SemiBold.ttf')}${font(700, 'Poppins-Bold.ttf')}${font(800, 'Poppins-ExtraBold.ttf')}${font(900, 'Poppins-Black.ttf')}
:root{--krem:#FFF8E9;--sari:#FFE082;--sari2:#FFCF3F;--mavi:#4DA3FF;--lac:#2B3A59;--gri:#6B7590;--cizgi:#EFE3C4;--yesil:#2FBF71;--kirmizi:#EE4F6E;
--t1:#FDE4EC;--t2:#E2F0FF;--t3:#E2F6EA;--t4:#FFF0C6;--t5:#ECE6FF}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:var(--g);height:var(--y);overflow:hidden}
body{background:var(--krem);color:var(--lac);font-family:'Poppins',sans-serif;display:flex;flex-direction:column;padding:var(--ust) var(--sag) var(--alt) var(--sol);position:relative}
mark{background:linear-gradient(transparent 24%,var(--sari) 24%,var(--sari) 86%,transparent 86%);color:inherit;padding:0 .18em;border-radius:.22em;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.ciz{display:block;object-fit:contain}
.baslik{font-weight:800;line-height:1.12;letter-spacing:-.01em}
.alt-baslik{color:var(--gri);font-weight:600}
.kart{background:#fff;border:3px solid var(--cizgi);border-radius:34px;box-shadow:0 8px 0 rgba(43,58,89,.07)}
.hap{display:inline-flex;align-items:center;gap:.4em;border-radius:999px;font-weight:700;padding:.3em .9em}
.hap.mavi{background:var(--mavi);color:#fff}.hap.sari{background:var(--sari);color:var(--lac)}.hap.lac{background:var(--lac);color:var(--sari)}
.hap.yesil{background:var(--yesil);color:#fff}
.hop{display:inline-grid;place-items:center;border-radius:50%;background:var(--mavi);flex:none}
.hop svg{width:56%;height:56%}
.buton{display:inline-flex;align-items:center;gap:.5em;background:var(--sari2);color:var(--lac);font-weight:800;border-radius:28px;padding:.55em 1.2em;box-shadow:0 8px 0 #E5AE16}
.no{display:inline-grid;place-items:center;border-radius:50%;color:#fff;font-weight:800;flex:none}
.tik{display:inline-grid;place-items:center;border-radius:50%;background:var(--yesil);color:#fff;font-weight:900;flex:none}
.marka{display:flex;align-items:center;gap:14px;font-weight:800;color:var(--lac)}
.marka img{width:48px;height:48px}
.marka b{background:linear-gradient(transparent 58%,var(--sari) 58%,var(--sari) 92%,transparent 92%)}
.ayak{display:flex;justify-content:space-between;align-items:center;font-size:28px;font-weight:700;color:var(--gri)}
.noktalar{display:flex;gap:12px;justify-content:center}
.noktalar i{width:40px;height:12px;border-radius:6px;background:#E6DCC2}
.noktalar i.on{background:var(--sari2)}
.secenek{display:flex;align-items:center;gap:28px;background:#fff;border:3px solid var(--cizgi);border-radius:28px;padding:22px 30px;font-weight:700}
.secenek .harf{width:68px;height:68px;border-radius:50%;border:3px solid var(--lac);display:grid;place-items:center;font-weight:800;flex:none}
.secenek.dogru{background:#DDF6E8;border-color:var(--yesil)}
.secenek.dogru .harf{background:var(--yesil);border-color:var(--yesil);color:#fff}
.secenek.soluk{opacity:.45}
.kutucuk{display:inline-grid;place-items:center;background:#fff;border:3px solid var(--cizgi);border-radius:22px;font-weight:800;box-shadow:0 6px 0 rgba(43,58,89,.08)}
.kutucuk.bos{background:#F6EEDA;box-shadow:none}
.kutucuk.dogru{background:#DDF6E8;border-color:var(--yesil)}
.giris{display:flex;align-items:center;background:#fff;border:3px solid var(--mavi);border-radius:24px;overflow:hidden}
.giris span{flex:1;padding:22px 28px;color:#A7AEC0;font-weight:600}
.giris span.dolu{color:var(--lac);font-weight:800}
.giris b{background:var(--mavi);color:#fff;padding:22px 34px;font-weight:700}
`;

const HOPARLOR = `<svg viewBox="0 0 24 24" fill="none"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="#fff"/><path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4M18 6.5a8 8 0 0 1 0 11" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>`;
const hop = (boy) => `<span class="hop" style="width:${boy}px;height:${boy}px">${HOPARLOR}</span>`;
const marka = (boy = 34) =>
  `<span class="marka" style="font-size:${boy}px"><img src="${url(path.join(KOK, 'brand/logo-isaret.svg'))}" alt="" style="width:${boy * 1.4}px;height:${boy * 1.4}px">Hafızada <b>İngilizce</b></span>`;
const ayak = () => `<div class="ayak">${marka(30)}<span>@hafizadaingilizce</span></div>`;
const PASTEL = ['var(--t1)', 'var(--t2)', 'var(--t3)', 'var(--t4)', 'var(--t5)'];
const ROZET = ['#EE4F6E', '#3D8DEB', '#2FBF71', '#F0A400', '#8B6BE0'];

/**
 * Tuval: ic bosluklar Reels/Story guvenli alanina gore. `buyut` verilirse
 * tek kutulu govde (ortala) bos alani dolduracak kadar buyutulur — dikey
 * karelerde icerik ekranin yarisinda kalmasin diye; en fazla `buyut` kat.
 */
function sayfa(govde, g, y, bosluk = [56, 56, 48, 56], buyut = 0) {
  const [ust, sag, alt, sol] = bosluk;
  const betik = buyut
    ? `<script>document.fonts.ready.then(()=>{const el=document.body.firstElementChild;const H=el.clientHeight,W=el.clientWidth;
el.style.flex='none';el.style.justifyContent='flex-start';const h=el.scrollHeight;
const w=Math.max(1,...[...el.children].map((c)=>c.getBoundingClientRect().width).filter((x)=>x<W-2));
const z=Math.max(1,Math.min(${buyut},H/h,W/w));el.style.zoom=z;el.style.height=(H/z)+'px';el.style.justifyContent='center';});</script>`
    : '';
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><style>:root{--g:${g}px;--y:${y}px;--ust:${ust}px;--sag:${sag}px;--alt:${alt}px;--sol:${sol}px}${STIL}</style></head><body>${govde}${betik}</body></html>`;
}
const POST = [1080, 1350];
const DIKEY = [1080, 1920];
/** Reels: alttaki 420 ve sagdaki dugme sutunu bos kalir. */
const REELS_BOSLUK = [150, 130, 420, 80];
/** Story: ustte profil, altta yanit cubugu. */
const STORY_BOSLUK = [230, 80, 300, 80];

// ---------------------------------------------------------------- posterler

function posterDoDoesDid(p) {
  const satir = (s, i) => `
    <div class="kart" style="flex:1;min-height:0;display:flex;align-items:center;gap:20px;padding:14px 26px;background:${PASTEL[[3, 0, 1][i]]};border-color:transparent">
      <div style="display:grid;grid-template-columns:${s.ozneler.length > 4 ? '1fr 1fr' : '1fr'};gap:6px 18px;width:230px">${s.ozneler
        .map((o) => `<span style="font-size:${s.ozneler.length > 4 ? 30 : 34}px;font-weight:700;line-height:1.15;white-space:nowrap">• ${esc(o)}</span>`)
        .join('')}</div>
      <svg width="90" height="60" viewBox="0 0 90 60"><path d="M4 30h70M58 12l20 18-20 18" fill="none" stroke="#2B3A59" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <div style="flex:1;display:flex;flex-direction:column;gap:10px">
        <span class="hap ${i === 2 ? 'lac' : 'mavi'}" style="font-size:22px;align-self:flex-start;white-space:nowrap">${esc(s.zaman)}</span>
        <span style="font-size:104px;font-weight:900;line-height:.95;color:${['#2B3A59', '#C2234A', '#7A1F3D'][i]}">${esc(s.kelime)}</span>
        <span style="font-size:25px;font-weight:600;line-height:1.3"><b style="font-weight:800">${esc(s.ornek)}</b><br><span style="color:var(--gri)">${esc(s.tr)}</span></span>
      </div>
      ${img(s.ciz, 'height:230px;width:180px')}
    </div>`;
  return `
    <div style="text-align:center;margin-bottom:16px">
      <p class="baslik" style="font-size:84px">${vurgu(p.baslik)}</p>
      <p class="alt-baslik" style="font-size:32px;margin-top:4px">${esc(p.alt)}</p>
    </div>
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:16px">${p.satirlar.map(satir).join('')}</div>
    <div style="display:flex;align-items:center;gap:22px;border:3px dashed #D9C99E;border-radius:28px;padding:14px 24px;margin:16px 0 16px;background:#fff">
      ${img('ampul', 'width:70px;height:70px')}
      <p style="font-size:25px;font-weight:600;line-height:1.4">${p.ipucu.split(' · ').map(vurgu).join('<br>')}</p>
    </div>
    ${ayak()}`;
}

function posterHatalar(p) {
  const kart = (h, i) => `
    <div class="kart" style="display:flex;align-items:center;gap:18px;padding:12px 18px 12px 12px;min-height:0">
      <div style="flex:none;width:132px;height:100%;max-height:150px;border-radius:24px;background:${PASTEL[i % 5]};display:grid;place-items:center;position:relative">
        ${img(h.ciz, 'width:112px;height:112px')}
        <span class="no" style="position:absolute;top:-10px;left:-10px;width:46px;height:46px;font-size:23px;background:${ROZET[i % 5]}">${i + 1}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <span style="font-size:21px;font-weight:600;color:#A2A9BA;text-decoration:line-through;text-decoration-color:var(--kirmizi);text-decoration-thickness:3px">✗ ${esc(h.yanlis)}</span>
        <span style="font-size:27px;font-weight:800;line-height:1.15"><span style="color:var(--yesil)">✓</span> ${vurgu(h.dogru).replace('???', '<span style="color:var(--kirmizi);letter-spacing:.06em">???</span>')}</span>
      </div>
    </div>`;
  return `
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:18px">
      <div>
        <span class="hap mavi" style="font-size:26px">${esc(p.ust)}</span>
        <p class="baslik" style="font-size:78px;margin-top:14px">${vurgu(p.baslik)}</p>
      </div>
      ${img(p.ciz, 'height:210px;width:190px;flex:none')}
    </div>
    <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(6,1fr);gap:14px;min-height:0">${p.hatalar.map(kart).join('')}</div>
    <div style="display:flex;justify-content:center;margin:18px 0 14px"><span class="hap sari" style="font-size:27px">${vurgu(p.soru)}</span></div>
    ${ayak()}`;
}

function posterBosluk(p) {
  const kutu = (k, i) => `
    <div class="kart" style="flex:1;display:flex;flex-direction:column;align-items:center;padding:10px 12px 12px;background:${PASTEL[[1, 2, 0][i]]};border-color:transparent">
      ${img(k.ciz, 'height:112px;width:170px')}
      <span style="font-size:52px;font-weight:900;line-height:1;margin-top:6px">${esc(k.kelime)}</span>
      <span style="font-size:22px;font-weight:600;color:var(--gri);text-align:center;line-height:1.3;margin-top:6px">${esc(k.kural)}</span>
    </div>`;
  const cumle = (c, i) => {
    const [once, sonra] = c.en.split('___');
    const cevap = c.soru
      ? `<span style="color:var(--kirmizi);font-weight:900;letter-spacing:.08em">???</span>`
      : `<span style="color:var(--kirmizi);font-weight:800">${esc(c.cevap)}</span>`;
    return `<div style="display:flex;align-items:center;gap:14px;padding:3px 14px;border-radius:14px;background:${i % 2 ? 'transparent' : '#fff'}">
      <span class="no" style="width:34px;height:34px;font-size:17px;background:${ROZET[i % 5]}">${i + 1}</span>
      <span style="font-size:26px;font-weight:600;flex:1;white-space:nowrap">${esc(once)}<span style="display:inline-block;min-width:84px;text-align:center;border-bottom:3px dotted #C9B98E;margin:0 6px">${cevap}</span>${esc(sonra)}</span>
      <span style="font-size:20px;color:var(--gri);font-weight:600;white-space:nowrap">${esc(c.tr)}</span>
    </div>`;
  };
  return `
    <div style="text-align:center;margin-bottom:10px">
      <p class="baslik" style="font-size:76px">${vurgu(p.baslik)}</p>
      <p class="alt-baslik" style="font-size:30px;margin-top:0">${esc(p.alt)}</p>
    </div>
    <div style="display:flex;gap:16px;margin-bottom:10px">${p.kutular.map(kutu).join('')}</div>
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;justify-content:space-between">${p.cumleler.map(cumle).join('')}</div>
    <div style="display:flex;justify-content:center;margin:10px 0 10px"><span class="hap sari" style="font-size:26px">${vurgu(p.soru)}</span></div>
    ${ayak()}`;
}

const POSTERLER = { 'do-does-did': posterDoDoesDid, hatalar: posterHatalar, bosluk: posterBosluk };

// ---------------------------------------------------------------- tanitim (kaydirmali)

function tanitimSayfa(s, i, toplam) {
  const nokta = `<div class="noktalar" style="margin-bottom:22px">${Array.from({ length: toplam }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>`;
  const adim = s.adim ? `<span class="no" style="width:72px;height:72px;font-size:36px;background:var(--lac)">${s.adim}</span>` : '';
  const ust = `<div style="display:flex;align-items:center;gap:22px">${adim}<p class="baslik" style="font-size:${s.adim ? 80 : 88}px">${vurgu(s.baslik)}</p></div>
    ${s.alt ? `<p class="alt-baslik" style="font-size:38px;margin-top:22px;line-height:1.35">${vurgu(s.alt)}</p>` : ''}`;
  let orta = '';
  switch (s.gorsel) {
    case 'kapak':
      orta = img('kitap', 'width:600px;height:520px;margin:0 auto');
      break;
    case 'kart':
      orta = `<div class="kart" style="padding:30px;display:flex;flex-direction:column;align-items:center;gap:20px">
        ${img('kart-sell', 'width:560px;height:400px')}
        <div style="display:flex;align-items:center;gap:22px"><span style="font-size:96px;font-weight:900;line-height:1">sell</span>${hop(84)}</div>
        <span style="font-size:44px;color:var(--gri);font-weight:600">satmak</span>
        <span class="hap sari" style="font-size:34px">sell ≈ sel · “Sel gelmeden evini sattı”</span></div>`;
      break;
    case 'eslestir': {
      const sol = ['dust', 'sell', 'salt'], sag = ['tuz', 'satmak', 'toz'];
      const k = (t, d) => `<span class="kutucuk ${d ? 'dogru' : ''}" style="width:380px;height:160px;font-size:62px">${t}</span>`;
      orta = `<div style="display:flex;justify-content:center;gap:140px;position:relative">
        <div style="display:flex;flex-direction:column;gap:44px">${sol.map((t) => k(t, t === 'sell')).join('')}</div>
        <div style="display:flex;flex-direction:column;gap:44px">${sag.map((t) => k(t, t === 'satmak')).join('')}</div>
        <svg style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)" width="160" height="40"><path d="M6 20h148" stroke="#2FBF71" stroke-width="10" stroke-linecap="round"/></svg></div>`;
      break;
    }
    case 'tahmin':
      orta = `<div style="display:flex;flex-direction:column;gap:20px">
        <p style="text-align:center;font-size:150px;font-weight:900;line-height:1;margin-bottom:10px">sell</p>
        ${['şut atmak', 'söylemek', 'satmak', 'sepet']
          .map((t, k) => `<div class="secenek ${k === 2 ? 'dogru' : ''}" style="font-size:52px;padding:26px 34px"><span class="harf" style="font-size:36px">${'ABCD'[k]}</span>${t}${k === 2 ? '<span class="tik" style="width:60px;height:60px;font-size:34px;margin-left:auto">✓</span>' : ''}</div>`)
          .join('')}</div>`;
      break;
    case 'harf':
      orta = `<div style="display:flex;flex-direction:column;align-items:center;gap:44px">
        <span class="hap sari" style="font-size:64px">satmak</span>
        <div style="display:flex;gap:24px">${['s', 'e', '', ''].map((h) => `<span class="kutucuk ${h ? '' : 'bos'}" style="width:190px;height:190px;font-size:104px">${h}</span>`).join('')}</div>
        <div style="display:flex;gap:24px;position:relative">${['l', 'l'].map((h) => `<span class="kutucuk" style="width:190px;height:190px;font-size:104px">${h}</span>`).join('')}
        ${img('el', 'position:absolute;width:150px;height:175px;right:-85px;top:95px')}</div></div>`;
      break;
    case 'yaz':
      orta = `<div style="display:flex;flex-direction:column;align-items:center;gap:50px">
        <span class="hap sari" style="font-size:44px">Türkçesi</span><span style="font-size:150px;font-weight:900;line-height:1">satmak</span>
        <div class="giris" style="width:100%;font-size:60px"><span class="dolu">sel|</span><b>Bak</b></div></div>`;
      break;
    case 'dinle':
      orta = `<div style="display:flex;flex-direction:column;align-items:center;gap:50px">
        ${hop(380)}
        <div class="giris" style="width:100%;font-size:60px"><span class="dolu">sell</span><b style="background:var(--yesil)">✓</b></div></div>`;
      break;
    case 'tekrar':
      orta = `${img('takvim', 'width:560px;height:500px;margin:0 auto')}
        <div style="display:flex;flex-direction:column;align-items:center;gap:18px;margin-top:30px">
          <span class="hap sari" style="font-size:42px">Zorlandın → yakında tekrar sorar</span>
          <span class="hap mavi" style="font-size:42px">Bildin → daha seyrek gelir</span></div>`;
      break;
    case 'son':
      orta = `<div style="display:flex;align-items:center;gap:40px">
        <div style="flex:1;display:flex;flex-direction:column;gap:28px">${s.maddeler
          .map((m) => `<span style="display:flex;align-items:center;gap:20px;font-size:48px;font-weight:700"><span class="tik" style="width:66px;height:66px;font-size:36px">✓</span>${esc(m)}</span>`)
          .join('')}
          <span class="buton" style="font-size:50px;align-self:flex-start;margin-top:30px">Hemen Başla →</span>
          <span style="font-size:38px;font-weight:700;color:var(--gri)">hafizada.com</span></div>
        <div style="width:380px;height:720px;border:14px solid var(--lac);border-radius:56px;background:#fff;padding:26px 20px;display:flex;flex-direction:column;align-items:center;gap:16px">
          <span style="width:90px;height:10px;border-radius:5px;background:var(--lac)"></span>
          ${img('kart-sell', 'width:260px;height:200px')}
          <span style="font-size:52px;font-weight:900;line-height:1">sell</span><span style="font-size:28px;color:var(--gri)">satmak</span>
          <span class="hap sari" style="font-size:22px">sell ≈ sel</span>
          <span class="buton" style="font-size:26px;margin-top:auto">Devam →</span></div></div>`;
      break;
  }
  return `${nokta}${ust}<div style="flex:1;display:flex;flex-direction:column;justify-content:center;margin:30px 0">${orta}</div>
    ${s.not ? `<p style="text-align:center;font-size:32px;font-weight:600;color:var(--gri);margin-bottom:22px">${vurgu(s.not)}</p>` : ''}${ayak()}`;
}

// ---------------------------------------------------------------- reels kareleri

const ortala = (ic, ek = '') => `<div style="flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;gap:40px;${ek}">${ic}</div>`;
const sonKare = (metin) => ortala(`${marka(54)}
  <p class="baslik" style="font-size:76px">${vurgu(metin)}</p>
  <span class="buton" style="font-size:52px">Hemen Başla →</span>
  <span style="font-size:38px;font-weight:700;color:var(--gri)">hafizada.com</span>`);

function kareler(p) {
  const k = [];
  switch (p.tur) {
    case 'kanca': {
      const baslik = `<p class="baslik" style="font-size:96px">${vurgu(p.soru)}</p>`;
      const sahne = img(p.kart, 'width:760px;height:560px');
      k.push({ html: ortala(`${baslik}${sahne}<div style="height:150px"></div>`), sn: 2.4 });
      k.push({ html: ortala(`${baslik}${sahne}<div style="display:flex;align-items:center;gap:24px"><span style="font-size:130px;font-weight:900;line-height:1">${esc(p.en)}</span>${hop(96)}</div><span style="font-size:52px;color:var(--gri);font-weight:600;margin-top:-30px">${esc(p.tr)}</span>`), sn: 2.6, ses: p.en });
      k.push({ html: ortala(`<span class="hap mavi" style="font-size:40px">Nasıl unutmazsın?</span>${sahne}<span class="hap sari" style="font-size:88px;padding:.2em .7em">${esc(p.en)} ≈ ${esc(p.kanca)}</span><p style="font-size:56px;font-weight:700;line-height:1.3">“${esc(p.cumle)}”</p>`), sn: 3.6, ses: p.en });
      k.push({ html: sonKare(p.son), sn: 2.4 });
      break;
    }
    case 'bes-kelime': {
      const liste = (aktif) => `<div style="display:flex;flex-direction:column;gap:22px;width:100%">${p.kelimeler
        .map((w, i) => `<div class="kart" style="display:flex;align-items:center;gap:28px;padding:14px 30px 14px 14px;text-align:left;${i === aktif ? 'border-color:var(--sari2);background:#FFF6D8;transform:scale(1.03)' : aktif >= 0 ? 'opacity:.5' : ''}">
          <div style="width:170px;height:130px;border-radius:24px;background:${PASTEL[i % 5]};display:grid;place-items:center;flex:none">${img(w.ciz, 'width:150px;height:118px')}</div>
          <div style="flex:1"><p style="font-size:58px;font-weight:800;line-height:1.05">${esc(w.en)}</p><p style="font-size:34px;color:var(--gri);font-weight:600">${esc(w.tr)}</p></div>${hop(78)}</div>`)
        .join('')}</div>`;
      const baslik = `<p class="baslik" style="font-size:84px">${vurgu(p.baslik)}</p>`;
      k.push({ html: ortala(baslik + liste(-1)), sn: 1.6 });
      p.kelimeler.forEach((w, i) => k.push({ html: ortala(baslik + liste(i)), sn: 2.4, ses: w.en }));
      k.push({ html: sonKare(p.son), sn: 2.4 });
      break;
    }
    case 'quiz': {
      const ust = `<p class="baslik" style="font-size:92px">${vurgu(p.baslik)}</p>
        <div class="kart" style="padding:20px 40px;display:flex;flex-direction:column;align-items:center">${img(p.ciz, 'width:520px;height:340px')}<span class="hap sari" style="font-size:56px;margin-top:8px">${esc(p.tr)}</span></div>`;
      const sec = (durum) => `<div style="display:flex;flex-direction:column;gap:20px;width:100%">${p.secenekler
        .map((s, i) => `<div class="secenek ${durum && i === p.dogru ? 'dogru' : durum ? 'soluk' : ''}" style="font-size:52px"><span class="harf" style="font-size:36px">${'ABC'[i]}</span>${esc(s)}${durum && i === p.dogru ? '<span class="tik" style="width:70px;height:70px;font-size:40px;margin-left:auto">✓</span>' : ''}</div>`)
        .join('')}</div>`;
      for (const sayi of [3, 2, 1]) {
        k.push({ html: ortala(`${ust}${sec(false)}<span class="no" style="width:110px;height:110px;font-size:60px;background:var(--kirmizi)">${sayi}</span>`, 'gap:34px'), sn: 1 });
      }
      k.push({ html: ortala(`${ust}${sec(true)}<span class="no" style="width:110px;height:110px;font-size:60px;background:var(--yesil)">✓</span>`, 'gap:34px'), sn: 2.4, ses: p.secenekler[p.dogru] });
      k.push({ html: ortala(`<span class="hap mavi" style="font-size:40px">Bir daha unutmamak için</span>${img(p.kart, 'width:760px;height:560px')}<span class="hap sari" style="font-size:88px;padding:.2em .7em">${esc(p.secenekler[p.dogru])} ≈ ${esc(p.kanca)}</span><p style="font-size:56px;font-weight:700">“${esc(p.cumle)}”</p>`), sn: 3.4, ses: p.secenekler[p.dogru] });
      k.push({ html: sonKare(p.son), sn: 2.4 });
      break;
    }
    case 'tekrar': {
      k.push({ html: ortala(`${img('beyin', 'width:520px;height:420px')}<p class="baslik" style="font-size:104px">${vurgu(p.baslik)}</p><p class="alt-baslik" style="font-size:46px">${esc(p.alt)}</p>`), sn: 2 });
      const soruBas = (n, t) => `<span class="hap lac" style="font-size:38px">Soru ${n} / 3</span><p class="baslik" style="font-size:84px">${vurgu(t)}</p>`;
      // 1. harf dizme
      const hedef = p.harf.en.split('');
      for (let n = 0; n <= hedef.length; n++) {
        const kalan = [...p.harf.karisik];
        for (const h of hedef.slice(0, n)) kalan.splice(kalan.indexOf(h), 1);
        const bitti = n === hedef.length;
        k.push({
          html: ortala(`${soruBas(1, 'Harfleri sıraya *diz*')}<span class="hap sari" style="font-size:60px">${esc(p.harf.tr)}</span>
            <div style="display:flex;gap:20px">${hedef.map((h, j) => `<span class="kutucuk ${j < n ? (bitti ? 'dogru' : '') : 'bos'}" style="width:160px;height:160px;font-size:86px">${j < n ? h : ''}</span>`).join('')}</div>
            <div style="display:flex;gap:20px;min-height:160px;position:relative">${kalan.map((h) => `<span class="kutucuk" style="width:160px;height:160px;font-size:86px">${h}</span>`).join('')}
            ${!bitti ? img('el', 'position:absolute;width:140px;height:160px;right:-90px;top:90px') : ''}</div>`),
          sn: n === 0 ? 2 : bitti ? 1.6 : 0.55,
          ses: bitti ? p.harf.en : undefined,
        });
      }
      // 2. dinle yaz
      const dinle = (dolu) => ortala(`${soruBas(2, 'Ne *duyuyorsun?*')}${hop(300)}<p class="alt-baslik" style="font-size:40px">Dokun, tekrar dinle</p>
        <div class="giris" style="width:100%;font-size:52px"><span class="${dolu ? 'dolu' : ''}">${dolu ? esc(p.dinle) : 'İngilizcesini yaz...'}</span><b style="${dolu ? 'background:var(--yesil)' : ''}">${dolu ? '✓' : 'Bak'}</b></div>`);
      k.push({ html: dinle(false), sn: 2.6, ses: p.dinle });
      k.push({ html: dinle(true), sn: 1.6 });
      // 3. bosluk
      const bos = (cevap) => ortala(`${soruBas(3, 'Boşluğu *doldur*')}
        <p style="font-size:84px;font-weight:800">${cevap ? `<span style="color:var(--yesil)">${esc(p.bosluk.secenekler[p.bosluk.dogru])}</span>` : '<span style="color:var(--kirmizi)">___</span>'} ${esc(p.bosluk.cumle)}</p>
        <p class="alt-baslik" style="font-size:40px;margin-top:-20px">${esc(p.bosluk.tr)}</p>
        <div style="display:flex;gap:24px">${p.bosluk.secenekler.map((s, i) => `<span class="kutucuk ${cevap && i === p.bosluk.dogru ? 'dogru' : ''}" style="padding:0 40px;height:130px;font-size:60px;${cevap && i !== p.bosluk.dogru ? 'opacity:.4' : ''}">${esc(s)}</span>`).join('')}</div>`);
      k.push({ html: bos(false), sn: 3 });
      k.push({ html: bos(true), sn: 1.8 });
      k.push({ html: ortala(`<p class="baslik" style="font-size:96px">${vurgu(p.son)}</p>${img('kalp', 'width:300px;height:260px')}<span class="buton" style="font-size:48px">Her gün tekrar → hafizada.com</span>`), sn: 2.6 });
      break;
    }
    case 'motivasyon':
      k.push({ html: ortala(`<p class="baslik" style="font-size:104px">${vurgu(p.k1)}</p>${img('takvim', 'width:520px;height:440px')}`), sn: 2.8 });
      k.push({ html: ortala(`<span style="font-size:240px;font-weight:900;line-height:1;background:var(--sari);border-radius:40px;padding:10px 60px">${esc(p.sayi)}</span><p class="baslik" style="font-size:110px">${esc(p.k2)}</p>`), sn: 2.2 });
      k.push({ html: ortala(`${img('beyin', 'width:560px;height:440px')}<p class="baslik" style="font-size:96px">${vurgu(p.k3)}</p><p class="alt-baslik" style="font-size:48px">${esc(p.k3alt)}</p>`), sn: 3 });
      k.push({ html: sonKare(p.son), sn: 2.6 });
      break;
    default:
      throw new Error(`bilinmeyen reels turu: ${p.tur}`);
  }
  return k;
}

function storyKareleri(p) {
  const ust = (t) => `<span class="hap lac" style="font-size:40px;align-self:center">${esc(t)}</span>`;
  return [
    ortala(`${ust('Bugünün kelimesi')}<div class="kart" style="padding:30px 40px">${img(p.ciz, 'width:620px;height:460px')}</div>
      <div style="display:flex;align-items:center;gap:24px"><span style="font-size:140px;font-weight:900;line-height:1">${esc(p.en)}</span>${hop(100)}</div>
      <p class="alt-baslik" style="font-size:44px">Ne demek? Sonraki hikâyede 👉</p>`),
    ortala(`${ust('Ne demek?')}<p style="font-size:150px;font-weight:900;line-height:1">${esc(p.en)}</p>
      <div style="display:flex;flex-direction:column;gap:24px;width:100%">${p.secenekler.map((s, i) => `<div class="secenek" style="font-size:56px"><span class="harf" style="font-size:38px">${'ABC'[i]}</span>${esc(s)}</div>`).join('')}</div>
      ${img('soru', 'width:240px;height:200px')}`),
    ortala(`${ust('Doğru cevap')}<span class="tik" style="width:260px;height:260px;font-size:150px">✓</span>
      <p class="baslik" style="font-size:110px">${esc(p.en)} = <mark>${esc(p.secenekler[p.dogru])}</mark></p>
      <div class="kart" style="padding:20px 30px">${img(p.ciz, 'width:420px;height:300px')}</div>
      <p class="alt-baslik" style="font-size:44px">Bildin mi? 💪</p>`),
    ortala(`<p class="baslik" style="font-size:120px">Yarın tekrar <mark>gel!</mark></p>${img('beyin', 'width:600px;height:480px')}
      <p class="alt-baslik" style="font-size:48px">Her gün bir kelime, unutmadan.</p>
      <span class="hap mavi" style="font-size:52px;padding:.4em 1.2em">Hatırlat 👀</span>`),
  ];
}

const kapakGovde = (ciz) =>
  `<div style="flex:1;display:grid;place-items:center"><div style="width:860px;height:860px;border-radius:50%;background:#fff;border:22px solid var(--sari2);display:grid;place-items:center">${img(ciz, 'width:540px;height:540px')}</div></div>`;

// ---------------------------------------------------------------- cizim ve video

let sayac = 0;
/** HTML'yi Chrome'la PNG'ye cevirir; olcu tutmuyorsa durur. */
async function ciz(html, g, y, cikti) {
  fs.mkdirSync(GECICI, { recursive: true });
  const dosya = path.join(GECICI, `s${++sayac}.html`);
  fs.writeFileSync(dosya, html);
  execFileSync(
    CHROME,
    ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--allow-file-access-from-files', '--virtual-time-budget=3000', `--window-size=${g},${y}`, `--screenshot=${cikti}`, url(dosya)],
    { stdio: 'ignore' },
  );
  const { width, height } = await sharp(cikti).metadata();
  if (width !== g || height !== y) throw new Error(`${cikti}: ${width}x${height}, beklenen ${g}x${y}`);
}

/** Kelimenin okunusu — Windows'un Ingilizce sesi. */
const sesler = new Map();
function seslendir(kelime) {
  if (sesler.has(kelime)) return sesler.get(kelime);
  const cikti = path.join(GECICI, `ses-${sesler.size}.wav`);
  const ps = `Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
    `$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'en-*' } | Select-Object -First 1; ` +
    `if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }; $s.Rate = -2; $s.SetOutputToWaveFile('${cikti.replace(/'/g, "''")}'); ` +
    `$s.Speak('${kelime.replace(/'/g, "''")}'); $s.Dispose()`;
  execFileSync('powershell', ['-NoProfile', '-Command', ps], { stdio: 'ignore' });
  sesler.set(kelime, cikti);
  return cikti;
}

/** Kareleri sureleriyle videoya dizer; sesler `[dosya, saniye]`. */
function videoYap(kareler, sesListesi, cikti) {
  const liste = path.join(GECICI, `liste${++sayac}.txt`);
  const satirlar = kareler.flatMap(([png, sn]) => [`file '${png.replace(/\\/g, '/')}'`, `duration ${sn}`]);
  satirlar.push(`file '${kareler.at(-1)[0].replace(/\\/g, '/')}'`);
  fs.writeFileSync(liste, satirlar.join('\n'));
  const toplam = kareler.reduce((n, [, sn]) => n + sn, 0);
  const girdiler = ['-f', 'concat', '-safe', '0', '-i', liste, '-f', 'lavfi', '-t', String(toplam), '-i', 'anullsrc=r=44100:cl=stereo'];
  for (const [wav] of sesListesi) girdiler.push('-i', wav);
  const filtre = sesListesi.length
    ? sesListesi.map(([, sn], i) => `[${i + 2}:a]adelay=${Math.round(sn * 1000)}|${Math.round(sn * 1000)},volume=1.6[s${i}]`).join(';') +
      `;[1:a]${sesListesi.map((_, i) => `[s${i}]`).join('')}amix=inputs=${sesListesi.length + 1}:duration=first:normalize=0[ses]`
    : '[1:a]anull[ses]';
  execFileSync('ffmpeg', ['-y', ...girdiler, '-filter_complex', `[0:v]fps=30,format=yuv420p[v];${filtre}`, '-map', '[v]', '-map', '[ses]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '128k', '-t', String(toplam), '-movflags', '+faststart', cikti], { stdio: 'ignore' });
}

/** Poster Reels'i: poster dikey tuvalin ustunde, alt 420 bos; 10 sn yavas yakinlasma. */
async function posterReels(poster, klasor) {
  const tuval = path.join(GECICI, `tuval${++sayac}.png`);
  await sharp({ create: { width: 1080, height: 1920, channels: 3, background: '#FFF8E9' } })
    .composite([{ input: poster, top: 110, left: 0 }])
    .png().toFile(tuval);
  execFileSync('ffmpeg', ['-y', '-loop', '1', '-i', tuval, '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-t', '10',
    '-vf', "scale=2160:3840,zoompan=z='1+0.00012*on':x='iw/2-(iw/zoom/2)':y='ih*0.36-(ih*0.36/zoom)':d=300:s=1080x1920:fps=30,format=yuv420p",
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-shortest', '-movflags', '+faststart', path.join(klasor, 'reels.mp4')], { stdio: 'ignore' });
}

// ---------------------------------------------------------------- uretim

async function uret(p) {
  const klasor = path.join(CIKTI, p.id);
  fs.rmSync(klasor, { recursive: true, force: true });
  fs.mkdirSync(klasor, { recursive: true });

  if (p.bicim === 'poster') {
    const png = path.join(klasor, 'poster.png');
    await ciz(sayfa(POSTERLER[p.sablon](p), ...POST), ...POST, png);
    await posterReels(png, klasor);
  } else if (p.bicim === 'kaydir') {
    for (const [i, s] of p.sayfalar.entries()) {
      await ciz(sayfa(tanitimSayfa(s, i, p.sayfalar.length), ...POST, [50, 64, 48, 64]), ...POST, path.join(klasor, `${String(i + 1).padStart(2, '0')}.png`));
    }
  } else if (p.bicim === 'reels') {
    const liste = kareler(p);
    const pngler = [];
    const sesListesi = [];
    let an = 0;
    for (const [i, kare] of liste.entries()) {
      const png = path.join(GECICI, `${p.id}-${i}.png`);
      await ciz(sayfa(kare.html, ...DIKEY, REELS_BOSLUK, kare.buyut ?? 1.45), ...DIKEY, png);
      pngler.push([png, kare.sn]);
      if (kare.ses) sesListesi.push([seslendir(kare.ses), an + 0.25]);
      an += kare.sn;
    }
    fs.copyFileSync(pngler[p.kapakKare ?? 0][0], path.join(klasor, 'kapak.png'));
    videoYap(pngler, sesListesi, path.join(klasor, 'reels.mp4'));
  } else if (p.bicim === 'story') {
    for (const [i, html] of storyKareleri(p).entries()) {
      await ciz(sayfa(html, ...DIKEY, STORY_BOSLUK, 1.35), ...DIKEY, path.join(klasor, `${i + 1}.png`));
    }
  } else if (p.bicim === 'kapaklar') {
    for (const k of p.kapaklar) {
      await ciz(sayfa(kapakGovde(k.ciz), ...DIKEY, [0, 0, 0, 0]).replace('background:var(--krem)', 'background:var(--sari)'), ...DIKEY, path.join(klasor, `${k.ad}.png`));
    }
  } else {
    throw new Error(`bilinmeyen bicim: ${p.bicim}`);
  }

  if (p.aciklama) {
    fs.writeFileSync(path.join(klasor, 'aciklama.txt'), `${p.aciklama.trim()}\n\n${(p.etiketler ?? icerik.etiketler).join(' ')}\n`);
  }
  console.log('✓', p.id);
}

const secilen = process.argv.slice(2);
const liste = secilen.length ? icerik.paylasimlar.filter((p) => secilen.includes(p.id)) : icerik.paylasimlar;
if (!liste.length) throw new Error(`paylasim yok: ${secilen.join(' ')}`);
for (const p of liste) await uret(p);
fs.rmSync(GECICI, { recursive: true, force: true });
