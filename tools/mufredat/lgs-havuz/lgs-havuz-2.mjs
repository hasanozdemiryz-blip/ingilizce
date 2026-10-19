// analiz.json → havuz.json (yeni LGS havuzu kurali: A + temel olmayan B + sinavda cikmis temel olmayan C/D).
import fs from 'node:fs';
const S=process.cwd()+'/';const rows=JSON.parse(fs.readFileSync(S+'analiz.json'));
const STOP=new Set(`a an the to of in on at by for with from into onto about above below over under up down out off as than then so too very also just only even still yet already ever never always often sometimes usually and or but if because while when where what which who whom whose why how that this these those there here it its i me my mine you your yours he him his she her hers we us our ours they them their theirs myself yourself himself herself itself ourselves themselves one ones some any no not none all both each every either neither other another such much many more most few less least lot lots can could will would shall should may might must do does did done be am is are was were been being have has had get got let ok okay yes yeah hi hello bye mr mrs ms dr etc a.m p.m oh well really after before since until till during through across along around against between among behind beside near far like unlike without within upon per via whether although though however therefore`.split(/\s+/));
const TALIMAT=new Set('following blank above below according complete question questions option options information answer true false correct incorrect statement statements choose fill text paragraph chart table graph sentence sentences dialogue conversation example extract passage read test exam number point picture pictures best given related mention mentioned infer inferred'.split(' '));
const temel=r=>r.cefr==='a1'&&(r.sinif===null||r.sinif<=4)&&!r.ifade;
for(const r of rows){r.stop=STOP.has(r.w);r.talimat=TALIMAT.has(r.w);r.temel=temel(r)}
const aday=rows.filter(r=>!r.stop&&!r.talimat);
const t=(f)=>{const o={};for(const r of aday.filter(f))o[r.kaynak]=(o[r.kaynak]||0)+1;return o};
console.log('Durak/talimat sonrası:',t(()=>true));
console.log('…temel değil (A1 + 2–4. sınıf hariç):',t(r=>!r.temel));
console.log('…temel değil + sınavda ≥1:',t(r=>!r.temel&&r.sinav>=1));
console.log('…temel kelime ama sınavda ≥2:',t(r=>r.temel&&r.sinav>=2));
// Yeni havuz kuralı
const havuz=aday.filter(r=>r.kaynak==='A-mevcut'||(r.kaynak==='B-tam-unite'&&!r.temel)||((r.kaynak==='C-alt-sinif'||r.kaynak==='D-diger')&&!r.temel&&r.sinav>=1));
const h={};havuz.forEach(r=>h[r.kaynak]=(h[r.kaynak]||0)+1);console.log('YENİ LGS HAVUZU',havuz.length,h,'ifade',havuz.filter(r=>r.ifade).length);
const yeniKart=havuz.filter(r=>!r.lgsKart&&!r.genel);console.log('kartı olmayan (yeni üretim):',yeniKart.length,'ifade',yeniKart.filter(r=>r.ifade).length,'tek kelime',yeniKart.filter(r=>!r.ifade).length);
console.log('havuzda Genel kartı olan:',havuz.filter(r=>r.genel).length,'LGS kartı olan:',havuz.filter(r=>r.lgsKart).length);
const cefrD={};yeniKart.filter(r=>!r.ifade).forEach(r=>cefrD[r.cefr||'yok']=(cefrD[r.cefr||'yok']||0)+1);console.log('yeni tek kelimelerin CEFR:',cefrD);
console.log('C örnek:',havuz.filter(r=>r.kaynak==='C-alt-sinif').sort((a,b)=>b.sinav-a.sinav).slice(0,40).map(r=>`${r.w}(${r.sinif}.s,${r.sinav})`).join(', '));
console.log('D örnek:',havuz.filter(r=>r.kaynak==='D-diger').sort((a,b)=>b.sinav-a.sinav).slice(0,40).map(r=>`${r.w}(${r.cefr},${r.sinav})`).join(', '));
console.log('B örnek:',havuz.filter(r=>r.kaynak==='B-tam-unite').sort((a,b)=>b.sinav-a.sinav).slice(0,40).map(r=>`${r.w}(${r.sinav})`).join(', '));
const tem=aday.filter(r=>r.temel&&r.sinav>=1);console.log('temel+sınavda',tem.length,'ör:',tem.sort((a,b)=>b.sinav-a.sinav).slice(0,30).map(r=>r.w).join(' '));
fs.writeFileSync(S+'havuz.json',JSON.stringify(havuz));
