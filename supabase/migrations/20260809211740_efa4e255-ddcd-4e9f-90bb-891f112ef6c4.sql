ALTER TABLE public.user_credits ALTER COLUMN credits TYPE NUMERIC(10,2);
ALTER TABLE public.credit_transactions ALTER COLUMN amount TYPE NUMERIC(10,2);

DROP FUNCTION IF EXISTS public.deduct_credit(uuid);
CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid, p_amount numeric DEFAULT 1)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits NUMERIC(10,2);
  amt NUMERIC(10,2) := ROUND(GREATEST(COALESCE(p_amount, 1), 0)::numeric, 2);
BEGIN
  SELECT credits INTO current_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_credits IS NULL OR current_credits < amt OR amt <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE public.user_credits
  SET credits = credits - amt, updated_at = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, -amt, 'usage', 'Consommation IA');

  RETURN current_credits - amt;
END;
$function$;

REVOKE ALL ON FUNCTION public.deduct_credit(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deduct_credit(uuid, numeric) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.add_credits(uuid, integer, text);
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id uuid, p_amount numeric, p_description text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE new_balance NUMERIC(10,2);
BEGIN
  UPDATE public.user_credits
  SET credits = credits + ROUND(p_amount::numeric, 2),
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, ROUND(p_amount::numeric, 2), 'purchase', p_description);

  RETURN new_balance;
END;
$function$;

REVOKE ALL ON FUNCTION public.add_credits(uuid, numeric, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, numeric, text) TO service_role;