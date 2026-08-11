import { queryOptions } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ForumAccessCode = {
  id: string;
  code: string;
  label: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
};

export const forumAccessCodesQuery = queryOptions({
  queryKey: ["forum_access_codes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("forum_access_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<ForumAccessCode[]>();
    if (error) throw error;
    return data ?? [];
  },
});

const STORAGE_KEY = "nullsector.forum.access";
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

/** Local unlock state for the paid forum. Set once a valid access code is redeemed. */
export function useForumAccess() {
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setCode(localStorage.getItem(STORAGE_KEY));
    sync();
    setReady(true);
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const unlock = useCallback((value: string) => {
    localStorage.setItem(STORAGE_KEY, value);
    emit();
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    emit();
  }, []);

  return { ready, hasAccess: Boolean(code), code, unlock, lock };
}

/** Validates a code and marks it as used. Returns an error message on failure. */
export async function redeemForumCode(input: string): Promise<string | null> {
  const value = input.trim().toUpperCase();
  if (!value) return "Enter your access code.";

  const { data, error } = await supabase
    .from("forum_access_codes")
    .select("*")
    .eq("code", value)
    .maybeSingle()
    .returns<ForumAccessCode | null>();

  if (error) return "Could not verify that code — try again.";
  if (!data) return "That code is not recognised.";
  if (data.is_used) return "That code has already been redeemed.";

  const { error: updateError } = await supabase
    .from("forum_access_codes")
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq("id", data.id);
  if (updateError) return "Could not activate that code — try again.";

  return null;
}
