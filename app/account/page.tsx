"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Loader2 } from "lucide-react";
import { SubPageHeader } from "@/components/layout/sub-page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearApiCache, hardNavigate, postJson } from "@/lib/auth/client";
import { jsonFetcher } from "@/lib/api";

interface Me {
  name: string;
  email: string;
  isAdmin: boolean;
}
interface Member {
  name: string;
  email: string;
  enrolled: boolean;
}

function InviteSection() {
  const { data: members } = useSWR<Member[]>("/api/auth/invite", jsonFetcher);
  const { mutate } = useSWRConfig();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setLink("");
    const res = await postJson<{ url: string }>("/api/auth/invite", { name, email });
    if (res.ok) {
      setLink(res.data.url);
      setName("");
      setEmail("");
      await mutate("/api/auth/invite");
    } else {
      setError(res.data.error ?? "Something went wrong.");
    }
    setBusy(false);
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <h2 className="text-sm font-medium">Invite a friend</h2>
      <form onSubmit={invite} className="space-y-2">
        <Input required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="h-11 rounded-xl" />
        <Input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 rounded-xl" />
        <Button type="submit" className="h-11 w-full rounded-xl" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Create invite link
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {link && (
        <div className="space-y-2 rounded-xl bg-secondary/60 p-3">
          <p className="text-xs text-muted-foreground">One-time link, valid 7 days. Send it to them privately.</p>
          <p className="break-all text-xs font-medium">{link}</p>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard?.writeText(link).catch(() => {})}>
            Copy link
          </Button>
        </div>
      )}
      {members && members.length > 0 && (
        <ul className="space-y-1 pt-1 text-sm">
          {members.map((m) => (
            <li key={m.email} className="flex justify-between">
              <span>{m.name}</span>
              <span className="text-muted-foreground">{m.enrolled ? "active" : "invited"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AccountPage() {
  const { data: me } = useSWR<Me>("/api/auth/me", jsonFetcher);

  const logout = async () => {
    await postJson("/api/auth/logout");
    await clearApiCache();
    hardNavigate("/login");
  };

  return (
    <div>
      <SubPageHeader title="Account" />
      <div className="space-y-5 px-4 py-5">
        {me && (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="font-semibold">{me.name}</p>
            <p className="text-sm text-muted-foreground">{me.email}</p>
          </div>
        )}
        {me?.isAdmin && <InviteSection />}
        <Button variant="outline" className="h-12 w-full rounded-xl text-base" onClick={logout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
