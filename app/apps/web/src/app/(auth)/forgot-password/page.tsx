"use client";

import Link from "next/link";
import { useState } from "react";
import { StackFixLogo } from "@stackfix/ui";
import { ChevronLeft, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setSent(true);
      toast.success("Reset link sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

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

        <h1 className="text-2xl font-bold mb-1">Reset password</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Enter your workshop account email. We&apos;ll send you a secure link to choose a new password.
        </p>

        {sent ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Check your inbox at <strong className="text-foreground">{email}</strong> for a password reset link.
              The link expires in 1 hour.
            </p>
            <Link href="/login" className="inline-block mt-6 text-brand font-semibold text-sm hover:underline">
              Return to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@workshop.rw"
                  className="stackfix-form-input pl-9"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
