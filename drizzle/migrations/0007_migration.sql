create or replace function public.check_rate_limit(p_user_id uuid, p_key text, p_max int, p_window_seconds int)
returns boolean language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  r := public.check_and_increment_rate_limit(p_user_id, p_key, p_max, p_window_seconds);
  return coalesce((r->>'allowed')::boolean, false);
end $$;

create or replace function public.consume_credits(p_user_id uuid, p_amount numeric)
returns numeric language plpgsql security definer set search_path = public as $$
declare v_remaining numeric; amt numeric := round(coalesce(p_amount,0)::numeric, 2);
begin
  if amt <= 0 then return -1; end if;
  update public.user_credits set credits = credits - amt, updated_at = now()
  where user_id = p_user_id and credits >= amt
  returning credits into v_remaining;
  if not found then return -1; end if;
  insert into public.credit_transactions (user_id, amount, type, description)
  values (p_user_id, -amt, 'usage', 'Consommation IA');
  return v_remaining;
end $$;

create or replace function public.refund_credits(p_user_id uuid, p_amount numeric)
returns void language plpgsql security definer set search_path = public as $$
declare amt numeric := round(coalesce(p_amount,0)::numeric, 2);
begin
  if amt > 0 then
    update public.user_credits set credits = credits + amt, updated_at = now() where user_id = p_user_id;
    insert into public.credit_transactions (user_id, amount, type, description)
    values (p_user_id, amt, 'refund', 'Remboursement (échec IA)');
  end if;
end $$;

alter table public.profiles add column if not exists dataset_consent boolean not null default false;
alter table public.profiles add column if not exists dataset_consent_at timestamptz;

revoke all on function public.check_rate_limit(uuid, text, int, int) from public, anon, authenticated;
revoke all on function public.consume_credits(uuid, numeric) from public, anon, authenticated;
revoke all on function public.refund_credits(uuid, numeric) from public, anon, authenticated;
grant execute on function public.check_rate_limit(uuid, text, int, int) to service_role;
grant execute on function public.consume_credits(uuid, numeric) to service_role;
grant execute on function public.refund_credits(uuid, numeric) to service_role;