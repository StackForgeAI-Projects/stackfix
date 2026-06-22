import { createFileRoute, Link } from "@tanstack/react-router";
import { StackFixLogo } from "@/components/StackFixLogo";
import heroImg from "@/assets/login-hero.jpg";
import { Eye, User } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — StackFix" }] }),
  component: Login,
});

function Login() {
  return (
    <div className="min-h-screen flex">
      {/* Left visual */}
      <div className="hidden lg:flex w-1/2 bg-ink relative overflow-hidden">
        <img
          src={heroImg}
          alt="Technician at work"
          width={1024}
          height={1280}
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/90 via-ink/40 to-transparent" />
        <div className="relative flex flex-col justify-between p-12 text-white">
          <StackFixLogo variant="light" />
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Repair operations,<br />
              <span className="text-brand">built for Africa.</span>
            </h1>
            <p className="text-white/70 leading-relaxed">
              StackFix helps repair workshops in Kigali manage tickets, invoice
              customers, and accept USSD mobile money payments — all in one
              lightweight platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <StackFixLogo variant="dark" />
          </div>
          <h2 className="text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8 text-sm">Sign in to continue to your workshop.</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Phone or Email</label>
              <div className="relative">
                <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  defaultValue="+250 788 000 000"
                  placeholder="+250 788 000 000 or you@workshop.rw"
                  className="w-full pl-9 pr-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-sm"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold">Password</label>
                <a href="#" className="text-xs font-semibold text-brand hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <input
                  type="password"
                  defaultValue="••••••••••••"
                  className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all text-sm pr-10"
                />
                <Eye className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            <Link
              to="/"
              className="block text-center w-full py-3.5 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all"
            >
              Sign in
            </Link>

            <p className="text-xs text-center text-muted-foreground pt-2">
              By continuing you agree to StackFix's Terms & Privacy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
