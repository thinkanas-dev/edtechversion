create table if not exists public.chapter_bookmarks (
  user_id uuid not null references public.profiles(id) on delete cascade,
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id,chapter_id)
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, body text not null default '', link text, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.teacher_profiles(user_id),
  tokens integer not null check(tokens>=500), amount_mad numeric(10,2) not null check(amount_mad>0),
  method text not null check(method in ('bank_transfer','cashplus')), account_details text not null,
  status text not null default 'pending' check(status in ('pending','approved','paid','rejected')), created_at timestamptz not null default now(), processed_at timestamptz
);
create table if not exists public.purchase_refunds (
  id uuid primary key default gen_random_uuid(), purchase_id uuid not null unique references public.teacher_offer_purchases(id),
  buyer_id uuid not null references public.profiles(id), teacher_id uuid not null references public.teacher_profiles(user_id),
  tokens integer not null check(tokens>0), reason text not null, created_at timestamptz not null default now()
);
alter table public.chapter_bookmarks enable row level security;
alter table public.notifications enable row level security;
alter table public.withdrawal_requests enable row level security;
alter table public.purchase_refunds enable row level security;
create policy "bookmarks own" on public.chapter_bookmarks for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "notifications own read" on public.notifications for select to authenticated using(auth.uid()=user_id);
create policy "notifications own update" on public.notifications for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "withdrawals own read" on public.withdrawal_requests for select to authenticated using(auth.uid()=teacher_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "withdrawals own create" on public.withdrawal_requests for insert to authenticated with check(auth.uid()=teacher_id and status='pending');
create policy "refunds parties read" on public.purchase_refunds for select to authenticated using(auth.uid() in (buyer_id,teacher_id) or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "purchased teacher video read" on storage.objects for select to authenticated using(bucket_id='teacher-videos' and exists(select 1 from public.teacher_offers o join public.teacher_offer_purchases p on p.offer_id=o.id where o.video_path=name and p.buyer_id=auth.uid()));

update public.lessons l set content=concat(
  'Objectif du chapitre : ',c.summary,E'\n\n',
  'À maîtriser : les définitions du chapitre, les propriétés et conditions d’application, la méthode de résolution, puis la rédaction attendue au Bac.',E'\n\n',
  'Méthode Noqta : 1. Identifier les données et la question. 2. Choisir la propriété adaptée. 3. Justifier chaque étape. 4. Vérifier le résultat et son unité ou son domaine.',E'\n\n',
  'Entraînement : commencer par une application directe, poursuivre avec un exercice composé, puis traiter un sujet national lié au chapitre.'
) from public.chapters c where l.chapter_id=c.id and (l.content='' or l.content like 'Ressources en cours%' or l.content like 'Cours structuré Noqta%');

create or replace function public.cancel_payment_order(p_order uuid) returns void language plpgsql security definer set search_path=public as $$ begin update public.payment_orders set status='cancelled' where id=p_order and user_id=auth.uid() and status in ('pending','awaiting_cash','awaiting_transfer');if not found then raise exception 'Commande non annulable';end if;end $$;
revoke all on function public.cancel_payment_order(uuid) from public;grant execute on function public.cancel_payment_order(uuid) to authenticated;

create or replace function public.refund_teacher_purchase(p_purchase uuid,p_reason text) returns void language plpgsql security definer set search_path=public as $$ declare v public.teacher_offer_purchases;begin if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Accès administrateur requis';end if;select * into v from public.teacher_offer_purchases where id=p_purchase for update;if not found then raise exception 'Achat introuvable';end if;if exists(select 1 from public.purchase_refunds where purchase_id=p_purchase) then raise exception 'Achat déjà remboursé';end if;if (select balance from public.wallets where user_id=v.teacher_id)<v.teacher_tokens then raise exception 'Solde professeur insuffisant';end if;insert into public.purchase_refunds(purchase_id,buyer_id,teacher_id,tokens,reason) values(v.id,v.buyer_id,v.teacher_id,v.tokens_paid,p_reason);update public.wallets set balance=balance+v.tokens_paid,updated_at=now() where user_id=v.buyer_id;update public.wallets set balance=balance-v.teacher_tokens,updated_at=now() where user_id=v.teacher_id;insert into public.wallet_transactions(user_id,amount,kind,reference_type,reference_id,description) values(v.buyer_id,v.tokens_paid,'refund','teacher_offer',v.id,'Remboursement explication'),(v.teacher_id,-v.teacher_tokens,'adjustment','teacher_offer',v.id,'Annulation revenu après remboursement');insert into public.notifications(user_id,title,body) values(v.buyer_id,'Remboursement effectué',concat(v.tokens_paid,' jetons ont été recrédités.'));end $$;
revoke all on function public.refund_teacher_purchase(uuid,text) from public;grant execute on function public.refund_teacher_purchase(uuid,text) to authenticated;

create or replace function public.request_teacher_withdrawal(p_tokens integer,p_method text,p_account text) returns uuid language plpgsql security definer set search_path=public as $$ declare v_balance integer;v_id uuid;begin if p_tokens<500 then raise exception 'Minimum 500 jetons';end if;select balance into v_balance from public.wallets where user_id=auth.uid() for update;if coalesce(v_balance,0)<p_tokens then raise exception 'Solde insuffisant';end if;update public.wallets set balance=balance-p_tokens,updated_at=now() where user_id=auth.uid();insert into public.withdrawal_requests(teacher_id,tokens,amount_mad,method,account_details) values(auth.uid(),p_tokens,p_tokens/10.0,p_method,p_account) returning id into v_id;insert into public.wallet_transactions(user_id,amount,kind,reference_type,reference_id,description) values(auth.uid(),-p_tokens,'adjustment','withdrawal',v_id,'Demande de retrait professeur');return v_id;end $$;
revoke all on function public.request_teacher_withdrawal(integer,text,text) from public;grant execute on function public.request_teacher_withdrawal(integer,text,text) to authenticated;
