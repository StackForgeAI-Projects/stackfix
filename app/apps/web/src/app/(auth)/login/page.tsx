"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StackFixLogo } from "@stackfix/ui";
import { Eye, EyeOff, User } from "lucide-react";
import { DEMO_ACCOUNT_LIST } from "@stackfix/utils";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/lib/toast";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState<string>(DEMO_ACCOUNT_LIST[0].email);
  const [password, setPassword] = useState<string>(DEMO_ACCOUNT_LIST[0].password);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("auth.welcomeBack");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "auth.loginFailed");
    } finally {
      setLoading(false);
    }
  }

  function applyDemoAccount(demo: (typeof DEMO_ACCOUNT_LIST)[number]) {
    setEmail(demo.email);
    setPassword(demo.password);
    setShowPassword(false);
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 bg-ink relative overflow-hidden">
        <Image
          src="/brand/login-hero.jpg"
          alt="Technician at work"
          fill
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/40 to-transparent" />
        <div className="relative flex flex-col justify-between p-12 text-white z-10 w-full">
          <StackFixLogo variant="light" iconSrc="/brand/stackfix-icon.png" />
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              {t("auth.heroTitle")}
              <br />
              <span className="text-brand">{t("auth.heroTitleAccent")}</span>
            </h1>
            <p className="text-white/70 leading-relaxed">{t("auth.heroDesc")}</p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <StackFixLogo variant="dark" iconSrc="/brand/stackfix-icon.png" />
          </div>
          <h2 className="text-2xl font-bold mb-1">{t("auth.loginTitle")}</h2>
          <p className="text-muted-foreground mb-8 text-sm">{t("auth.loginSubtitle")}</p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">{t("auth.email")}</label>
              <div className="relative">
                <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold">{t("auth.password")}</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-brand hover:underline">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 text-sm pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-60"
            >
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-center">
              {t("auth.demoAccounts")}
            </p>
            {DEMO_ACCOUNT_LIST.map((demo) => (
              <button
                key={demo.email}
                type="button"
                onClick={() => applyDemoAccount(demo)}
                className="w-full text-left rounded-lg px-3 py-2 text-xs hover:bg-muted/60 transition-colors"
              >
                <span className="font-semibold text-foreground">{demo.role}</span>
                <span className="block text-muted-foreground mt-0.5 font-mono">
                  {demo.email} / {demo.password}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
