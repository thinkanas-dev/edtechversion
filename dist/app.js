const pages=[...document.querySelectorAll('[data-page]')];
const routeButtons=[...document.querySelectorAll('[data-route]')];
function navigate(route){
  const target=document.querySelector(`[data-page="${route}"]`)||document.querySelector('[data-page="home"]');
  pages.forEach(p=>p.classList.toggle('active',p===target));
  routeButtons.forEach(b=>b.classList.toggle('active',b.dataset.route===route&&(!b.classList.contains('brand'))));
  history.replaceState(null,'',`#${route}`);window.scrollTo({top:0,behavior:'smooth'});target.focus?.();
}
routeButtons.forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.route)));
const toast=document.querySelector('.toast');let toastTimer;
function showToast(message){toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2200)}
document.querySelectorAll('[data-toast]').forEach(b=>b.addEventListener('click',()=>showToast(b.dataset.toast)));
document.querySelectorAll('.subject-tabs button').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.subject-tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');showToast(`${b.textContent} sélectionné`)}));
const sliders=[...document.querySelectorAll('.score-inputs input')];
function updateScore(){const values=sliders.map(s=>Number(s.value));const avg=values.reduce((a,b)=>a+b,0)/values.length;document.querySelector('#average').textContent=avg.toFixed(2).replace('.',',');document.querySelector('#gap').textContent=`${Math.max(0,16-avg).toFixed(2).replace('.',',')} point${16-avg>1?'s':''}`;sliders.forEach(s=>s.parentElement.querySelector('output').textContent=String(s.value).replace('.',','))}
sliders.forEach(s=>s.addEventListener('input',updateScore));
navigate(location.hash.slice(1)||'home');
