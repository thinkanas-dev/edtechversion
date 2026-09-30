create table if not exists public.teacher_requests (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.teacher_profiles(user_id) on delete cascade,
  offer_id uuid references public.teacher_offers(id) on delete set null,
  request_type text not null check(request_type in ('question','session')),
  message text not null check(char_length(message) between 10 and 600),
  status text not null default 'pending' check(status in ('pending','accepted','declined','answered')),
  teacher_reply text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.teacher_requests enable row level security;
create policy "student own requests read" on public.teacher_requests for select to authenticated using(auth.uid()=student_id);
create policy "student request create" on public.teacher_requests for insert to authenticated with check(auth.uid()=student_id and status='pending');
create policy "teacher incoming requests read" on public.teacher_requests for select to authenticated using(auth.uid()=teacher_id);
create policy "teacher incoming requests update" on public.teacher_requests for update to authenticated using(auth.uid()=teacher_id) with check(auth.uid()=teacher_id);
create or replace function public.notify_teacher_request() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.notifications(user_id,title,body,link) values(new.teacher_id,'Nouvelle demande élève',case when new.request_type='session' then 'Un élève demande une session.' else 'Un élève a posé une question.' end,'/professor/');return new;end $$;
drop trigger if exists on_teacher_request_notify on public.teacher_requests;create trigger on_teacher_request_notify after insert on public.teacher_requests for each row execute procedure public.notify_teacher_request();
