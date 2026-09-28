const landing=document.querySelector('#landing');
const checkout=document.createElement('section');
checkout.className='checkout-shell';checkout.hidden=true;checkout.innerHTML=`<div class="checkout-top"><div class="checkout-brand"><img src="assets/noqta-logo.png" alt="Noqta"></div><div class="checkout-steps"><b>1</b><span>Facturation</span><i></i><b>2</b><span>Paiement</span></div><button class="checkout-close" type="button" aria-label="Fermer">×</button></div><div class="checkout-grid"><main><div class="checkout-heading"><span class="checkout-picto"><svg viewBox="0 0 72 72"><path d="M13 14h46v44H13zM13 25h46M23 37h17M23 46h11"/><path class="picto-fill" d="M47 35 60 48 47 61 34 48z"/><circle cx="47" cy="48" r="4"/></svg></span><div><span class="billing-kicker">PAIEMENT AU MAROC</span><h2>Comment souhaites-tu payer ?</h2><p>Choisis une option. Tes coordonnées bancaires ne seront jamais saisies sur Noqta.</p></div></div><div class="payment-methods"><button type="button" data-payment="card"><span class="method-logo card-logos"><img src="https://www.lavieeco.com/wp-content/uploads/2023/07/Logo_CMI-VA-01-scaled.jpg" alt="CMI"><b>VISA</b><b>mastercard.</b></span><span class="method-copy"><b>Carte bancaire</b><small>Redirection vers le paiement sécurisé CMI</small></span><i>›</i></button><button type="button" data-payment="wafacash"><span class="method-logo"><img src="https://seeklogo.com/images/W/wafacash-logo-D49B08BFA6-seeklogo.com.png" alt="Wafacash"></span><span class="method-copy"><b>Payer chez Wafacash</b><small>Reçois une référence et règle en agence</small></span><i>›</i></button><button type="button" data-payment="barid"><span class="method-logo"><img src="https://cdn.remitly.com/images/v1/img/image_1_tue_nov_29_2022.UmZxx0nxJbVZyuGo.png" alt="Barid Cash"></span><span class="method-copy"><b>Payer chez Barid Cash</b><small>Reçois une référence et règle en agence</small></span><i>›</i></button><button type="button" data-payment="transfer"><span class="method-logo noqta-transfer"><svg viewBox="0 0 48 48"><path d="M7 18h34L24 8zM11 21v14M19 21v14M29 21v14M37 21v14M7 38h34"/><path d="m32 28 5 5 7-9"/></svg></span><span class="method-copy"><b>Virement bancaire</b><small>Depuis ton application ou ton agence bancaire</small></span><i>›</i></button></div><div class="billing-fields"><label>Nom complet<input required autocomplete="name"></label><label>Email de confirmation<input required type="email" autocomplete="email"></label><label>Téléphone marocain<input required type="tel" placeholder="+212 6…" autocomplete="tel"></label></div><div class="merchant-note"><b>Configuration finale en attente</b><p>Les tarifs et identifiants marchands doivent être ajoutés avant l’encaissement.</p></div><button class="billing-submit" type="submit" disabled>Continuer vers le paiement <span>→</span></button><div class="checkout-trust"><span>🔒 Paiement chiffré</span><span>🇲🇦 En dirhams marocains</span><span>✓ Confirmation par email</span></div></main><aside><span class="billing-kicker">TA COMMANDE</span><h3>Noqta <em id="checkoutPlan">Essentiel</em></h3><div class="order-visual"><svg viewBox="0 0 120 120"><path d="M18 31c17-10 31-7 42 5v62c-11-11-25-14-42-7zM102 31c-17-10-31-7-42 5v62c11-11 25-14 42-7zM60 36v62"/><path d="M31 48h18M31 59h18M71 48h18M71 59h18"/></svg></div><div class="invoice-line"><span>Abonnement</span><b id="invoicePlan">Essentiel</b></div><div class="invoice-line"><span>Prix</span><b>À confirmer</b></div><div class="invoice-total"><span>Total à payer</span><b>— MAD</b></div><small>Aucun débit ne sera effectué aujourd’hui.</small></aside></div>`;document.body.append(checkout);
let paymentMethod='';
document.querySelectorAll('.plan-button').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();const plan=button.textContent.replace('Choisir','').replace('↗','').trim();checkout.querySelector('#checkoutPlan').textContent=plan;checkout.querySelector('#invoicePlan').textContent=plan;checkout.hidden=false;document.body.style.overflow='hidden'}));
checkout.querySelector('.checkout-close').addEventListener('click',()=>{checkout.hidden=true;document.body.style.overflow=''});
checkout.querySelectorAll('[data-payment]').forEach(button=>button.addEventListener('click',()=>{paymentMethod=button.dataset.payment;checkout.querySelectorAll('[data-payment]').forEach(x=>x.classList.toggle('selected',x===button));checkout.querySelector('.merchant-note').classList.add('visible')}));
checkout.querySelector('#checkoutForm').addEventListener('submit',event=>event.preventDefault());
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
// Authentication and onboarding entry points are wired by app.js.

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
const orbitScroll=document.querySelector('[data-orbit-scroll]');
const orbitCards=[...document.querySelectorAll('[data-orbit-card]')];
const orbitStage=orbitScroll?.querySelector('.orbit-sticky');
const orbitCenter=orbitScroll?.querySelector('.orbit-center');
let orbitFrame=0;
function updateOrbitCards(){
  orbitFrame=0;
  if(!orbitScroll)return;
  if(innerWidth<=620){orbitCards.forEach(card=>{card.style.removeProperty('--p');card.style.removeProperty('transform')});orbitCenter.style.removeProperty('opacity');return}
  const rect=orbitScroll.getBoundingClientRect();
  const distance=Math.max(1,orbitScroll.offsetHeight-innerHeight);
  const progress=reducedMotion.matches?1:Math.min(1,Math.max(0,-rect.top/distance));
  const morph=Math.min(1,progress/.76);
  const radiusX=Math.min(orbitStage.clientWidth*.34,390);
  const radiusY=Math.min(orbitStage.clientHeight*.30,220);
  const finalX=[-170,170,-170,170];
  const finalY=[-125,-125,125,125];
  orbitCards.forEach((card,index)=>{
    const angle=(-45+index*90)*Math.PI/180;
    const circleX=Math.cos(angle)*radiusX;
    const circleY=Math.sin(angle)*radiusY;
    const x=circleX+(finalX[index]-circleX)*morph;
    const y=circleY+(finalY[index]-circleY)*morph;
    const rotation=(index%2?-7:7)*(1-morph);
    const lift=Math.sin(progress*Math.PI)*((index%2?1:-1)*8);
    card.style.setProperty('--p',morph.toFixed(3));
    card.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y+lift}px,0) rotate(${rotation}deg)`;
  });
  orbitStage.style.setProperty('--orbit-progress',progress.toFixed(3));
  orbitCenter.style.opacity=String(Math.max(.08,1-morph*1.45));
}
function requestOrbitUpdate(){if(!orbitFrame)orbitFrame=requestAnimationFrame(updateOrbitCards)}
if(orbitScroll){addEventListener('scroll',requestOrbitUpdate,{passive:true});addEventListener('resize',requestOrbitUpdate);updateOrbitCards()}
// Keep direct links to the landing sections usable after a reload.
const initialSection=location.hash;
showLanding();
if(['#approche','#ressources','#tarifs','#questions','#billing-faq'].includes(initialSection)){
  history.replaceState(null,'',initialSection);
  if(initialSection==='#billing-faq')document.querySelector(initialSection).open=true;
  requestAnimationFrame(()=>document.querySelector(initialSection)?.scrollIntoView({behavior:'instant'}));
}
