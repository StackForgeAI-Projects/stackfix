"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, formatApiError } from "@/lib/api";
import { formatUserRole, canManageTeam, canViewTeam } from "@stackfix/utils";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Pencil, ShieldOff, ShieldCheck, Trash2, Copy, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";

type TeamMember = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  ticketCount?: number;
};

type ModalMode = "add" | "edit" | null;
type ConfirmKind = "revoke" | "restore" | "delete" | null;

function memberContact(member: TeamMember) {
  return member.email?.includes("@stackfix.app") ? member.phone ?? member.email : member.email;
}

function memberStatus(member: TeamMember, t: (key: string) => string) {
  if (!member.isActive) return { label: t("team.revoked"), className: "bg-rose-100 text-rose-700" };
  if (!member.lastLoginAt) return { label: t("team.pending"), className: "bg-amber-100 text-amber-700" };
  return { label: t("team.active"), className: "bg-brand/10 text-brand" };
}

export default function TeamPage() {
  const { t } = useTranslation(undefined, { bindI18n: "languageChanged loaded" });
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [mode, setMode] = useState<ModalMode>(null);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState<"admin" | "technician">("technician");
  const [created, setCreated] = useState<{ name: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmKind, setConfirmKind] = useState<ConfirmKind>(null);
  const [confirmTarget, setConfirmTarget] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (user && !canViewTeam(user.role)) router.replace("/");
  }, [user, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.users(),
    enabled: !!user && canViewTeam(user.role),
  });

  const openAdd = () => {
    setMode("add");
    setEditTarget(null);
    setName("");
    setContact("");
    setRole("technician");
    setCreated(null);
    setCopied(false);
  };

  const openEdit = (member: TeamMember) => {
    setMode("edit");
    setEditTarget(member);
    setName(member.fullName);
    setContact(memberContact(member) ?? "");
    setRole(member.role === "admin" ? "admin" : "technician");
    setCreated(null);
    setCopied(false);
  };

  const closeModal = () => {
    setMode(null);
    setEditTarget(null);
    setCreated(null);
    setCopied(false);
  };

  const createUser = useMutation({
    mutationFn: async () => {
      const isEmail = contact.includes("@");
      const body = {
        fullName: name.trim(),
        role,
        ...(isEmail ? { email: contact.trim().toLowerCase() } : { phone: contact.trim() }),
      };
      const res = await api.createUser(body);
      return res.data.tempPassword ?? "";
    },
    onSuccess: (password) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setCreated({ name: name.trim(), password });
    },
    onError: (e: Error) => toast.error(formatApiError(e)),
  });

  const updateUser = useMutation({
    mutationFn: async () => {
      if (!editTarget) return;
      const isEmail = contact.includes("@");
      await api.updateUser(editTarget.id, {
        fullName: name.trim(),
        role,
        ...(isEmail ? { email: contact.trim().toLowerCase() } : { phone: contact.trim() }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("team.updated");
      closeModal();
    },
    onError: (e: Error) => toast.error(formatApiError(e)),
  });

  const setAccess = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.setUserAccess(id, isActive),
    onSuccess: (_data, { isActive }) => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(isActive ? "team.restored" : "team.accessRevoked");
    },
    onError: (e: Error) => toast.error(formatApiError(e)),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("team.deleted");
    },
    onError: (e: Error) => toast.error(formatApiError(e)),
  });

  const members = (data?.data ?? []) as TeamMember[];
  const canManage = user ? canManageTeam(user.role) : false;

  if (!user || !canViewTeam(user.role)) return null;

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-8 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("team.title")}</h1>
            <p className="text-muted-foreground">{t("team.subtitle")}</p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={openAdd}
              className="px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm flex items-center gap-1.5 hover:brightness-95"
            >
              <Plus className="size-4" /> {t("team.addMember")}
            </button>
          )}
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {isLoading ? (
            <p className="p-8 text-muted-foreground">{t("team.loading")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 font-semibold">{t("team.member")}</th>
                    <th className="px-6 py-3 font-semibold">{t("team.role")}</th>
                    <th className="px-6 py-3 font-semibold">{t("team.contact")}</th>
                    <th className="px-6 py-3 font-semibold">{t("team.tickets")}</th>
                    <th className="px-6 py-3 font-semibold">{t("team.status")}</th>
                    {canManage && <th className="px-6 py-3 font-semibold text-right">{t("team.actions")}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => {
                    const status = memberStatus(m, t);
                    return (
                      <tr key={m.id} className={`hover:bg-muted/30 ${!m.isActive ? "opacity-80" : ""}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-brand/15 text-brand font-bold grid place-items-center text-xs">
                              {m.fullName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                            </div>
                            <span className="font-semibold text-sm">{m.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {formatUserRole(m.role as "super_admin" | "admin" | "technician")}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{memberContact(m)}</td>
                        <td className="px-6 py-4 text-sm font-bold">{m.ticketCount ?? 0}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${status.className}`}>
                            {status.label}
                          </span>
                        </td>
                        {canManage && (
                          <td className="px-6 py-4">
                            {m.id !== user.id && m.role !== "super_admin" && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEdit(m)}
                                  className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                  aria-label={t("team.editMember")}
                                >
                                  <Pencil className="size-4" />
                                </button>
                                {m.isActive ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmKind("revoke");
                                      setConfirmTarget(m);
                                    }}
                                    className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                    aria-label={t("team.revokeAccess")}
                                  >
                                    <ShieldOff className="size-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmKind("restore");
                                      setConfirmTarget(m);
                                    }}
                                    className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-brand/10 hover:text-brand transition-colors"
                                    aria-label={t("team.restoreAccess")}
                                  >
                                    <ShieldCheck className="size-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmKind("delete");
                                    setConfirmTarget(m);
                                  }}
                                  className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  aria-label={t("team.deleteMember")}
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {mode && canManage && (
        <div
          className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/60 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label={t("common.close")}
            >
              <X className="size-5" />
            </button>

            {!created ? (
              <>
                <h2 className="text-lg font-bold mb-1">
                  {mode === "add" ? t("team.addTitle") : t("team.editTitle")}
                </h2>
                {mode === "add" && (
                  <p className="text-sm text-muted-foreground mb-5">{t("team.addHint")}</p>
                )}
                {mode === "edit" && <div className="mb-5" />}
                <div className="space-y-3">
                  <input
                    autoFocus
                    placeholder={t("team.fullName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="stackfix-form-input"
                  />
                  <input
                    placeholder={t("team.phoneOrEmail")}
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="stackfix-form-input"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {(["technician", "admin"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          role === r
                            ? "bg-brand text-ink border-brand"
                            : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t(`team.${r}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80"
                  >
                    {t("team.cancel")}
                  </button>
                  {mode === "add" ? (
                    <button
                      type="button"
                      disabled={!name.trim() || !contact.trim() || createUser.isPending}
                      onClick={() => createUser.mutate()}
                      className="flex-[1.2] py-2.5 px-4 bg-brand text-ink rounded-xl text-sm font-bold hover:brightness-95 disabled:opacity-60"
                    >
                      {createUser.isPending ? t("team.creating") : t("team.createMember")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!name.trim() || !contact.trim() || updateUser.isPending}
                      onClick={() => updateUser.mutate()}
                      className="flex-[1.2] py-2.5 px-4 bg-brand text-ink rounded-xl text-sm font-bold hover:brightness-95 disabled:opacity-60"
                    >
                      {updateUser.isPending ? t("team.saving") : t("team.saveChanges")}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-1">{t("team.createdTitle")}</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  {t("team.createdHint", { name: created.name })}
                </p>
                <div className="bg-ink rounded-2xl p-5 text-white relative overflow-hidden mb-4">
                  <div className="absolute -top-10 -right-10 size-32 bg-brand/15 blur-3xl" />
                  <div className="relative">
                    <p className="text-[10px] uppercase tracking-widest text-brand font-bold mb-1">
                      {t("team.tempPassword")}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <code className="font-mono text-xl font-bold break-all">{created.password}</code>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard?.writeText(created.password);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="size-9 shrink-0 grid place-items-center rounded-lg bg-white/10 hover:bg-white/20"
                        aria-label={t("common.copyPassword")}
                      >
                        {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-2.5 bg-brand text-ink rounded-xl text-sm font-bold hover:brightness-95"
                >
                  {t("team.done")}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmActionDialog
        open={confirmKind === "revoke" && !!confirmTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmKind(null);
            setConfirmTarget(null);
          }
        }}
        onConfirm={async () => {
          if (confirmTarget) await setAccess.mutateAsync({ id: confirmTarget.id, isActive: false });
        }}
        title={t("team.revokeTitle")}
        description={
          confirmTarget ? t("team.revokeHint", { name: confirmTarget.fullName }) : ""
        }
        confirmLabel={t("team.revokeConfirm")}
        cancelLabel={t("common.cancel")}
        loadingLabel={t("team.revoking")}
        destructive
        icon={<ShieldOff className="size-7" strokeWidth={1.75} />}
      />

      <ConfirmActionDialog
        open={confirmKind === "restore" && !!confirmTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmKind(null);
            setConfirmTarget(null);
          }
        }}
        onConfirm={async () => {
          if (confirmTarget) await setAccess.mutateAsync({ id: confirmTarget.id, isActive: true });
        }}
        title={t("team.restoreTitle")}
        description={
          confirmTarget ? t("team.restoreHint", { name: confirmTarget.fullName }) : ""
        }
        confirmLabel={t("team.restoreConfirm")}
        cancelLabel={t("common.cancel")}
        loadingLabel={t("team.restoring")}
        icon={<ShieldCheck className="size-7" strokeWidth={1.75} />}
      />

      <ConfirmActionDialog
        open={confirmKind === "delete" && !!confirmTarget}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmKind(null);
            setConfirmTarget(null);
          }
        }}
        onConfirm={async () => {
          if (confirmTarget) await deleteUser.mutateAsync(confirmTarget.id);
        }}
        title={t("team.deleteTitle")}
        description={
          confirmTarget ? t("team.deleteHint", { name: confirmTarget.fullName }) : ""
        }
        confirmLabel={t("team.deleteConfirm")}
        cancelLabel={t("common.cancel")}
        loadingLabel={t("team.deleting")}
        destructive
        icon={<Trash2 className="size-7" strokeWidth={1.75} />}
      />
    </AppShell>
  );
}
