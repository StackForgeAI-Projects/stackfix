"use client";

import { AppShell } from "@/components/AppShell";
import { SearchableSelect, resolveCatalogValue } from "@/components/SearchableSelect";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { isValidRwandaPhone } from "@stackfix/utils";
import { ChevronLeft, Phone, Sparkles, Upload } from "lucide-react";
import {
  DEVICE_BRAND_OPTIONS,
  DEVICE_MODEL_OPTIONS,
  DEVICE_TYPE_OPTIONS,
  faultsForDeviceType,
} from "@/lib/device-catalog";

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold mb-1.5 block">
        {label}
        {required && <span className="text-brand ml-0.5">*</span>}
        {optional && <span className="text-muted-foreground font-normal ml-1">(optional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deviceType: "Smartphone",
    deviceTypeOther: "",
    deviceBrand: "",
    deviceBrandOther: "",
    deviceModel: "",
    deviceModelOther: "",
    faultDescription: "",
  });

  const faultSuggestions = useMemo(
    () => faultsForDeviceType(resolveCatalogValue(form.deviceType, form.deviceTypeOther) || "Smartphone"),
    [form.deviceType, form.deviceTypeOther],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidRwandaPhone(form.customerPhone)) {
      toast.error("Enter a valid Rwanda phone number (e.g. 0788123456)");
      return;
    }

    const deviceType = resolveCatalogValue(form.deviceType, form.deviceTypeOther);
    const deviceBrand = resolveCatalogValue(form.deviceBrand, form.deviceBrandOther);
    const deviceModel = resolveCatalogValue(form.deviceModel, form.deviceModelOther);

    if (!deviceType) {
      toast.error("Select a device or electronic type");
      return;
    }
    if (!form.faultDescription.trim()) {
      toast.error("Enter a fault description");
      return;
    }

    setLoading(true);
    try {
      const res = (await api.createTicket({
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        deviceType,
        deviceBrand: deviceBrand || undefined,
        deviceModel: deviceModel || undefined,
        faultDescription: form.faultDescription.trim(),
      })) as { data: { id: string } };
      toast.success("Ticket created");
      router.push(`/tickets/${res.data.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft className="size-4" /> Back to tickets
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">New Repair Ticket</h1>
          <p className="text-muted-foreground">
            Customer will receive SMS/WhatsApp notifications when status changes. Email is optional.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-5 bg-card p-6 rounded-2xl border border-border shadow-sm"
          >
            <Field label="Customer Name" required>
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="stackfix-form-input"
                placeholder="Full name"
                autoComplete="name"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Phone Number" required hint="MTN MoMo or Airtel — used for SMS & USSD push.">
                <div className="relative">
                  <Phone className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    required
                    type="tel"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="stackfix-form-input pl-9"
                    placeholder="+250 788 000 000"
                    autoComplete="tel"
                  />
                </div>
              </Field>
              <Field label="Email" optional hint="Optional — SMS/WhatsApp are primary channels.">
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="stackfix-form-input"
                  placeholder="optional"
                  autoComplete="email"
                />
              </Field>
            </div>

            <SearchableSelect
              label="Device or Electronic Type"
              required
              placeholder="Search device type…"
              options={DEVICE_TYPE_OPTIONS}
              value={form.deviceType}
              otherValue={form.deviceTypeOther}
              onChange={(value, otherValue) =>
                setForm({ ...form, deviceType: value, deviceTypeOther: otherValue })
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SearchableSelect
                label="Brand"
                placeholder="Search brand…"
                options={DEVICE_BRAND_OPTIONS}
                value={form.deviceBrand}
                otherValue={form.deviceBrandOther}
                onChange={(value, otherValue) =>
                  setForm({ ...form, deviceBrand: value, deviceBrandOther: otherValue })
                }
              />
              <SearchableSelect
                label="Device Model"
                placeholder="Search model…"
                options={DEVICE_MODEL_OPTIONS}
                value={form.deviceModel}
                otherValue={form.deviceModelOther}
                onChange={(value, otherValue) =>
                  setForm({ ...form, deviceModel: value, deviceModelOther: otherValue })
                }
              />
            </div>

            <Field label="Fault Description" required>
              <textarea
                required
                rows={3}
                value={form.faultDescription}
                onChange={(e) => setForm({ ...form, faultDescription: e.target.value })}
                className="stackfix-form-input resize-y min-h-[88px]"
                placeholder="What's wrong with the device?"
              />
              <button
                type="button"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                <Sparkles className="size-3" /> Auto-suggest with AI
              </button>
            </Field>

            <Field label="Device Photo" optional>
              <button
                type="button"
                className="w-full p-6 border-2 border-dashed border-border rounded-xl hover:border-brand/50 transition-colors flex flex-col items-center gap-2 text-muted-foreground"
              >
                <Upload className="size-5" />
                <span className="text-sm font-semibold">Upload or drag image</span>
                <span className="text-xs">PNG, JPG up to 10MB · coming soon</span>
              </button>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand text-ink font-bold rounded-xl hover:brightness-95 transition-all disabled:opacity-60"
            >
              {loading ? "Creating…" : "Create Repair Ticket"}
            </button>
          </form>

          <div className="space-y-4">
            <div className="bg-ink text-white rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -bottom-10 -right-10 size-32 bg-brand/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="size-4 text-brand" />
                  <h3 className="font-semibold text-sm">AI Assist</h3>
                </div>
                <p className="text-xs text-white/70 mb-4 leading-relaxed">
                  Suggestions based on device type. Long-term learning from your workshop data coming in Phase 5.
                </p>
                <div className="space-y-2">
                  {faultSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, faultDescription: s }))}
                      className="w-full text-left text-xs px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Notifications
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-brand" /> SMS via MTN/Airtel (primary)
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-brand" /> WhatsApp updates (primary)
                </li>
                <li className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-muted-foreground/40" /> Email (optional)
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
