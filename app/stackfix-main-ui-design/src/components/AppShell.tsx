import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Wallet,
  UserCog,
  Settings,
  Search,
  Plus,
  Bell,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  CheckCircle2,
  Send,
} from "lucide-react";
import { StackFixLogo } from "./StackFixLogo";
import { useState, type ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tickets", label: "Repair Tickets", icon: Wrench },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/payments", label: "Payments", icon: Wallet },
  { to: "/team", label: "Team", icon: UserCog },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <StackFixLogo variant="light" />
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-white/60 hover:text-white"
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-brand/15 text-brand"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-3">
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1.5 font-semibold">
            MoMo Balance
          </div>
          <div className="text-base font-bold text-white">RWF 450,200</div>
          <div className="text-[11px] text-brand mt-1">Settled · *182#</div>
        </div>
        <Link
          to="/login"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="size-4" />
          Log out
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="w-64 bg-ink text-white flex-col shrink-0 hidden lg:flex sticky top-0 h-screen">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85%] bg-ink text-white flex flex-col h-full">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border px-4 sm:px-6 flex items-center gap-3 justify-between sticky top-0 z-20 backdrop-blur">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden size-9 grid place-items-center rounded-full hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 bg-muted rounded-full px-4 py-2 flex-1 max-w-md">
            <Search className="size-4 text-muted-foreground" />
            <input
              placeholder="Search tickets, customers, invoices…"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
            />
            <kbd className="hidden md:inline text-[10px] font-mono text-muted-foreground bg-card border border-border rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="size-9 grid place-items-center rounded-full hover:bg-muted transition-colors relative outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-brand" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-bold">Notifications</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand">3 new</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {[
                    { icon: CheckCircle2, tint: "text-emerald-600 bg-emerald-100", title: "Payment received", body: "RWF 75,000 from Kevin Ganza", time: "2m ago" },
                    { icon: Send, tint: "text-blue-700 bg-blue-100", title: "Invoice sent", body: "INV-2904 to Jean-Paul Mugisha", time: "18m ago" },
                    { icon: CheckCircle2, tint: "text-emerald-600 bg-emerald-100", title: "Payment received", body: "RWF 45,000 from Divine Uwase", time: "1h ago" },
                    { icon: Send, tint: "text-blue-700 bg-blue-100", title: "Invoice sent", body: "INV-2908 to Aimé Ndoli", time: "Yesterday" },
                  ].map((n, i) => {
                    const Icon = n.icon;
                    return (
                      <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/50 border-b border-border/50 last:border-0">
                        <div className={`size-8 rounded-lg grid place-items-center shrink-0 ${n.tint}`}>
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold">{n.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 border-t border-border text-center">
                  <button className="text-xs font-semibold text-brand hover:underline">Mark all as read</button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              to="/tickets/new"
              className="px-3 sm:px-4 py-2 bg-ink text-white rounded-full font-semibold text-sm hover:bg-ink/90 transition-all flex items-center gap-1.5"
            >
              <Plus className="size-4 text-brand" />
              <span className="hidden sm:inline">New Repair</span>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1.5 rounded-full pl-1 pr-2 py-1 hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand"
                aria-label="Account menu"
              >
                <span className="size-8 rounded-full bg-brand/15 text-brand grid place-items-center text-xs font-bold">
                  KE
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">Kevin Eric</span>
                  <span className="text-xs text-muted-foreground font-normal">Super Admin</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" search={{ open: "profile" }} className="cursor-pointer">
                    <User className="size-4 mr-2" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer">
                    <Settings className="size-4 mr-2" /> App settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/login" className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="size-4 mr-2" /> Log out
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}
