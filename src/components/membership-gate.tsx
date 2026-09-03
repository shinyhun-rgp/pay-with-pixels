import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/lib/admin-auth";
import { useIsMember } from "@/lib/membership";

const PUBLIC_PATHS = ["/auth"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) || pathname.startsWith("/api/");
}

/**
 * Invite-only gate: any visitor without a session AND a redeemed invite is
 * sent to /auth. Runs client-side only so the server never renders a
 * half-authenticated shell.
 */
export function MembershipGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hydrated, setHydrated] = useState(false);
  const { session, loading } = useSession();
  const { data: isMember, isLoading: memberLoading } = useIsMember(session?.user.id);

  useEffect(() => setHydrated(true), []);

  const open = isPublic(pathname);
  const checking = loading || (Boolean(session) && memberLoading);
  const allowed = Boolean(session) && isMember === true;

  useEffect(() => {
    if (!hydrated || open || checking || allowed) return;
    navigate({ to: "/auth", replace: true });
  }, [hydrated, open, checking, allowed, navigate]);

  if (open) return <>{children}</>;
  if (!hydrated || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">verifying access…</p>
      </div>
    );
  }
  if (!allowed) return null;
  return <>{children}</>;
}
