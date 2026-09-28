const landing=document.querySelector('#landing');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const menuToggle=document.querySelector('.landing-menu-toggle');
const landingNavigation=document.querySelector('#landingNavigation');
function closeLandingMenu(restoreFocus=false){menuToggle.setAttribute('aria-expanded','false');landingNavigation.classList.remove('is-open');if(restoreFocus)menuToggle.focus()}
menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')!=='true';menuToggle.setAttribute('aria-expanded',String(open));landingNavigation.classList.toggle('is-open',open)});
landingNavigation.addEventListener('click',event=>{if(event.target.closest('a'))closeLandingMenu()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuToggle.getAttribute('aria-expanded')==='true')closeLandingMenu(true)});
document.addEventListener('click',event=>{if(!event.target.closest('.l-header'))closeLandingMenu()});
matchMedia('(min-width: 901px)').addEventListener('change',()=>closeLandingMenu());
function showLanding(){document.body.classList.add('landing-active');history.replaceState(null,'','#welcome');window.scrollTo(0,0)}
landing.querySelectorAll('[data-enter]').forEach(button=>{
  button.disabled=true;
  button.setAttribute('aria-disabled','true');
  button.removeAttribute('data-enter');
  button.removeAttribute('data-enter-role');
});

landing.querySelectorAll('a[href="#billing-faq"]').forEach(link=>link.addEventListener('click',()=>document.querySelector('#billing-faq').open=true));

if('IntersectionObserver' in window&&!reducedMotion.matches){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.08});
  document.querySelectorAll('.l-reveal').forEach(el=>observer.observe(el));landing.classList.add('motion-ready');
  reducedMotion.addEventListener('change',event=>{if(event.matches){landing.classList.remove('motion-ready');observer.disconnect()}});
}
const art=document.querySelector('[data-parallax]');
if(matchMedia('(hover:hover) and (pointer:fine)').matches){
  art.addEventListener('pointermove',event=>{if(reducedMotion.matches)return;const box=art.getBoundingClientRect();art.style.setProperty('--mx',((event.clientX-box.left)/box.width-.5)*10+'px');art.style.setProperty('--my',((event.clientY-box.top)/box.height-.5)*10+'px')});
  art.addEventListener('pointerleave',()=>{art.style.setProperty('--mx','0px');art.style.setProperty('--my','0px')});
}
// Keep direct links to the landing sections usable after a reload.
const initialSection=location.hash;
showLanding();
if(['#approche','#ressources','#profils','#tarifs','#questions','#billing-faq'].includes(initialSection)){
  history.replaceState(null,'',initialSection);
  if(initialSection==='#billing-faq')document.querySelector(initialSection).open=true;
  requestAnimationFrame(()=>document.querySelector(initialSection)?.scrollIntoView({behavior:'instant'}));
}
