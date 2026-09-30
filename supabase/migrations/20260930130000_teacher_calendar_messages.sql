alter table public.teacher_requests add column if not exists scheduled_at timestamptz;
create table if not exists public.teacher_availability (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.teacher_profiles(user_id) on delete cascade,
  weekday integer not null check(weekday between 0 and 6), start_time time not null, end_time time not null,
  active boolean not null default true, created_at timestamptz not null default now(), check(end_time>start_time)
);
create table if not exists public.teacher_request_messages (
  id uuid primary key default gen_random_uuid(), request_id uuid not null references public.teacher_requests(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade, body text not null check(char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);
alter table public.teacher_availability enable row level security;
alter table public.teacher_request_messages enable row level security;
create policy "availability public read" on public.teacher_availability for select using(active or auth.uid()=teacher_id);
create policy "availability teacher manage" on public.teacher_availability for all to authenticated using(auth.uid()=teacher_id) with check(auth.uid()=teacher_id);
create policy "request messages participants read" on public.teacher_request_messages for select to authenticated using(exists(select 1 from public.teacher_requests r where r.id=request_id and auth.uid() in (r.student_id,r.teacher_id)));
create policy "request messages participants create" on public.teacher_request_messages for insert to authenticated with check(auth.uid()=sender_id and exists(select 1 from public.teacher_requests r where r.id=request_id and auth.uid() in (r.student_id,r.teacher_id)));
create or replace function public.notify_request_message() returns trigger language plpgsql security definer set search_path=public as $$ declare v_request public.teacher_requests;v_recipient uuid;begin select * into v_request from public.teacher_requests where id=new.request_id;v_recipient=case when new.sender_id=v_request.student_id then v_request.teacher_id else v_request.student_id end;insert into public.notifications(user_id,title,body,link) values(v_recipient,'Nouveau message',left(new.body,160),'/professor/#requests');return new;end $$;
drop trigger if exists on_request_message_notify on public.teacher_request_messages;create trigger on_request_message_notify after insert on public.teacher_request_messages for each row execute procedure public.notify_request_message();
