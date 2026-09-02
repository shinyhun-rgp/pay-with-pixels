import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "nullsector_forum_access";

/** Local unlock flag — set once a valid access code has been redeemed. */
export function useForumAccess() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setUnlocked(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      setUnlocked(false);
    }
    setReady(true);
  }, []);

  const unlock = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage disabled — session-only access */
    }
    setUnlocked(true);
  }, []);

  return { unlocked, ready, unlock };
}

/** Validates an access code through the database and marks it as used. */
export async function redeemForumCode(code: string): Promise<{ ok: boolean; error: string | null }> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: "Enter the access code you received." };
  const { data, error } = await supabase.rpc("redeem_invite", { _code: trimmed });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "That access code is not valid." };
  return { ok: true, error: null };
}

export type ForumAccessCode = {
  id: string;
  code: string;
  label: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
};
