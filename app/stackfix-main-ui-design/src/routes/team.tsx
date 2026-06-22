import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { Plus, Trash2, Copy, Check, X } from "lucide-react";

export const Route = createFileRoute("/team")({
  head: () => ({ meta: [{ title: "Team — StackFix" }] }),
  component: Team,
});

type Member = {
  id: string;
  name: string;
  contact: string;
  role: "Admin" | "Technician";
  tickets: number;
  status: "Active" | "Pending";
  password?: string;
};

const initial: Member[] = [
  { id: "m1", name: "Kevin Eric", contact: "+250 788 000 000", role: "Admin", tickets: 142, status: "Active" },
  { id: "m2", name: "Sarah Umutoni", contact: "sarah@stackfix.app", role: "Technician", tickets: 98, status: "Active" },
  { id: "m3", name: "Moses Rwema", contact: "+250 788 411 220", role: "Technician", tickets: 76, status: "Active" },
  { id: "m4", name: "Eric Kabera", contact: "eric.k@stackfix.app", role: "Technician", tickets: 64, status: "Pending" },
];

const genPassword = () => {
  const words = ["Kigali", "Volta", "Cobalt", "Nimbus", "Echo", "Quartz", "Falcon", "Onyx"];
  return `${words[Math.floor(Math.random() * words.length)]}-${Math.floor(1000 + Math.random() * 9000)}`;
};

function Team() {
  const [members, setMembers] = useState<Member[]>(initial);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState<"Admin" | "Technician">("Technician");
  const [created, setCreated] = useState<Member | null>(null);
  const [copied, setCopied] = useState(false);

  const addMember = () => {
    if (!name.trim() || !contact.trim()) return;
    const m: Member = {
      id: `m${Date.now()}`,
      name: name.trim(),
      contact: contact.trim(),
      role,
      tickets: 0,
      status: "Pending",
      password: genPassword(),
    };
    setMembers((prev) => [m, ...prev]);
    setCreated(m);
    setName(""); setContact(""); setRole("Technician");
  };

  const closeAll = () => { setOpen(false); setCreated(null); setCopied(false); };

  const remove = (id: string) => {
    if (confirm("Remove this team member? They will lose dashboard access immediately.")) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-[1400px] mx-auto">
        <div className="flex items-end justify-between mb-8 gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground">Manage admins and technicians.</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="px-4 py-2.5 bg-brand text-ink rounded-xl font-bold text-sm flex items-center gap-1.5 hover:brightness-95"
          >
            <Plus className="size-4" /> Add Member
          </button>
        </div>

        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-semibold">Member</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Contact</th>
                  <th className="px-6 py-3 font-semibold">Tickets</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-brand/15 text-brand font-bold grid place-items-center text-xs">
                          {m.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-semibold text-sm">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{m.role}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{m.contact}</td>
                    <td className="px-6 py-4 text-sm font-bold">{m.tickets}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md ${m.status === "Active" ? "bg-brand/10 text-brand" : "bg-amber-100 text-amber-700"}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => remove(m.id)}
                        className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors ml-auto"
                        aria-label="Remove member"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add modal */}
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/60 backdrop-blur-sm" onClick={closeAll}>
          <div
            className="bg-card rounded-3xl border border-border shadow-xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={closeAll} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" aria-label="Close">
              <X className="size-5" />
            </button>

            {!created ? (
              <>
                <h2 className="text-lg font-bold mb-1">Add team member</h2>
                <p className="text-sm text-muted-foreground mb-5">A login password will be generated for them.</p>
                <div className="space-y-3">
                  <input
                    autoFocus
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm outline-none focus:border-brand"
                  />
                  <input
                    placeholder="Phone or email"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="w-full px-4 py-3 bg-muted/50 border border-border rounded-xl text-sm outline-none focus:border-brand"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    {(["Technician", "Admin"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          role === r ? "bg-brand text-ink border-brand" : "bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button onClick={closeAll} className="flex-1 py-2.5 bg-muted rounded-xl text-sm font-semibold hover:bg-muted/80">
                    Cancel
                  </button>
                  <button onClick={addMember} className="flex-1 py-2.5 bg-ink text-white rounded-xl text-sm font-bold hover:bg-ink/90">
                    Create & generate password
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold mb-1">Member created</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Share this temporary password with <span className="font-semibold text-foreground">{created.name}</span>. They'll be marked Active after first login.
                </p>
                <div className="bg-ink rounded-2xl p-5 text-white relative overflow-hidden mb-4">
                  <div className="absolute -top-10 -right-10 size-32 bg-brand/15 blur-3xl" />
                  <div className="relative">
                    <p className="text-[10px] uppercase tracking-widest text-brand font-bold mb-1">Temporary password</p>
                    <div className="flex items-center justify-between gap-3">
                      <code className="font-mono text-xl font-bold">{created.password}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(created.password ?? "");
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1500);
                        }}
                        className="size-9 grid place-items-center rounded-lg bg-white/10 hover:bg-white/20"
                        aria-label="Copy password"
                      >
                        {copied ? <Check className="size-4 text-brand" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={closeAll} className="w-full py-2.5 bg-brand text-ink rounded-xl text-sm font-bold hover:brightness-95">
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
