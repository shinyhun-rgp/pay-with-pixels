INSERT INTO public.site_settings (key, value, label, sort_order) VALUES
  ('forum_price', '50', 'Forum entry fee (USD)', 90),
  ('forum_name', 'NullSector Forum', 'Forum title', 91),
  ('forum_intro', 'Private operator forum: full write-ups, tooling notes and playbooks. One-time $50 entry, paid in crypto.', 'Forum lock screen intro', 92)
ON CONFLICT (key) DO NOTHING;

GRANT EXECUTE ON FUNCTION public.redeem_invite(text) TO anon, authenticated;