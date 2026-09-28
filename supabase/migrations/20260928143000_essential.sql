create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','teacher','admin')),
  city text,
  school text,
  track text,
  bac_year integer not null default 2027,
  target_score numeric(4,2),
  daily_minutes integer,
  onboarding_complete boolean not null default false,
  plan text not null default 'essential' check (plan in ('essential','plus','pro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id text primary key,
  name_fr text not null,
  name_ar text not null,
  color text not null default '#d8ff6a',
  sort_order integer not null default 0
);

create table public.user_subjects (
  user_id uuid not null references public.profiles(id) on delete cascade,
  subject_id text not null references public.subjects(id),
  selected_at timestamptz not null default now(),
  primary key (user_id, subject_id)
);

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id),
  title text not null,
  summary text not null default '',
  position integer not null default 0,
  published boolean not null default true
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  title text not null,
  content text not null default '',
  duration_minutes integer not null default 20,
  position integer not null default 0,
  published boolean not null default true
);

create table public.exams (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references public.subjects(id),
  title text not null,
  exam_year integer not null,
  session text not null default 'normale',
  duration_minutes integer not null default 240,
  subject_url text,
  correction_url text,
  published boolean not null default true
);

create table public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  progress integer not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  score numeric(5,2),
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.user_subjects enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.subjects enable row level security;
alter table public.chapters enable row level security;
alter table public.lessons enable row level security;
alter table public.exams enable row level security;

create policy "profile own" on public.profiles for all using (auth.uid()=id) with check (auth.uid()=id);
create policy "subjects public read" on public.subjects for select using (true);
create policy "chapters public read" on public.chapters for select using (published);
create policy "lessons entitled read" on public.lessons for select using (
  published and exists(select 1 from public.chapters c join public.user_subjects us on us.subject_id=c.subject_id where c.id=chapter_id and us.user_id=auth.uid())
);
create policy "exams entitled read" on public.exams for select using (
  published and exists(select 1 from public.user_subjects us where us.subject_id=exams.subject_id and us.user_id=auth.uid())
);
create policy "own subjects read" on public.user_subjects for select using (auth.uid()=user_id);
create policy "own subjects insert" on public.user_subjects for insert with check (auth.uid()=user_id and (select count(*) from public.user_subjects where user_id=auth.uid()) < 2);
create policy "own subjects delete" on public.user_subjects for delete using (auth.uid()=user_id);
create policy "own lesson progress" on public.lesson_progress for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own exam attempts" on public.exam_attempts for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),coalesce(new.raw_user_meta_data->>'role','student'));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.subjects(id,name_fr,name_ar,color,sort_order) values
('math','Mathématiques','الرياضيات','#d8ff6a',1),('physics','Physique-Chimie','الفيزياء والكيمياء','#c9b9f3',2),
('svt','Sciences de la vie et de la Terre','علوم الحياة والأرض','#bdebd5',3),('philosophy','Philosophie','الفلسفة','#ffc999',4),
('english','Anglais','الإنجليزية','#b9dcff',5),('arabic','Arabe','العربية','#ffd4cf',6)
on conflict do nothing;

with c as (insert into public.chapters(subject_id,title,summary,position) values
('math','Suites numériques','Limites, monotonie et convergence.',1),('math','Limites et continuité','Étudier les fonctions avec méthode.',2),
('physics','Mécanique','Mouvement, forces et énergie.',1),('physics','Électricité','Circuits et dipôles.',2)
returning id,subject_id,title)
insert into public.lessons(chapter_id,title,content,duration_minutes,position)
select id, case when title='Suites numériques' then 'Comprendre la convergence' when title='Limites et continuité' then 'Calculer une limite' when title='Mécanique' then 'Faire le bilan des forces' else 'Analyser un circuit' end,
'Cours structuré Noqta : objectif, méthode, exemple guidé, erreurs fréquentes et exercice de vérification.',25,1 from c;

insert into public.exams(subject_id,title,exam_year,session) values
('math','Examen national — Mathématiques',2025,'normale'),('math','Examen national — Mathématiques',2024,'rattrapage'),
('physics','Examen national — Physique-Chimie',2025,'normale'),('physics','Examen national — Physique-Chimie',2024,'rattrapage');
