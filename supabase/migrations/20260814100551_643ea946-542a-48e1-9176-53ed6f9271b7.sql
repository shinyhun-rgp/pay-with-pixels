-- 1. Single price per product
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price numeric NOT NULL DEFAULT 0;
UPDATE public.products p
SET price = COALESCE((SELECT MIN(pp.price) FROM public.product_prices pp WHERE pp.product_id = p.id), 0)
WHERE p.price = 0;

-- 2. Roles
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own roles readable" ON public.user_roles;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin');
$$;

-- First signed-in account claims ownership; afterwards nobody else can.
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN public.has_role(uid, 'admin');
  END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
  ON CONFLICT DO NOTHING;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.claim_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 3. Invite redemption (codes stay private)
CREATE OR REPLACE FUNCTION public.redeem_invite(_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE hit uuid;
BEGIN
  SELECT id INTO hit FROM public.forum_access_codes
  WHERE lower(code) = lower(trim(_code)) LIMIT 1;
  IF hit IS NULL THEN RETURN false; END IF;
  UPDATE public.forum_access_codes SET is_used = true, used_at = COALESCE(used_at, now()) WHERE id = hit;
  RETURN true;
END $$;
GRANT EXECUTE ON FUNCTION public.redeem_invite(text) TO anon, authenticated;

-- 4. Lock down tables
DROP POLICY IF EXISTS "categories open" ON public.categories;
DROP POLICY IF EXISTS "products open" ON public.products;
DROP POLICY IF EXISTS "product_prices open" ON public.product_prices;
DROP POLICY IF EXISTS "payment_methods open" ON public.payment_methods;
DROP POLICY IF EXISTS "shipping_options open" ON public.shipping_options;
DROP POLICY IF EXISTS "site_settings open" ON public.site_settings;
DROP POLICY IF EXISTS "content_pages open" ON public.content_pages;
DROP POLICY IF EXISTS "forum_threads open" ON public.forum_threads;
DROP POLICY IF EXISTS "forum_replies open" ON public.forum_replies;
DROP POLICY IF EXISTS "forum_access_codes open" ON public.forum_access_codes;
DROP POLICY IF EXISTS "orders open" ON public.orders;
DROP POLICY IF EXISTS "order_items open" ON public.order_items;
DROP POLICY IF EXISTS "contact_messages open" ON public.contact_messages;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['categories','products','product_prices','payment_methods','shipping_options','site_settings','content_pages','forum_threads','forum_replies'] LOOP
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (true)', t || '_public_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t || '_admin_write', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['orders','order_items','contact_messages'] LOOP
    EXECUTE format('GRANT INSERT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO anon, authenticated WITH CHECK (true)', t || '_public_insert', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_admin())', t || '_admin_read', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t || '_admin_update', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.is_admin())', t || '_admin_delete', t);
  END LOOP;
END $$;

REVOKE ALL ON public.forum_access_codes FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_access_codes TO authenticated;
GRANT ALL ON public.forum_access_codes TO service_role;
CREATE POLICY "invite_codes_admin" ON public.forum_access_codes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());