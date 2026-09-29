alter table public.teacher_profiles add column if not exists public_story text not null default '';
alter table public.teacher_profiles add column if not exists teaching_signature text not null default '';
alter table public.teacher_profiles add column if not exists achievements text not null default '';
alter table public.teacher_profiles add column if not exists credentials text not null default '';
alter table public.teacher_profiles add column if not exists photo_path text;

create table if not exists public.teacher_offer_reviews (
  id uuid primary key default gen_random_uuid(), purchase_id uuid not null unique references public.teacher_offer_purchases(id) on delete cascade,
  offer_id uuid not null references public.teacher_offers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check(rating between 1 and 5), body text not null check(char_length(body) between 10 and 500),
  status text not null default 'published' check(status in ('published','hidden')), created_at timestamptz not null default now()
);
alter table public.teacher_offer_reviews enable row level security;
create policy "reviews public read" on public.teacher_offer_reviews for select using(status='published' or auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "purchases admin read" on public.teacher_offer_purchases for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create or replace function public.submit_teacher_review(p_purchase uuid,p_rating integer,p_body text) returns uuid language plpgsql security definer set search_path=public as $$ declare v_purchase public.teacher_offer_purchases;v_id uuid;begin select * into v_purchase from public.teacher_offer_purchases where id=p_purchase and buyer_id=auth.uid();if not found then raise exception 'Achat vérifié requis';end if;if p_rating not between 1 and 5 or char_length(trim(p_body)) not between 10 and 500 then raise exception 'Avis invalide';end if;insert into public.teacher_offer_reviews(purchase_id,offer_id,user_id,rating,body) values(p_purchase,v_purchase.offer_id,auth.uid(),p_rating,trim(p_body)) returning id into v_id;return v_id;end $$;
revoke all on function public.submit_teacher_review(uuid,integer,text) from public;grant execute on function public.submit_teacher_review(uuid,integer,text) to authenticated;

create policy "withdrawals admin update" on public.withdrawal_requests for update to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create or replace function public.process_teacher_withdrawal(p_request uuid,p_status text) returns void language plpgsql security definer set search_path=public as $$ declare v public.withdrawal_requests;begin if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Accès administrateur requis';end if;if p_status not in ('approved','paid','rejected') then raise exception 'Statut invalide';end if;select * into v from public.withdrawal_requests where id=p_request for update;if not found or v.status not in ('pending','approved') then raise exception 'Demande non traitable';end if;if p_status='rejected' then update public.wallets set balance=balance+v.tokens,updated_at=now() where user_id=v.teacher_id;insert into public.wallet_transactions(user_id,amount,kind,reference_type,reference_id,description) values(v.teacher_id,v.tokens,'refund','withdrawal',v.id,'Retrait refusé — jetons recrédités');end if;update public.withdrawal_requests set status=p_status,processed_at=case when p_status in ('paid','rejected') then now() else processed_at end where id=p_request;insert into public.notifications(user_id,title,body) values(v.teacher_id,'Retrait professeur',case when p_status='paid' then 'Le retrait a été marqué comme payé.' when p_status='rejected' then 'Le retrait a été refusé et les jetons recrédités.' else 'Le retrait a été approuvé.' end);end $$;
revoke all on function public.process_teacher_withdrawal(uuid,text) from public;grant execute on function public.process_teacher_withdrawal(uuid,text) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('teacher-photos','teacher-photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
create policy "teacher photo public read" on storage.objects for select using(bucket_id='teacher-photos');
create policy "teacher photo own insert" on storage.objects for insert to authenticated with check(bucket_id='teacher-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "teacher photo own update" on storage.objects for update to authenticated using(bucket_id='teacher-photos' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='teacher-photos' and (storage.foldername(name))[1]=auth.uid()::text);
