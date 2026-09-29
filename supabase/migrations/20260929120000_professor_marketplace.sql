create table if not exists public.teacher_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text not null,
  bio text not null default '',
  city text not null default '',
  experience_years integer not null default 0 check(experience_years between 0 and 60),
  languages text[] not null default array['Français'],
  verification_status text not null default 'pending' check(verification_status in ('pending','verified','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_offers (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teacher_profiles(user_id) on delete cascade,
  subject_id text not null references public.subjects(id),
  chapter_id uuid not null references public.chapters(id),
  title text not null check(char_length(title) between 12 and 100),
  description text not null check(char_length(description) between 30 and 800),
  method text not null check(method in ('visual','steps','bac','darija')),
  language text not null default 'Français',
  token_price integer not null check(token_price between 50 and 500),
  duration_minutes integer not null check(duration_minutes between 10 and 15),
  video_path text,
  status text not null default 'draft' check(status in ('draft','pending','published','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_offer_favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.teacher_offers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,offer_id)
);

create table if not exists public.teacher_watch_history (
  user_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.teacher_offers(id) on delete cascade,
  watched_seconds integer not null default 0 check(watched_seconds >= 0),
  last_watched_at timestamptz not null default now(),
  primary key(user_id,offer_id)
);

alter table public.teacher_profiles enable row level security;
alter table public.teacher_offers enable row level security;
alter table public.teacher_offer_favorites enable row level security;
alter table public.teacher_watch_history enable row level security;

create policy "teacher profiles public read" on public.teacher_profiles for select using(verification_status='verified' or auth.uid()=user_id);
create policy "teacher profile own insert" on public.teacher_profiles for insert to authenticated with check(auth.uid()=user_id);
create policy "teacher profile own update" on public.teacher_profiles for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "offers published or own read" on public.teacher_offers for select using(status='published' or auth.uid()=teacher_id);
create policy "offers own insert" on public.teacher_offers for insert to authenticated with check(auth.uid()=teacher_id);
create policy "offers own update" on public.teacher_offers for update to authenticated using(auth.uid()=teacher_id) with check(auth.uid()=teacher_id);
create policy "offers own delete" on public.teacher_offers for delete to authenticated using(auth.uid()=teacher_id and status in ('draft','rejected'));
create policy "favorites own" on public.teacher_offer_favorites for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "history own" on public.teacher_watch_history for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "admin teacher profiles read" on public.teacher_profiles for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admin teacher profiles update" on public.teacher_profiles for update to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admin offers read" on public.teacher_offers for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "admin offers update" on public.teacher_offers for update to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('teacher-videos','teacher-videos',false,262144000,array['video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=false,file_size_limit=262144000,allowed_mime_types=array['video/mp4','video/webm','video/quicktime'];
create policy "teacher video own read" on storage.objects for select to authenticated using(bucket_id='teacher-videos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "teacher video own insert" on storage.objects for insert to authenticated with check(bucket_id='teacher-videos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "teacher video own update" on storage.objects for update to authenticated using(bucket_id='teacher-videos' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='teacher-videos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "teacher video own delete" on storage.objects for delete to authenticated using(bucket_id='teacher-videos' and (storage.foldername(name))[1]=auth.uid()::text);
