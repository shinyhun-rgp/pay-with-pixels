
REVOKE EXECUTE ON FUNCTION public.is_member(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_invite(text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.redeem_invite_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.am_i_member() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
