CREATE TABLE public.forum_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  label text NOT NULL DEFAULT '',
  is_used boolean NOT NULL DEFAULT false,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_access_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forum_access_codes TO authenticated;
GRANT ALL ON public.forum_access_codes TO service_role;

ALTER TABLE public.forum_access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_access_codes open" ON public.forum_access_codes
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

INSERT INTO public.site_settings (key, value, label, sort_order) VALUES
  ('forum_price', '50', 'Forum access price (USD)', 40),
  ('forum_access_note', 'Pay the one-off access fee to any wallet below, then email your transaction hash. We reply with an access code within a few hours.', 'Forum paywall instructions', 41)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.forum_access_codes (code, label) VALUES
  ('NS-FORUM-DEMO1', 'Sample code'),
  ('NS-FORUM-DEMO2', 'Sample code')
ON CONFLICT (code) DO NOTHING;