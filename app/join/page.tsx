"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { renderSVG } from "uqr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearApiCache, hardNavigate, postJson } from "@/lib/auth/client";

interface Invite {
  name: string;
  email: string;
  secret: string;
  uri: string;
}

function Join() {
  const token = useSearchParams().get("token") ?? "";
  const [invite, setInvite] = useState<Invite | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  useEffect(() => {
    fetch(`/api/auth/join?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setInvite)
      .catch(() => setInvalid(true));
  }, [token]);

  const confirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await postJson<{ recoveryCodes: string[] }>("/api/auth/join", { token, code });
    if (res.ok) {
      await clearApiCache();
      setRecoveryCodes(res.data.recoveryCodes);
      return;
    }
    setError(res.data.error ?? "Something went wrong. Please try again.");
    setBusy(false);
  };

  if (invalid) {
    return <p className="px-6 pt-24 text-center text-sm text-muted-foreground">This invite link is invalid or has expired. Ask for a new one.</p>;
  }
  if (!invite) return <div className="mx-6 mt-24 h-40 animate-pulse rounded-2xl bg-muted" />;

  if (recoveryCodes) {
    return (
      <main className="px-6 pt-12">
        <h1 className="text-xl font-bold">Save your recovery codes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          If you lose your phone, each code signs you in once. They are shown only now, so store them somewhere safe.
        </p>
        <div className="my-6 grid grid-cols-2 gap-2 rounded-2xl border border-border/60 bg-card p-4 font-medium tabular-nums">
          {recoveryCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <Button
          variant="outline"
          className="mb-3 h-11 w-full rounded-xl"
          onClick={() => navigator.clipboard?.writeText(recoveryCodes.join("\n")).catch(() => {})}
        >
          Copy codes
        </Button>
        <Button className="h-12 w-full rounded-xl text-base" onClick={() => hardNavigate("/")}>
          I&apos;ve saved them, continue
        </Button>
      </main>
    );
  }

  return (
    <main className="px-6 pt-12">
      <h1 className="text-xl font-bold">Welcome, {invite.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password…), then enter the 6-digit code it shows.
      </p>
      <div
        className="mx-auto my-6 w-56 rounded-2xl bg-white p-3"
        // Generated locally from the otpauth URI; not user-supplied HTML.
        dangerouslySetInnerHTML={{ __html: renderSVG(invite.uri) }}
      />
      <p className="mb-6 text-center text-xs text-muted-foreground">
        Can&apos;t scan? Enter this key manually:
        <br />
        <span className="break-all font-medium text-foreground">{invite.secret}</span>
      </p>
      <form onSubmit={confirm} className="space-y-3">
        <Input
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="6-digit code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-12 rounded-xl text-center text-lg tracking-widest"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Create account
        </Button>
      </form>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <Join />
    </Suspense>
  );
}
