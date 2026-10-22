"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearApiCache, hardNavigate, postJson } from "@/lib/auth/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await postJson("/api/auth/login", { email, code });
    if (res.ok) {
      await clearApiCache();
      hardNavigate("/");
      return;
    }
    setError(res.data.error ?? "Something went wrong. Please try again.");
    setBusy(false);
  };

  return (
    <main className="flex min-h-dvh flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">GymGraph</h1>
      <p className="mb-8 text-sm text-muted-foreground">Sign in with your authenticator app.</p>

      <form onSubmit={submit} className="space-y-4">
        <Input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-12 rounded-xl"
        />
        <Input
          required
          inputMode={useRecovery ? "text" : "numeric"}
          autoComplete="one-time-code"
          maxLength={useRecovery ? 12 : 6}
          placeholder={useRecovery ? "Recovery code" : "6-digit code"}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="h-12 rounded-xl text-center text-lg tracking-widest"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" size="lg" className="h-12 w-full rounded-xl text-base" disabled={busy}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          Sign in
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setUseRecovery((v) => !v);
          setCode("");
          setError("");
        }}
        className="mt-6 text-sm text-muted-foreground underline underline-offset-4"
      >
        {useRecovery ? "Use authenticator code instead" : "Lost your phone? Use a recovery code"}
      </button>
    </main>
  );
}
