"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StackFixLogo } from "@stackfix/ui";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!token) {
      toast.error("Invalid reset link");
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      toast.success("Password updated — sign in with your new password");
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <p className="text-sm text-muted-foreground mb-4">This reset link is invalid or missing.</p>
        <Link href="/forgot-password" className="text-brand font-semibold text-sm hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-semibold mb-1.5 block">New password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="stackfix-form-input"
          autoComplete="new-password"
        />
      </div>
      <div>
        <label className="text-sm font-semibold mb-1.5 block">Confirm password</label>
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="stackfix-form-input"
          autoComplete="new-password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-60"
      >
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <StackFixLogo variant="dark" iconSrc="/brand/stackfix-icon.png" />
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="size-4" /> Back to login
        </Link>

        <h1 className="text-2xl font-bold mb-1">Choose a new password</h1>
        <p className="text-muted-foreground mb-8 text-sm">Must be at least 8 characters.</p>

        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
