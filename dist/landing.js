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

let previewTrack='Sciences Maths';
const journeyContent=[
  {title:'Le bon parcours commence par toi.',text:'Une filière, des matières, ton propre point de départ. Essaie de choisir une filière dans cet aperçu.',link:'Choisir ma filière',href:'#',visual:()=>'<span class="visual-label">APERÇU · MA FILIÈRE</span><div class="track-options">'+['Sciences Maths','Sciences Physiques','SVT'].map(name=>'<button data-track-preview="'+name+'" aria-pressed="'+(name===previewTrack)+'">'+name+'</button>').join('')+'</div><p class="track-choice-feedback" aria-live="polite">'+previewTrack+' · sélection de démonstration</p>'},
  {title:'Une notion. Puis le lien se crée.',text:'Cours structurés, résumés et exemples : chaque chapitre reprend l’essentiel avant de passer à la pratique.',link:'Découvrir les cours',href:'#ressources',visual:()=>'<span class="visual-label">DANS CHAQUE CHAPITRE</span><div class="visual-steps"><span>Le cours</span><i>→</i><span>L’exemple</span><i>→</i><span>Le résumé</span></div>'},
  {title:'C’est en s’entraînant que ça se précise.',text:'Exercices progressifs, corrigés détaillés et annales : tu pratiques, puis tu comprends chaque étape de la méthode.',link:'Voir les ressources',href:'#ressources',visual:()=>'<span class="visual-label">UNE PRÉPARATION COMPLÈTE</span><div class="visual-steps"><span>Exercices</span><i>→</i><span>Corrigés</span><i>→</i><span>Annales</span></div>'},
  {title:'Des repères. Pas des chiffres inventés.',text:'Le suivi sera construit à partir des réponses réelles. Pour le moment, aucune note ni progression n’est calculée par Noqta.',link:'Ce qui est disponible',href:'#questions',visual:()=>'<span class="visual-label">LE SUIVI ENVISAGÉ · À VENIR</span><div class="progress-example"><span><b>—</b>Compris</span><span><b>—</b>À pratiquer</span><span><b>—</b>À revoir</span></div>'}
];
function renderJourney(index){
  const content=journeyContent[index];const panel=document.querySelector('#journeyPanel');
  document.querySelectorAll('[data-journey]').forEach((button,i)=>{button.setAttribute('aria-selected',String(i===index));button.tabIndex=i===index?0:-1});
  panel.dataset.step=index;panel.setAttribute('aria-labelledby','journey-tab-'+index);
  panel.innerHTML='<div><span class="panel-kicker">Étape 0'+(index+1)+' / 04</span><h3>'+content.title+'</h3><p>'+content.text+'</p>'+(index===0?'<button class="panel-link" style="background:none;border-width:0 0 1px" data-enter>'+content.link+' <span aria-hidden="true">↗</span></button>':'<a class="panel-link" href="'+content.href+'">'+content.link+' <span aria-hidden="true">↗</span></a>')+'</div><div class="journey-visual">'+content.visual()+'</div>';
}
document.querySelectorAll('[data-journey]').forEach(button=>button.addEventListener('click',()=>renderJourney(Number(button.dataset.journey))));
document.querySelector('#journeyPanel').addEventListener('click',event=>{const button=event.target.closest('[data-track-preview]');if(!button)return;previewTrack=button.dataset.trackPreview;document.querySelectorAll('[data-track-preview]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelector('.track-choice-feedback').textContent=previewTrack+' · sélection de démonstration'});

function renderAudience(role){
  const teacher=role==='teacher';const panel=document.querySelector('#audiencePanel');
  document.querySelectorAll('[data-audience]').forEach(button=>{const active=button.dataset.audience===role;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1});
  panel.dataset.role=role;panel.setAttribute('aria-labelledby','audience-'+role);
  const title=teacher?'Faire grandir<br><em>les déclics.</em>':'Ton Bac.<br><em>Ton point de départ.</em>';
  const description=teacher?'Préparez votre profil et vos matières. La gestion des classes et des devoirs sera reliée au LMS dans une prochaine étape.':'Commence par choisir ta filière et tes matières. Un espace à ton image, sans résultats fictifs ni note imposée.';
  const rows=teacher?['Établissement & classe','Matières enseignées','Devoirs & suivi — à venir']:['Ma filière','Mes matières','Mon diagnostic — à venir'];
  panel.innerHTML='<div class="audience-copy"><span>'+ (teacher?'CÔTÉ PROFESSEUR':'CÔTÉ ÉLÈVE')+'</span><h3>'+title+'</h3><p>'+description+'</p><button class="l-button" data-enter data-enter-role="'+role+'">'+(teacher?'Configurer mon profil professeur':'Configurer mon profil élève')+' <span aria-hidden="true">↗</span></button><small>Configuration locale uniquement. Aucun compte en ligne créé.</small></div><div class="audience-preview"><div class="notebook"><header><span>noqta. / '+(teacher?'TRANSMETTRE':'APPRENDRE')+'</span><span>APERÇU</span></header><h4>'+ (teacher?'Un cadre pour accompagner.':'Une place pour commencer.')+'</h4><ul>'+rows.map((row,i)=>'<li><span>0'+(i+1)+'</span>'+row+'</li>').join('')+'</ul><p>Illustration du parcours, sans données élèves ni résultats de démonstration.</p></div></div>';
}
document.querySelectorAll('[data-audience]').forEach(button=>button.addEventListener('click',()=>renderAudience(button.dataset.audience)));
function keyboardTabs(container,selector,select){
  container.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const buttons=[...container.querySelectorAll(selector)];let index=buttons.indexOf(document.activeElement);if(index<0)return;
    event.preventDefault();index=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length;
    select(buttons[index]);buttons[index].focus();
  });
}
keyboardTabs(document.querySelector('.journey-track'),'[data-journey]',button=>renderJourney(Number(button.dataset.journey)));
keyboardTabs(document.querySelector('.audience-tabs'),'[data-audience]',button=>renderAudience(button.dataset.audience));
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
renderJourney(0);renderAudience('student');
// Keep direct links to the landing sections usable after a reload.
const initialSection=location.hash;
showLanding();
if(['#approche','#ressources','#profils','#tarifs','#questions','#billing-faq'].includes(initialSection)){
  history.replaceState(null,'',initialSection);
  if(initialSection==='#billing-faq')document.querySelector(initialSection).open=true;
  requestAnimationFrame(()=>document.querySelector(initialSection)?.scrollIntoView({behavior:'instant'}));
}
