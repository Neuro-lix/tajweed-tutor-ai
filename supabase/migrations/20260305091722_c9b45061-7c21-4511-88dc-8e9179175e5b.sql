
CREATE OR REPLACE FUNCTION public.add_credits(p_user_id UUID, p_amount INTEGER, p_description TEXT)
RETURNS INTEGER AS $$
DECLARE new_balance INTEGER;
BEGIN
  UPDATE public.user_credits
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO new_balance;

  INSERT INTO public.credit_transactions (user_id, amount, type, description)
  VALUES (p_user_id, p_amount, 'purchase', p_description);

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
