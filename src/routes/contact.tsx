import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, MessageSquareReply } from "lucide-react";
import { PageBackground } from "@/components/site-chrome";
import { supabase } from "@/integrations/supabase/client";
import type { ContactMessage } from "@/lib/store";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact NullSector — message the admin team" },
      {
        name: "description",
        content: "Send a message to the NullSector admins about licences, orders or guides, and read their reply.",
      },
      { property: "og:title", content: "Contact NullSector" },
      { property: "og:description", content: "Message the admins and track their reply with your ticket code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const field = "w-full rounded border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary";

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [ref, setRef] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);

  const send = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        })
        .select("ref_code")
        .single();
      if (error) throw error;
      return (data as { ref_code: string }).ref_code;
    },
    onSuccess: (code) => {
      setRef(code);
      setTicket(code);
      setForm({ name: "", email: "", subject: "", message: "" });
    },
  });

  return (
    <PageBackground>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold text-primary text-glow font-mono">/contact</h1>
        <p className="mt-2 text-sm text-foreground/70">
          Messages land straight in the admin inbox. Keep your ticket code — the reply shows up here.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.message.trim()) send.mutate();
          }}
          className="mt-6 space-y-3 rounded border border-border bg-card/70 p-5"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name or handle"
              className={field}
            />
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className={field}
            />
          </div>
          <input
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Subject"
            className={field}
          />
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="How can we help?"
            className={field}
          />
          <button
            disabled={send.isPending}
            className="inline-flex items-center gap-2 rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            <Mail className="h-4 w-4" /> {send.isPending ? "Sending…" : "Send message"}
          </button>
          {ref && (
            <p className="text-sm text-[color:var(--signal)] font-mono">
              Sent. Your ticket code is <strong>{ref}</strong> — save it to read the reply.
            </p>
          )}
        </form>

        <section className="mt-10">
          <h2 className="font-mono text-sm uppercase tracking-[0.25em] text-muted-foreground">/ check a reply</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTicket(lookup.trim().toUpperCase());
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="Ticket code"
              className={`${field} font-mono uppercase`}
            />
            <button className="rounded bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Check</button>
          </form>
          {ticket && <TicketView code={ticket} />}
        </section>
      </main>
    </PageBackground>
  );
}

function TicketView({ code }: { code: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["contact_message", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .eq("ref_code", code)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ContactMessage | null;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <p className="mt-4 text-sm text-muted-foreground">Looking up {code}…</p>;
  if (!data) return <p className="mt-4 text-sm text-muted-foreground">No ticket found for {code}.</p>;

  return (
    <div className="mt-4 rounded border border-border bg-card/70 p-5">
      <p className="font-mono text-xs text-muted-foreground">
        {data.ref_code} · {data.status} · {new Date(data.created_at).toLocaleString()}
      </p>
      <h3 className="mt-2 font-semibold text-foreground">{data.subject || "(no subject)"}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/70">{data.message}</p>
      <div className="mt-4 border-t border-border pt-4">
        <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-primary">
          <MessageSquareReply className="h-3 w-3" /> admin reply
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
          {data.admin_reply || "No reply yet — check back shortly."}
        </p>
      </div>
    </div>
  );
}
