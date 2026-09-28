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
function enterSpace(role){
  closeLandingMenu();
  document.body.classList.remove('landing-active');
  let profile;try{profile=JSON.parse(localStorage.getItem('nqtaProfileV2'))}catch{}
  if(!role&&profile&&tracks[profile.track]&&Array.isArray(profile.subjects)){launchApp(profile)}
  else{
    if(role){setup.role=role;setup.step=1;document.querySelectorAll('[data-role]').forEach(button=>button.classList.toggle('selected',button.dataset.role===role))}
    document.querySelector('#onboarding').hidden=false;document.body.classList.add('onboarding-active');syncSetup();
  }
  window.scrollTo(0,0);
}
landing.addEventListener('click',event=>{const button=event.target.closest('[data-enter]');if(button)enterSpace(button.dataset.enterRole)});
const returnButton=document.createElement('button');returnButton.id='returnLanding';returnButton.textContent='Retour à l’accueil';returnButton.addEventListener('click',showLanding);document.querySelector('.onboarding-top').append(returnButton);
const appReturn=returnButton.cloneNode(true);appReturn.removeAttribute('id');appReturn.className='text-btn';appReturn.addEventListener('click',showLanding);document.querySelector('.side-bottom').prepend(appReturn);
const navDescriptions=['Votre point de départ','Votre temps de travail','Vos matières','Sujets officiels','Votre progression','Votre note cible'];
document.querySelectorAll('.nav-copy small').forEach((el,index)=>el.textContent=navDescriptions[index]);
document.querySelector('.nav-goal .nav-copy b').textContent='Objectif Bac';document.querySelector('.profile-orbit b').textContent='N';document.querySelector('.avatar').textContent='N';document.querySelector('.nav-intro span').textContent='2e BAC · MAROC';

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
