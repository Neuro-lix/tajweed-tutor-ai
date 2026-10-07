-- Table de comptage des requêtes par utilisateur
create table if not exists public.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  window_start timestamptz not null default now(),
  count integer not null default 0,
  primary key (user_id, key)
);

alter table public.rate_limits enable row level security;
-- Aucune policy : seul le service_role (fonctions Edge) y accède.

create or replace function public.check_rate_limit(
  p_user_id uuid,
  p_key text,
  p_max integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limits as rl (user_id, key, window_start, count)
  values (p_user_id, p_key, now(), 1)
  on conflict (user_id, key) do update
    set count = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else rl.count + 1
        end,
        window_start = case
          when rl.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else rl.window_start
        end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

revoke all on function public.check_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(uuid, text, integer, integer) to service_role;
