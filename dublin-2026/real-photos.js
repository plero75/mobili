(()=>{
const REAL={
'Cracovie':['https://www.whitemad.pl/wp-content/uploads/2022/04/krakow-ge479a87b7_1920.jpg'],
'Bologne':['https://blog.igisam.com/app/uploads/2026/01/bologna-1024x768.jpg'],
'Tirana':['https://travellingbalkans.com/wp-content/uploads/2019/09/DJI_0853-HDR-1150x862.jpg'],
'Rotterdam':['https://www.immerheiser.de/wp-content/uploads/2020/07/kubush%C3%A4user-1200x800.jpg'],
'Bucarest':['https://cdn.romania-insider.com/sites/default/files/2019-11/calea_victoriei_copyright_ampt_2_copy.jpg'],
'Munich':['https://images.squarespace-cdn.com/content/v1/5efce1f1f1c14550f51a35e4/1672693531894-H8JDSZSW3NRTKAX11MN1/Alma%2Bde%2BViaje%2B-%2BAlemania%2B-%2BMunich%2Bque%2Bhacer-122.jpg'],
'Turin':['https://cultureactivities.com/images/best-cultural-museums-to-visit-in-turin-italy.webp'],
'Amsterdam':['https://csp.aaa.com/nuxeo/site/public/transform/default/6577f0fe-888b-4420-8925-380e2fd800d0?compressionLevel=75'],
'Málaga':['https://static.fotocasa.es/images/ads/038111b0-2e3b-458c-8416-57286ed597f7?rule=original'],
'Alicante':['https://www.explorespainguide.com/wp-content/uploads/2024/01/Harbor-in-Alicante-city.webp']
};
function css(){const s=document.createElement('style');s.textContent=`
.real-photo-strip{display:grid;grid-template-columns:1.45fr 1fr;gap:8px;margin:18px 0 0}.real-photo-strip img{width:100%;height:180px;object-fit:cover;border-radius:10px;display:block}.real-photo-strip img:first-child{height:180px}.real-photo-cap{grid-column:1/-1;font-size:10px;color:#756b5e;margin-top:-2px}.current-top>img{object-position:center}.current-card[data-realphotos="1"] .current-main{padding-bottom:18px}@media(max-width:760px){.real-photo-strip{grid-template-columns:1fr}.real-photo-strip img{height:190px}.real-photo-cap{grid-column:1}}
`;document.head.appendChild(s)}
function apply(){document.querySelectorAll('.current-card').forEach(card=>{if(card.dataset.realphotos)return;const h=card.querySelector('.current-title h3');if(!h)return;const name=h.textContent.replace(/^\s*[^A-Za-zÀ-ÿ]+\s*/,'').trim();const main=card.querySelector('.current-main');const hero=card.querySelector('.current-top>img');const extra=REAL[name]||[];if(!main||!hero)return;const imgs=[hero.src,...extra].filter(Boolean).slice(0,2);if(imgs.length<2)return;const strip=document.createElement('div');strip.className='real-photo-strip';strip.innerHTML=imgs.map((src,i)=>`<img loading="lazy" src="${src}" alt="${name} — photo réelle ${i+1}" referrerpolicy="no-referrer">`).join('')+`<div class="real-photo-cap">📷 Photos réelles de ${name} — pas de visuel généré.</div>`;main.appendChild(strip);card.dataset.realphotos='1'})}
function run(){css();apply();let n=0;const t=setInterval(()=>{apply();if(++n>20)clearInterval(t)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();