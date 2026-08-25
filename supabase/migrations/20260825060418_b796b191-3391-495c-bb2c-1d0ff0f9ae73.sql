
CREATE TABLE public.invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  created_by uuid,
  note text NOT NULL DEFAULT '',
  max_uses integer NOT NULL DEFAULT 1,
  uses integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites TO authenticated;
GRANT ALL ON public.invites TO service_role;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.site_members (
  user_id uuid PRIMARY KEY,
  invited_by uuid,
  invite_id uuid REFERENCES public.invites(id) ON DELETE SET NULL,
  joined_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_members TO authenticated;
GRANT ALL ON public.site_members TO service_role;
ALTER TABLE public.site_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_member(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.site_members WHERE user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin');
$$;

CREATE POLICY "members read own invites" ON public.invites
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "members update own invites" ON public.invites
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins insert invites" ON public.invites
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE POLICY "admins delete invites" ON public.invites
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "read own membership" ON public.site_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR invited_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.create_invite(_note text DEFAULT '', _max_uses integer DEFAULT 1, _days_valid integer DEFAULT 30)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  new_code text;
  open_count integer;
BEGIN
  IF uid IS NULL OR NOT public.is_member(uid) THEN
    RAISE EXCEPTION 'Only members can create invites';
  END IF;

  SELECT count(*) INTO open_count FROM public.invites
   WHERE created_by = uid AND is_revoked = false AND uses < max_uses
     AND (expires_at IS NULL OR expires_at > now());
  IF open_count >= 10 AND NOT public.has_role(uid, 'admin') THEN
    RAISE EXCEPTION 'Invite limit reached';
  END IF;

  LOOP
    new_code := 'NS-' || upper(substr(md5(gen_random_uuid()::text), 1, 4)) || '-' ||
                         upper(substr(md5(gen_random_uuid()::text), 1, 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.invites WHERE code = new_code);
  END LOOP;

  INSERT INTO public.invites (code, created_by, note, max_uses, expires_at)
  VALUES (new_code, uid, COALESCE(_note, ''), GREATEST(COALESCE(_max_uses, 1), 1),
          CASE WHEN COALESCE(_days_valid, 0) > 0 THEN now() + (_days_valid || ' days')::interval ELSE NULL END);

  RETURN new_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_invite_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  inv public.invites%ROWTYPE;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not signed in');
  END IF;
  IF public.is_member(uid) THEN
    RETURN jsonb_build_object('ok', true, 'error', null);
  END IF;

  SELECT * INTO inv FROM public.invites
   WHERE lower(code) = lower(trim(_code)) FOR UPDATE;

  IF inv.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Invite code not found');
  END IF;
  IF inv.is_revoked THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite was revoked');
  END IF;
  IF inv.expires_at IS NOT NULL AND inv.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite has expired');
  END IF;
  IF inv.uses >= inv.max_uses THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This invite has already been used');
  END IF;

  INSERT INTO public.site_members (user_id, invited_by, invite_id)
  VALUES (uid, inv.created_by, inv.id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.invites SET uses = uses + 1, updated_at = now() WHERE id = inv.id;

  RETURN jsonb_build_object('ok', true, 'error', null);
END;
$$;

CREATE OR REPLACE FUNCTION public.am_i_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND public.is_member(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_invites_updated_at BEFORE UPDATE ON public.invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bootstrap: the owner account is a member by definition; seed a first invite
-- for the existing owner so they can invite others immediately.
INSERT INTO public.invites (code, created_by, note, max_uses, expires_at)
SELECT 'NS-FOUNDER-01', ur.user_id, 'Founder invite', 5, NULL
FROM public.user_roles ur WHERE ur.role = 'admin' LIMIT 1;
