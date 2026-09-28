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
