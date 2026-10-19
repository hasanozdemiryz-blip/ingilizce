// LGS havuz analizi (19 Ekim 2026). Calisma klasorunde: indir/s1..s8.txt (LGS 2025..2018 Ingilizce,
// pypdf ile PDF'ten metin; PDF'ler bilgenc.com/lgs-ingilizce-cikmis-sorular), indir/ox.csv (Oxford 5000),
// unite-tam.json (ingilizceciyiz.com 8. sinif 1-10. unite sayfalarindaki 'const cards' nesnesi).
// Cikti: analiz.json (her kelime: kaynak A/B/C/D, sinav sayisi, sinif, cefr). Sonra lgs-havuz-2.mjs.
import fs from 'node:fs';
const R=new URL('../../../', import.meta.url).pathname, S=process.cwd()+'/';
const n=s=>String(s).toLowerCase().replace(/[’']/g,"'").replace(/\s+/g,' ').trim();
// Oxford
const ox=new Map();
for(const l of fs.readFileSync(S+'indir/ox.csv','utf8').split(/\r?\n/).slice(1)){const a=[];let ic=0,c='';for(const ch of l){if(ch=='"')ic=!ic;else if(ch==','&&!ic){a.push(c);c='';if(a.length==4)break}else c+=ch}a.push(c);if(!a[1])continue;const w=n(a[1]);const o=ox.get(w)||{t:new Set(),c:'c2'};o.t.add(a[2]);if(a[3]&&a[3]<o.c)o.c=a[3];ox.set(w,o)}
const FONK=/article|preposition|pronoun|determiner|conjunction|modal|auxiliary|number|ordinal/;
const fonk=w=>{const o=ox.get(w);return o&&[...o.t].every(t=>FONK.test(t))};
const EK=new Set('be am is are was were been being have has had do does did not no yes ok okay mr mrs ms etc'.split(' '));
// Kaynaklar
const muf=JSON.parse(fs.readFileSync(R+'tools/mufredat/mufredat.json'));const mufM=new Map(muf.map(x=>[n(x.en),x]));
const genel=new Set(JSON.parse(fs.readFileSync(R+'content/cards.json')).map(x=>n(x.en)));
const lgsK=JSON.parse(fs.readFileSync(R+'content/lgs.json')).kartlar;const lgs=new Set(lgsK.map(x=>n(x.en)));
const etiket=new Set(fs.readFileSync(R+'tools/mufredat/lgs8-etiket.txt','utf8').split(/\r?\n/).filter(l=>l&&!l.startsWith('#')).map(l=>n(l.split('|')[1])));
const tam=JSON.parse(fs.readFileSync(S+'unite-tam.json'));const tamM=new Map();for(const[u,d]of Object.entries(tam))for(const[k,v]of Object.entries(d)){const w=n(k);if(!tamM.has(w))tamM.set(w,{u:+u,tr:v})}
// Sözlük: lemma adayları
const sozluk=new Set([...ox.keys(),...mufM.keys(),...genel,...lgs,...etiket,...tamM.keys()]);
const DUZ={went:'go',gone:'go',saw:'see',seen:'see',made:'make',took:'take',taken:'take',got:'get',gave:'give',given:'give',came:'come',ate:'eat',eaten:'eat',bought:'buy',brought:'bring',thought:'think',told:'tell',said:'say',found:'find',felt:'feel',left:'leave',met:'meet',kept:'keep',knew:'know',known:'know',began:'begin',begun:'begin',wrote:'write',written:'write',spoke:'speak',spoken:'speak',broke:'break',broken:'break',chose:'choose',chosen:'choose',forgot:'forget',forgotten:'forget',flew:'fly',drove:'drive',ran:'run',swam:'swim',won:'win',lost:'lose',paid:'pay',sent:'send',spent:'spend',built:'build',taught:'teach',caught:'catch',heard:'hear',held:'hold',sold:'sell',stood:'stand',understood:'understand',woke:'wake',wore:'wear',drew:'draw',grew:'grow',threw:'throw',fell:'fall',hid:'hide',sang:'sing',sat:'sit',slept:'sleep',children:'child',people:'person',men:'man',women:'woman',feet:'foot',teeth:'tooth',better:'good',best:'good',worse:'bad',worst:'bad',mice:'mouse'};
function lemma(t){if(sozluk.has(t))return t;if(DUZ[t])return DUZ[t];const c=[];
 if(t.endsWith('ies'))c.push(t.slice(0,-3)+'y');if(t.endsWith('ied'))c.push(t.slice(0,-3)+'y');
 if(t.endsWith('es'))c.push(t.slice(0,-2));if(t.endsWith('s'))c.push(t.slice(0,-1));
 if(t.endsWith('ed')){c.push(t.slice(0,-2),t.slice(0,-1));if(/(.)\1ed$/.test(t))c.push(t.slice(0,-3))}
 if(t.endsWith('ing')){c.push(t.slice(0,-3),t.slice(0,-3)+'e');if(/(.)\1ing$/.test(t))c.push(t.slice(0,-4))}
 if(t.endsWith('er')){c.push(t.slice(0,-2),t.slice(0,-1));if(t.endsWith('ier'))c.push(t.slice(0,-3)+'y')}
 if(t.endsWith('est')){c.push(t.slice(0,-3),t.slice(0,-2));if(t.endsWith('iest'))c.push(t.slice(0,-4)+'y')}
 if(t.endsWith('ly'))c.push(t.slice(0,-2));
 return c.find(x=>sozluk.has(x))||null}
// Sınavlar
const yillar=[2025,2024,2023,2022,2021,2020,2019,2018];
const sinav=yillar.map((y,i)=>{const m=' '+fs.readFileSync(S+`indir/s${i+1}.txt`,'utf8').toLowerCase().replace(/[’']/g,"'").replace(/[^a-z' ]+/g,' ').replace(/\s+/g,' ')+' ';return{y,m}});
const say=new Map(); // lemma -> Set(yil)
const tanimsiz=new Map();
for(const s of sinav){for(let t of s.m.split(' ')){t=t.replace(/^'+|'+$/g,'').replace(/'s$|n't$|'ll$|'re$|'ve$|'m$|'d$/,'');if(t.length<2)continue;const l=lemma(t);if(!l){tanimsiz.set(t,(tanimsiz.get(t)||0)+1);continue}(say.get(l)||say.set(l,new Set()).get(l)).add(s.y)}}
// ifadeler (çok kelimeli)
const bic=w=>{const s=new Set([w,w+'s',w+'es',w+'ed',w+'d',w+'ing']);if(w.endsWith('e'))s.add(w.slice(0,-1)+'ing');if(/[^aeiou]y$/.test(w)){s.add(w.slice(0,-1)+'ies');s.add(w.slice(0,-1)+'ied')}return[...s]};
for(const w of sozluk){if(!w.includes(' '))continue;const p=w.split(' ');const k=bic(p[0]).map(b=>' '+[b,...p.slice(1)].join(' ')+' ');for(const s of sinav)if(k.some(x=>s.m.includes(x)))(say.get(w)||say.set(w,new Set()).get(w)).add(s.y)}
const icerik=w=>!fonk(w)&&!EK.has(w)&&!/^\d/.test(w);
const ilkSinif=w=>{const m=mufM.get(w);return m?Math.min(...m.siniflar):null};
const cefr=w=>ox.get(w)?.c||(ox.get(w.split(' ')[0])?.c)||null;
// Katmanlar
const sinavK=[...say.keys()].filter(icerik);
const rows=[];
const hepsi=new Set([...etiket,...[...tamM.keys()].filter(icerik),...sinavK]);
for(const w of hepsi){const s=say.get(w)?.size||0;const g=ilkSinif(w);
 const kaynak=etiket.has(w)?'A-mevcut':tamM.has(w)?'B-tam-unite':(g&&g<=7)?'C-alt-sinif':'D-diger';
 rows.push({w,kaynak,sinav:s,sinif:g,cefr:cefr(w),genel:genel.has(w),lgsKart:lgs.has(w),tr:tamM.get(w)?.tr||mufM.get(w)?.tr||'',unite:tamM.get(w)?.u||null,ifade:w.includes(' ')})}
fs.writeFileSync(S+'analiz.json',JSON.stringify(rows,null,0));
const grup=(f)=>{const o={};for(const r of rows.filter(f))o[r.kaynak]=(o[r.kaynak]||0)+1;return o};
console.log('Sınavda geçen içerik kelimesi (lemma+ifade):',sinavK.length,'— tanınmayan token türü:',tanimsiz.size);
console.log('Bütün katmanlar:',grup(()=>true));
console.log('Sınavda en az 1 kez geçen:',grup(r=>r.sinav>=1));
console.log('Sınavda ≥2 sınavda:',grup(r=>r.sinav>=2));
const C=rows.filter(r=>r.kaynak=='C-alt-sinif'&&r.sinav>=1);const bySn={};C.forEach(r=>bySn[r.sinif]=(bySn[r.sinif]||0)+1);console.log('C (sınavda çıkmış alt sınıf kelimesi) ilk geçtiği sınıf:',bySn);
console.log('C örnek (≥3 sınav):',C.filter(r=>r.sinav>=3).sort((a,b)=>b.sinav-a.sinav).slice(0,40).map(r=>r.w+'('+r.sinif+')').join(', '));
const D=rows.filter(r=>r.kaynak=='D-diger'&&r.sinav>=2).sort((a,b)=>b.sinav-a.sinav);console.log('D ≥2 sınav:',D.length,'örnek:',D.slice(0,50).map(r=>r.w+':'+r.cefr).join(', '));
const Bs=rows.filter(r=>r.kaynak=='B-tam-unite');console.log('B toplam',Bs.length,'sınavda geçen',Bs.filter(r=>r.sinav).length,'cefr a1',Bs.filter(r=>r.cefr=='a1').length,'ifade',Bs.filter(r=>r.ifade).length);
const A=rows.filter(r=>r.kaynak=='A-mevcut');console.log('A sınavda geçen',A.filter(r=>r.sinav).length,'/',A.length);
console.log('tanınmayan sık:',[...tanimsiz].sort((a,b)=>b[1]-a[1]).slice(0,40).map(x=>x[0]).join(' '));
