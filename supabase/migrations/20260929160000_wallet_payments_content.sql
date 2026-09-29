alter table public.chapters add column if not exists source_name text;
alter table public.chapters add column if not exists course_url text;
alter table public.chapters add column if not exists exercise_url text;
alter table public.chapters add column if not exists annales_url text;

update public.chapters set source_name='Mathnit',course_url='https://mathnit.com/courses/track/ma-2bac-sma/',exercise_url='https://mathnit.com/courses/track/ma-2bac-sma/',annales_url='https://mathnit.com/exams/' where subject_id='math';
update public.chapters set source_name='PCBAC',course_url='https://www.pcbac.ma/2bac/sm',exercise_url='https://www.pcbac.ma/2bac/sm',annales_url='https://www.alloschool.com/course/physique-et-chimie-2eme-bac-sciences-mathematiques-a-biof' where subject_id='physics';
update public.chapters set course_url='https://mathnit.com/courses/sma-limites-continuite/',exercise_url='https://mathnit.com/courses/sma-limites-continuite/' where subject_id='math' and title='Limites et continuité';
update public.chapters set course_url='https://mathnit.com/courses/sma-derivation/',exercise_url='https://mathnit.com/courses/sma-derivation/' where subject_id='math' and title='Dérivation et étude des fonctions';
update public.chapters set course_url='https://mathnit.com/courses/sma-suites/',exercise_url='https://mathnit.com/courses/sma-suites/' where subject_id='math' and title='Suites numériques';
update public.chapters set course_url='https://mathnit.com/courses/sma-logarithme/',exercise_url='https://mathnit.com/courses/sma-logarithme/' where subject_id='math' and title='Fonctions logarithmiques';

create table if not exists public.wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  balance integer not null default 0 check(balance>=0),
  updated_at timestamptz not null default now()
);
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null, kind text not null check(kind in ('topup','purchase','earning','refund','adjustment')),
  reference_type text, reference_id uuid, description text not null default '', created_at timestamptz not null default now()
);
create table if not exists public.teacher_offer_purchases (
  id uuid primary key default gen_random_uuid(), buyer_id uuid not null references public.profiles(id) on delete cascade,
  offer_id uuid not null references public.teacher_offers(id), teacher_id uuid not null references public.teacher_profiles(user_id),
  tokens_paid integer not null check(tokens_paid>0), teacher_tokens integer not null check(teacher_tokens>=0), platform_tokens integer not null check(platform_tokens>=0),
  created_at timestamptz not null default now(), unique(buyer_id,offer_id)
);
create table if not exists public.payment_orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  product_type text not null check(product_type in ('token_pack','subscription')), product_code text not null,
  amount_mad integer not null check(amount_mad>0), tokens integer not null default 0 check(tokens>=0),
  method text not null check(method in ('card','wafacash','barid','transfer')), status text not null default 'pending' check(status in ('pending','awaiting_cash','awaiting_transfer','paid','failed','cancelled','refunded')),
  provider_reference text, created_at timestamptz not null default now(), paid_at timestamptz
);
alter table public.wallets enable row level security;alter table public.wallet_transactions enable row level security;alter table public.teacher_offer_purchases enable row level security;alter table public.payment_orders enable row level security;
create policy "wallet own read" on public.wallets for select to authenticated using(auth.uid()=user_id);
create policy "transactions own read" on public.wallet_transactions for select to authenticated using(auth.uid()=user_id);
create policy "purchases own read" on public.teacher_offer_purchases for select to authenticated using(auth.uid()=buyer_id or auth.uid()=teacher_id);
create policy "orders own read" on public.payment_orders for select to authenticated using(auth.uid()=user_id);
create policy "orders own create" on public.payment_orders for insert to authenticated with check(auth.uid()=user_id and status in ('pending','awaiting_cash','awaiting_transfer'));
create policy "orders admin read" on public.payment_orders for select to authenticated using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
insert into public.wallets(user_id) select id from public.profiles on conflict do nothing;
create or replace function public.create_user_wallet() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.wallets(user_id) values(new.id) on conflict do nothing; return new; end $$;
drop trigger if exists on_profile_wallet on public.profiles;create trigger on_profile_wallet after insert on public.profiles for each row execute procedure public.create_user_wallet();
create or replace function public.purchase_teacher_offer(p_offer uuid) returns uuid language plpgsql security definer set search_path=public as $$ declare v_offer public.teacher_offers;v_balance integer;v_purchase uuid;v_teacher_share integer;begin select * into v_offer from public.teacher_offers where id=p_offer and status='published' for update;if not found then raise exception 'Offre indisponible';end if;if v_offer.teacher_id=auth.uid() then raise exception 'Impossible d acheter votre propre offre';end if;select balance into v_balance from public.wallets where user_id=auth.uid() for update;if coalesce(v_balance,0)<v_offer.token_price then raise exception 'Solde insuffisant';end if;v_teacher_share=floor(v_offer.token_price*.8);insert into public.teacher_offer_purchases(buyer_id,offer_id,teacher_id,tokens_paid,teacher_tokens,platform_tokens) values(auth.uid(),p_offer,v_offer.teacher_id,v_offer.token_price,v_teacher_share,v_offer.token_price-v_teacher_share) returning id into v_purchase;update public.wallets set balance=balance-v_offer.token_price,updated_at=now() where user_id=auth.uid();insert into public.wallet_transactions(user_id,amount,kind,reference_type,reference_id,description) values(auth.uid(),-v_offer.token_price,'purchase','teacher_offer',v_purchase,'Achat d une explication');insert into public.wallets(user_id,balance) values(v_offer.teacher_id,v_teacher_share) on conflict(user_id) do update set balance=public.wallets.balance+excluded.balance,updated_at=now();insert into public.wallet_transactions(user_id,amount,kind,reference_type,reference_id,description) values(v_offer.teacher_id,v_teacher_share,'earning','teacher_offer',v_purchase,'Revenu professeur');return v_purchase;end $$;
revoke all on function public.purchase_teacher_offer(uuid) from public;
grant execute on function public.purchase_teacher_offer(uuid) to authenticated;

create or replace function public.confirm_payment_order(p_order uuid,p_provider_reference text default null) returns integer language plpgsql security definer set search_path=public as $$ declare v_order public.payment_orders;v_balance integer;begin if not exists(select 1 from public.profiles where id=auth.uid() and role='admin') then raise exception 'Accès administrateur requis';end if;select * into v_order from public.payment_orders where id=p_order for update;if not found then raise exception 'Commande introuvable';end if;if v_order.status='paid' then select balance into v_balance from public.wallets where user_id=v_order.user_id;return v_balance;end if;if v_order.status not in ('pending','awaiting_cash','awaiting_transfer') then raise exception 'Commande non confirmable';end if;update public.payment_orders set status='paid',provider_reference=coalesce(p_provider_reference,provider_reference),paid_at=now() where id=p_order;insert into public.wallets(user_id,balance) values(v_order.user_id,v_order.tokens) on conflict(user_id) do update set balance=public.wallets.balance+excluded.balance,updated_at=now() returning balance into v_balance;insert into public.wallet_transactions(user_id,amount,kind,reference_type,reference_id,description) values(v_order.user_id,v_order.tokens,'topup','payment_order',v_order.id,'Recharge de jetons confirmée');return v_balance;end $$;
revoke all on function public.confirm_payment_order(uuid,text) from public;
grant execute on function public.confirm_payment_order(uuid,text) to authenticated;
