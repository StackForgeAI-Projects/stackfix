"use client";

import { api } from "@/lib/api";
import type { TicketStatus } from "@stackfix/types";
import { isValidRwandaPhone, TICKET_STATUS_OPTIONS, ticketStatusLabel } from "@stackfix/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type TicketEditData = {
  customer: { fullName: string; phone: string; email?: string | null };
  deviceType: string;
  deviceBrand?: string | null;
  deviceModel?: string | null;
  faultDescription: string;
  internalNotes?: string | null;
  status: TicketStatus;
  priority?: string;
  technician?: { id: string; fullName: string } | null;
};

type Props = {
  ticketId: string;
  ticket: TicketEditData;
  onCancel: () => void;
  onSaved: () => void;
};

export function TicketEditPanel({ ticketId, ticket, onCancel, onSaved }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customerName: ticket.customer.fullName,
    customerPhone: ticket.customer.phone,
    customerEmail: ticket.customer.email ?? "",
    deviceType: ticket.deviceType,
    deviceBrand: ticket.deviceBrand ?? "",
    deviceModel: ticket.deviceModel ?? "",
    faultDescription: ticket.faultDescription,
    internalNotes: ticket.internalNotes ?? "",
    status: ticket.status,
    priority: ticket.priority ?? "normal",
    technicianId: ticket.technician?.id ?? "",
  });

  useEffect(() => {
    setForm({
      customerName: ticket.customer.fullName,
      customerPhone: ticket.customer.phone,
      customerEmail: ticket.customer.email ?? "",
      deviceType: ticket.deviceType,
      deviceBrand: ticket.deviceBrand ?? "",
      deviceModel: ticket.deviceModel ?? "",
      faultDescription: ticket.faultDescription,
      internalNotes: ticket.internalNotes ?? "",
      status: ticket.status,
      priority: ticket.priority ?? "normal",
      technicianId: ticket.technician?.id ?? "",
    });
  }, [ticket]);

  const { data: usersData } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users(),
  });
  const technicians = ((usersData?.data ?? []) as Array<{ id: string; fullName: string; role: string }>).filter(
    (u) => u.role === "technician",
  );

  const save = useMutation({
    mutationFn: () => {
      if (!isValidRwandaPhone(form.customerPhone)) {
        throw new Error("Enter a valid Rwanda phone number");
      }
      return api.updateTicket(ticketId, {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || null,
        deviceType: form.deviceType.trim(),
        deviceBrand: form.deviceBrand.trim() || null,
        deviceModel: form.deviceModel.trim() || null,
        faultDescription: form.faultDescription.trim(),
        internalNotes: form.internalNotes.trim() || null,
        status: form.status,
        priority: form.priority,
        technicianId: form.technicianId || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ticket", ticketId] });
      qc.invalidateQueries({ queryKey: ["tickets"] });
      toast.success("Ticket updated");
      onSaved();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field = (key: keyof typeof form, label: string, type: "text" | "textarea" | "select-status" = "text") => (
    <div>
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      {type === "textarea" ? (
        <textarea
          rows={3}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="stackfix-form-input resize-y min-h-[80px]"
        />
      ) : type === "select-status" ? (
        <select
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="stackfix-form-input"
        >
          {TICKET_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {ticketStatusLabel(s)}
            </option>
          ))}
          <option value="cancelled">{ticketStatusLabel("cancelled")}</option>
        </select>
      ) : (
        <input
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className="stackfix-form-input"
        />
      )}
    </div>
  );

  return (
    <section className="bg-card rounded-2xl p-6 border border-brand/30 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Edit ticket</h3>
        <button type="button" onClick={onCancel} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
          Cancel
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {field("customerName", "Customer name")}
        {field("customerPhone", "Phone")}
        {field("customerEmail", "Email")}
        {field("deviceType", "Device type")}
        {field("deviceBrand", "Brand")}
        {field("deviceModel", "Model")}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            className="stackfix-form-input"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Technician</label>
          <select
            value={form.technicianId}
            onChange={(e) => setForm((f) => ({ ...f, technicianId: e.target.value }))}
            className="stackfix-form-input"
          >
            <option value="">Unassigned</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>
        {field("status", "Status", "select-status")}
      </div>

      {field("faultDescription", "Fault description", "textarea")}
      {field("internalNotes", "Internal notes", "textarea")}

      <button
        type="button"
        disabled={save.isPending}
        onClick={() => save.mutate()}
        className="w-full py-3 bg-brand text-ink font-bold rounded-xl hover:brightness-95 disabled:opacity-60"
      >
        {save.isPending ? "Saving…" : "Save changes"}
      </button>
    </section>
  );
}
