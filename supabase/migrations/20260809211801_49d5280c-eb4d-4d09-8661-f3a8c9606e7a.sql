CREATE OR REPLACE FUNCTION public.deduct_credit(p_user_id uuid, p_amount numeric DEFAULT 1)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_credits NUMERIC(10,2);
  target uuid := COALESCE(auth.uid(), p_user_id);
  amt NUMERIC(10,2) := ROUND(GREATEST(COALESCE(p_amount, 1), 0)::numeric, 2);
BEGIN
  IF target IS NULL THEN
    RETURN -1;
  END IF;

  SELECT credits INTO current_credits
  FROM public.user_credits
  WHERE user_id = target
  FOR UPDATE;

  IF current_credits IS NULL OR current_credits < amt OR amt <= 0 THEN
    RETURN -1;
  END IF;

  UPDATE public.user_credits
  SET credits = credits - amt, updated_at = NOW()
  WHERE user_id = target;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (target, -amt, 'usage', 'Consommation IA');

  RETURN current_credits - amt;
END;
$function$;