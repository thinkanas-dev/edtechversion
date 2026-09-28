(()=>{
  const cfg=window.NOQTA_SUPABASE;
  if(!cfg||!window.supabase)return;
  const db=window.supabase.createClient(cfg.url,cfg.key);
  const authShell=document.querySelector('#authShell');
  const onboarding=document.querySelector('#onboarding');
  const app=document.querySelector('.app-shell');
  const authForm=document.querySelector('#authForm');
  const authMessage=document.querySelector('#authMessage');
  let mode='signin',session=null,step=1;
  const state={role:'student',track:'',subjects:[],city:'',school:''};

  function setSurface(name){
    document.body.classList.toggle('landing-active',name==='landing');
    document.querySelector('#landing').hidden=name!=='landing';
    authShell.hidden=name!=='auth';onboarding.hidden=name!=='onboarding';app.style.display=name==='app'?'grid':'none';
    scrollTo(0,0);
  }
  function openAuth(){setSurface('auth');authForm.querySelector('input:not([hidden])')?.focus()}
  document.querySelectorAll('[data-auth-open],[data-enter]').forEach(el=>el.addEventListener('click',openAuth));
  document.querySelector('[data-auth-close]').addEventListener('click',()=>setSurface('landing'));
  document.querySelectorAll('[data-auth-mode]').forEach(btn=>btn.addEventListener('click',()=>{
    mode=btn.dataset.authMode;document.querySelectorAll('[data-auth-mode]').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('.signup-only').forEach(x=>x.hidden=mode!=='signup');
    document.querySelector('#authPassword').autocomplete=mode==='signup'?'new-password':'current-password';
    authForm.querySelector('.auth-submit').innerHTML=mode==='signup'?'Créer mon compte <span>→</span>':'Se connecter <span>→</span>';
    authMessage.textContent='';
  }));
  authForm.addEventListener('submit',async event=>{
    event.preventDefault();authMessage.textContent='Connexion…';
    const email=document.querySelector('#authEmail').value.trim(),password=document.querySelector('#authPassword').value;
    let result;
    if(mode==='signup') result=await db.auth.signUp({email,password,options:{data:{full_name:document.querySelector('#authName').value.trim(),role:'student'},emailRedirectTo:location.origin}});
    else result=await db.auth.signInWithPassword({email,password});
    if(result.error){authMessage.textContent=result.error.message;return}
    if(!result.data.session){authMessage.textContent='Compte créé. Vérifie ton email puis reviens te connecter.';return}
    session=result.data.session;await routeSession();
  });
  document.querySelector('[data-forgot]').addEventListener('click',async()=>{
    const email=document.querySelector('#authEmail').value.trim();
    if(!email){authMessage.textContent='Entre d’abord ton adresse email.';return}
    const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
    authMessage.textContent=error?error.message:'Lien de réinitialisation envoyé.';
  });

  async function routeSession(){
    if(!session)return setSurface('landing');
    const {data:profile}=await db.from('profiles').select('*').eq('id',session.user.id).maybeSingle();
    if(profile?.onboarding_complete){await hydrateApp(profile);setSurface('app')}else{prepareOnboarding(profile);setSurface('onboarding')}
  }

  function prepareOnboarding(profile){
    step=1;state.role=profile?.role||'student';state.track=profile?.track||'';state.subjects=[];
    renderTracks();renderSubjects();renderStep();
  }
  function renderTracks(){
    const tracks=[['sm','Sciences Maths','Maths · Physique'],['pc','Sciences Physiques','Physique · Maths · SVT'],['svt','SVT','SVT · Physique · Maths']];
    document.querySelector('#trackGrid').innerHTML=tracks.map(([id,title,sub])=>`<button type="button" class="setup-choice" data-track="${id}"><span class="level-mark">${id.toUpperCase()}</span><b>${title}</b><small>${sub}</small></button>`).join('');
    document.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>{state.track=b.dataset.track;document.querySelectorAll('[data-track]').forEach(x=>x.classList.toggle('selected',x===b));syncNext()}));
  }
  async function renderSubjects(){
    const {data=[]}=await db.from('subjects').select('*').order('sort_order');
    document.querySelector('#subjectGrid').innerHTML=data.map(s=>`<button type="button" class="setup-choice" data-subject-id="${s.id}"><span class="subject-dot" style="background:${s.color}"></span><b>${s.name_fr}</b><small>${s.name_ar}</small></button>`).join('');
    document.querySelectorAll('[data-subject-id]').forEach(b=>b.addEventListener('click',()=>{
      const id=b.dataset.subjectId,has=state.subjects.includes(id);
      if(has)state.subjects=state.subjects.filter(x=>x!==id);else if(state.subjects.length<2)state.subjects.push(id);else return showToast('Essentiel comprend deux matières au choix.');
      b.classList.toggle('selected',!has);syncNext();
    }));
  }
  document.querySelectorAll('[data-role]').forEach(b=>b.addEventListener('click',()=>{state.role=b.dataset.role;document.querySelectorAll('[data-role]').forEach(x=>x.classList.toggle('selected',x===b));syncNext()}));
  document.querySelector('[data-level]')?.addEventListener('click',event=>{event.currentTarget.classList.add('selected');syncNext()});
  document.querySelector('#setupBack').addEventListener('click',()=>{if(step>1){step--;renderStep()}else setSurface('landing')});
  document.querySelector('#setupNext').addEventListener('click',async()=>{if(step<5){step++;renderStep()}else await finishOnboarding()});
  function validStep(){return step===1?!!state.role:step===2?true:step===3?!!state.track:step===4?state.subjects.length===2:true}
  function syncNext(){const b=document.querySelector('#setupNext');b.disabled=!validStep();b.innerHTML=step===5?'Créer mon espace Essentiel <span>→</span>':'Continuer <span>→</span>'}
  function renderStep(){document.querySelectorAll('.setup-panel').forEach(p=>p.classList.toggle('active',Number(p.dataset.step)===step));document.querySelector('#stepCount').textContent=`${step}/5`;document.querySelector('#setupProgress').style.width=`${step*20}%`;syncNext()}
  async function finishOnboarding(){
    const next=document.querySelector('#setupNext');next.disabled=true;next.textContent='Création…';
    const payload={id:session.user.id,full_name:session.user.user_metadata.full_name||'',role:state.role,track:state.track,city:document.querySelector('#schoolCity').value.trim(),school:document.querySelector('#schoolName').value.trim(),onboarding_complete:true,plan:'essential',updated_at:new Date().toISOString()};
    const {error}=await db.from('profiles').upsert(payload);if(error)return showToast(error.message);
    await db.from('user_subjects').delete().eq('user_id',session.user.id);
    const {error:subjectError}=await db.from('user_subjects').insert(state.subjects.map(subject_id=>({user_id:session.user.id,subject_id})));
    if(subjectError)return showToast(subjectError.message);
    await hydrateApp(payload);setSurface('app');
  }
  async function hydrateApp(profile){
    const {data:chosen=[]}=await db.from('user_subjects').select('subject_id,subjects(name_fr)').eq('user_id',session.user.id);
    const first=(profile.full_name||session.user.email).split(' ')[0];
    document.querySelectorAll('.profile-mini>div>b').forEach(x=>x.textContent=profile.full_name||first);
    document.querySelectorAll('.profile-mini>div>small,.crumb>b').forEach(x=>x.textContent=`${profile.track?.toUpperCase()||'2e Bac'} · Essentiel`);
    const greeting=document.querySelector('.greeting .eyebrow');if(greeting)greeting.textContent=`BONSOIR ${first.toUpperCase()}`;
    const tabs=document.querySelector('.subject-tabs');if(tabs&&chosen.length)tabs.innerHTML=chosen.map((x,i)=>`<button class="${i?'':'active'}">${x.subjects?.name_fr||x.subject_id}</button>`).join('');
    const ids=chosen.map(x=>x.subject_id);
    document.querySelectorAll('.nav-session,.nav-level,.nav-goal').forEach(x=>x.hidden=true);
    document.querySelectorAll('[data-page="today"],[data-page="progress"],[data-page="score"]').forEach(x=>x.remove());
    const home=document.querySelector('[data-page="home"]');
    if(home)home.innerHTML=`<div class="library-head"><div><span class="eyebrow">BIBLIOTHÈQUE ESSENTIEL</span><h1>Ton programme.<br><em>Sans données inventées.</em></h1><p>Les intitulés suivent le programme marocain de 2e Bac. Les ressources apparaissent seulement lorsqu’elles sont réellement publiées.</p></div><div class="source-seal"><span>RÉFÉRENCE</span><b>Cadre national</b><a href="https://nawafid.ma/docs/bac2/cadreref/CDR%20EXAM%20NAT%20BAC%20MATH%20SM%20A%26B%20Op%20FR%202022.pdf" target="_blank" rel="noopener">Consulter le document ↗</a></div></div><div class="library-door"><div><span>01</span><h2>Cours par matière</h2><p>Chaque chapitre ouvre son étagère : cours, contenu, exercices, examen blanc et annales.</p></div><button class="primary" data-route="learn">Ouvrir la bibliothèque <span>→</span></button></div><div class="truth-note"><b>Ce que Noqta affiche</b><p>Uniquement le catalogue pédagogique et les fichiers effectivement présents. Aucun score, objectif, pourcentage ou activité de démonstration.</p></div>`;
    const learn=document.querySelector('[data-page="learn"]');
    if(learn)learn.querySelector('.page-head').innerHTML=`<div><span class="eyebrow">PROGRAMME · 2e BAC MAROC</span><h1>Tous les chapitres,<br><em>rangés par matière.</em></h1><p>Sélectionne une matière puis ouvre les ressources disponibles pour chaque cours.</p></div><a class="outline source-link" href="https://nawafid.ma/docs/bac2/cadreref/CDR%20EXAM%20NAT%20BAC%20MATH%20SM%20A%26B%20Op%20FR%202022.pdf" target="_blank" rel="noopener">Cadre de référence ↗</a>`;
    const annales=document.querySelector('[data-page="annales"]');
    if(annales)annales.innerHTML=`<div class="page-head"><div><span class="eyebrow">ANNALES & EXAMENS BLANCS</span><h1>Les vrais sujets.<br><em>Quand ils sont vérifiés.</em></h1><p>Aucun faux examen n’est affiché. Les sujets et corrigés seront publiés ici après vérification de leur source.</p></div></div><div class="empty-library"><span>ARCHIVE EN CONSTRUCTION</span><h2>Aucune annale vérifiée publiée pour le moment.</h2><p>Les boutons Sujet PDF et Corrigé apparaîtront uniquement avec un fichier réel et sa provenance.</p></div>`;
    if(ids.length){
      const [{data:chapters=[]},{data:exams=[]}]=await Promise.all([
        db.from('chapters').select('id,title,summary,subject_id,lessons(id,title,duration_minutes)').in('subject_id',ids).order('position'),
        db.from('exams').select('*').in('subject_id',ids).order('exam_year',{ascending:false})
      ]);
      const grid=document.querySelector('.chapter-grid');
      const subjectName=Object.fromEntries(chosen.map(x=>[x.subject_id,x.subjects?.name_fr||x.subject_id]));
      const paint=active=>{if(grid)grid.innerHTML=chapters.filter(c=>!active||c.subject_id===active).map((c,index)=>`<article class="chapter library-book"><div class="book-spine"><span>${String(index+1).padStart(2,'0')}</span><small>${subjectName[c.subject_id]||''}</small></div><div class="book-body"><h3>${c.title}</h3><p>${c.summary||'Chapitre du programme national.'}</p><div class="resource-actions"><button class="resource-action" ${c.lessons?.[0]?.id?`data-lesson="${c.lessons[0].id}"`:'disabled'}>Cours PDF</button><button class="resource-action" ${c.lessons?.[0]?.id?`data-lesson="${c.lessons[0].id}"`:'disabled'}>Contenu</button><button class="resource-action" disabled>Exercices</button><button class="resource-action" disabled>Examen blanc</button><button class="resource-action" data-route="annales">Annales</button></div></div></article>`).join('')||'<div class="empty-library"><h2>Aucun cours publié pour cette matière.</h2></div>'};
      function bindLibrary(){document.querySelectorAll('[data-lesson]').forEach(button=>button.addEventListener('click',()=>showToast('Le contenu de ce cours sera publié ici.')));document.querySelectorAll('.resource-actions [data-route]').forEach(button=>button.addEventListener('click',()=>document.querySelector('.nav-annales')?.click()))}
      paint(ids[0]);bindLibrary();
      tabs?.querySelectorAll('button').forEach((button,index)=>button.addEventListener('click',()=>{tabs.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===button));paint(ids[index]);bindLibrary()}));
      const list=document.querySelector('.exam-list');
      if(list)list.innerHTML=exams.map(e=>`<article><div class="exam-year">${e.exam_year}</div><div><span class="chip">SESSION ${e.session.toUpperCase()}</span><h3>${e.title}</h3><p>${Math.round(e.duration_minutes/60)} h · Sujet et correction</p></div><div class="exam-actions"><button data-exam="${e.id}">Commencer</button><button class="dark" ${e.correction_url?`onclick="open('${e.correction_url}','_blank')"`:'disabled'}>Correction →</button></div></article>`).join('')||'<p>Aucune annale publiée pour ces matières.</p>';
      document.querySelectorAll('[data-exam]').forEach(button=>button.addEventListener('click',async()=>{await db.from('exam_attempts').insert({user_id:session.user.id,exam_id:button.dataset.exam});showToast('Tentative enregistrée. Bon courage !')}));
    }
  }

  document.querySelectorAll('[data-route]').forEach(btn=>btn.addEventListener('click',()=>{
    const route=btn.dataset.route;document.querySelectorAll('[data-page]').forEach(p=>p.classList.toggle('active',p.dataset.page===route));
    document.querySelectorAll('.nav-item,.mobile-nav button').forEach(x=>x.classList.toggle('active',x.dataset.route===route));scrollTo(0,0);
  }));
  document.querySelectorAll('[data-toast]').forEach(btn=>btn.addEventListener('click',()=>showToast(btn.dataset.toast)));
  document.querySelectorAll('.score-inputs input').forEach(input=>input.addEventListener('input',()=>{input.nextElementSibling.value=input.value;const vals=[...document.querySelectorAll('.score-inputs input')].map(x=>+x.value);document.querySelector('#average').textContent=(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2).replace('.',',')}));
  document.querySelector('.profile-mini')?.addEventListener('click',async()=>{await db.auth.signOut();session=null;setSurface('landing')});
  function showToast(message){const t=document.querySelector('.toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
  db.auth.onAuthStateChange((_event,current)=>{session=current;setTimeout(routeSession,0)});
  db.auth.getSession().then(({data})=>{session=data.session;if(session)routeSession()});
})();
