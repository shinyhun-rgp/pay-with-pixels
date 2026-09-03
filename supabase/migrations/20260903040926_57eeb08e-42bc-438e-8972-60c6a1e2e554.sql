CREATE OR REPLACE FUNCTION public.create_invite(_note text DEFAULT ''::text, _max_uses integer DEFAULT 1, _days_valid integer DEFAULT 30)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
  _open int;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can create invites';
  END IF;

  SELECT count(*) INTO _open
  FROM public.invites
  WHERE created_by = auth.uid()
    AND is_revoked = false
    AND uses < max_uses
    AND (expires_at IS NULL OR expires_at > now());

  IF _open >= 50 THEN
    RAISE EXCEPTION 'Too many open invite codes';
  END IF;

  _code := 'NS-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)) || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,4));

  INSERT INTO public.invites (code, created_by, note, max_uses, expires_at)
  VALUES (_code, auth.uid(), coalesce(_note,''), greatest(1,_max_uses), now() + make_interval(days => greatest(1,_days_valid)));

  RETURN _code;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_invite(text,integer,integer) FROM anon;