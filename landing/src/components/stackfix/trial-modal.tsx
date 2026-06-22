"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "./field";

export function TrialModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const subject = encodeURIComponent(
      `StackFix free trial signup | ${data.get("business") || data.get("name")}`,
    );
    const body = encodeURIComponent(
      `New 1-month free trial signup\n\nName: ${data.get("name")}\nBusiness: ${data.get("business")}\nEmail: ${data.get("email")}\nPhone: ${data.get("phone") || "n/a"}\n\nPlease provision a trial account and send credentials.`,
    );
    window.location.href = `mailto:hello@stackforgeai.africa?subject=${subject}&body=${body}`;
    setSubmitted(true);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(() => setSubmitted(false), 200);
      }}
    >
      <DialogContent className="bg-background border-border sm:max-w-md">
        {submitted ? (
          <div className="py-4 text-center">
            <div className="bg-brand/15 text-brand mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full">
              <Check className="h-6 w-6" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-center">
                You&apos;re in. Welcome to StackFix.
              </DialogTitle>
              <DialogDescription className="text-center">
                We&apos;ll set up your 1-month free trial and email your login details within a few
                hours. We&apos;ll also send a friendly reminder a few days before your trial ends.
              </DialogDescription>
            </DialogHeader>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="btn-brand mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="bg-brand/10 text-brand mb-2 inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase">
                <Sparkles className="h-3.5 w-3.5" /> 1-month free trial
              </div>
              <DialogTitle>Start your free trial</DialogTitle>
              <DialogDescription>
                No credit card information or payment needed. We&apos;ll remind you a few days
                before your trial ends so you can choose a plan that fits your shop.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <Field name="name" label="Full name" placeholder="Kevin Ganza" required />
              <Field
                name="business"
                label="Business name"
                placeholder="FixHub Nyarugenge"
                required
              />
              <Field
                name="email"
                type="email"
                label="Work email"
                placeholder="you@shop.rw"
                required
              />
              <Field name="phone" label="Phone or WhatsApp (optional)" placeholder="+250 …" />
              <button
                type="submit"
                className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-muted-foreground text-center text-[11px]">
                By starting a trial you agree to receive a setup email from StackFix. No payment
                details required.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
