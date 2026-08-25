import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Invite = {
  id: string;
  code: string;
  created_by: string | null;
  note: string;
  max_uses: number;
  uses: number;
  expires_at: string | null;
  is_revoked: boolean;
  created_at: string;
};

/** True when the signed-in account has redeemed an invite (owner always passes). */
export function useIsMember(userId: string | undefined) {
  return useQuery({
    queryKey: ["am_i_member", userId ?? "anon"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("am_i_member");
      if (error) throw error;
      return Boolean(data);
    },
  });
}

/** Invites created by the signed-in member. */
export function useMyInvites(userId: string | undefined) {
  return useQuery({
    queryKey: ["my_invites", userId ?? "anon"],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<Invite[]>();
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: string) => {
      const { data, error } = await supabase.rpc("create_invite", { _note: note, _max_uses: 1, _days_valid: 30 });
      if (error) throw error;
      return data as unknown as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_invites"] }),
  });
}

export function useRevokeInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invites").update({ is_revoked: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my_invites"] }),
  });
}

/** Redeem a code for the currently signed-in account. */
export async function redeemInvite(code: string): Promise<{ ok: boolean; error: string | null }> {
  const { data, error } = await supabase.rpc("redeem_invite_code", { _code: code });
  if (error) return { ok: false, error: error.message };
  const result = data as unknown as { ok: boolean; error: string | null };
  return { ok: Boolean(result?.ok), error: result?.error ?? null };
}

export function inviteStatus(invite: Invite): "revoked" | "expired" | "used" | "active" {
  if (invite.is_revoked) return "revoked";
  if (invite.expires_at && new Date(invite.expires_at).getTime() <= Date.now()) return "expired";
  if (invite.uses >= invite.max_uses) return "used";
  return "active";
}
