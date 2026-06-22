"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Wallet,
  UserCog,
  Settings,
  Search,
  Plus,
  Menu,
  X,
  MessageSquare,
  LogOut,
  User,
  ChevronDown,
  History,
} from "lucide-react";
import {
  StackFixLogo,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@stackfix/ui";
import { useState, type ReactNode, useEffect, useRef } from "react";
import { canAccessFinancials, canViewTeam, canViewActivityLog } from "@stackfix/utils";
import { useRoleLabel } from "@/lib/i18n-labels";
import { useAuth } from "./AuthProvider";
import { useSearch } from "./SearchProvider";
import { useTranslation } from "react-i18next";
import { LogoutConfirmDialog } from "./LogoutConfirmDialog";
import { NotificationBell } from "./NotificationBell";

const adminNav = [
  { href: "/", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/tickets", labelKey: "nav.tickets", icon: Wrench },
  { href: "/messages", labelKey: "nav.messages", icon: MessageSquare },
  { href: "/invoices", labelKey: "nav.invoices", icon: FileText, financial: true },
  { href: "/payments", labelKey: "nav.payments", icon: Wallet, financial: true },
  { href: "/team", labelKey: "nav.team", icon: UserCog, teamOnly: true },
  { href: "/activity", labelKey: "nav.activity", icon: History, activityOnly: true },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

const techNav = [
  { href: "/", labelKey: "nav.myDashboard", icon: LayoutDashboard },
  { href: "/tickets", labelKey: "nav.myTickets", icon: Wrench },
  { href: "/messages", labelKey: "nav.messages", icon: MessageSquare },
  { href: "/tickets/new", labelKey: "nav.newTicket", icon: Plus },
  { href: "/settings", labelKey: "nav.settings", icon: Settings },
];

const profileTriggerClassName =
  "flex items-center gap-1.5 rounded-full border-0 pl-1 pr-2 py-1 shadow-none outline-none ring-0 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-card data-[state=open]:bg-muted data-[state=open]:ring-0 data-[state=open]:ring-offset-0";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const roleLabel = useRoleLabel(user?.role);
  const { query, setQuery, submitSearch } = useSearch();
  const searchRef = useRef<HTMLInputElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const navItems =
    user?.role === "technician"
      ? techNav
      : adminNav.filter((n) => {
          if (n.financial && user && !canAccessFinancials(user.role)) return false;
          if (n.teamOnly && user && !canViewTeam(user.role)) return false;
          if (n.activityOnly && user && !canViewActivityLog(user.role)) return false;
          return true;
        });
  const initials = user?.fullName
    ?.split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const requestLogout = () => {
    setLogoutOpen(true);
    setProfileOpen(false);
  };

  const SidebarContent = (
    <>
      <div className="p-6 flex items-center justify-between">
        <StackFixLogo variant="light" iconSrc="/brand/stackfix-icon.png" />
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-white/60 hover:text-white"
          aria-label={t("shell.closeMenu")}
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-brand/15 text-brand"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="size-4" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-3">
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-white/5 text-xs">
            <p className="font-semibold text-white truncate">{user.fullName}</p>
            <p className="text-white/50 truncate mt-0.5">{user.email}</p>
            <p className="text-brand font-bold uppercase tracking-wider mt-1">{roleLabel}</p>
          </div>
        )}
        <button
          onClick={requestLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut className="size-4" />
          {t("nav.logout")}
        </button>
      </div>
    </>
  );

  return (
    <>
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-64 bg-ink text-white flex-col shrink-0 hidden lg:flex sticky top-0 h-screen">
        {SidebarContent}
      </aside>

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

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-border px-4 sm:px-6 flex items-center gap-3 justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden size-9 grid place-items-center rounded-full hover:bg-muted"
            aria-label={t("shell.openMenu")}
          >
            <Menu className="size-5" />
          </button>

          <form
            className="hidden sm:flex items-center gap-2 bg-muted rounded-full px-4 py-2 flex-1 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <Search className="size-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="bg-transparent outline-none text-sm flex-1 min-w-0 placeholder:text-muted-foreground"
            />
            <kbd className="hidden md:inline text-[10px] font-mono text-muted-foreground bg-white border border-border rounded px-1.5 py-0.5 shrink-0">
              ⌘K
            </kbd>
          </form>

          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            <NotificationBell />

            <Link
              href="/tickets/new"
              className="px-3 sm:px-4 py-2 bg-ink text-white rounded-full font-semibold text-sm hover:bg-ink/90 transition-all flex items-center gap-1.5"
            >
              <Plus className="size-4 text-brand" />
              <span className="hidden sm:inline">{t("nav.newRepair")}</span>
            </Link>

            <DropdownMenu modal={false} open={profileOpen} onOpenChange={setProfileOpen}>
              <DropdownMenuTrigger className={profileTriggerClassName} aria-label={t("shell.accountMenu")}>
                <span className="size-8 rounded-full bg-brand/15 text-brand grid place-items-center text-xs font-bold">
                  {initials}
                </span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={10} className="w-56 p-2 bg-white shadow-xl">
                <DropdownMenuLabel className="px-2.5 py-2 font-normal">
                  <span className="text-sm font-semibold text-foreground">{user?.fullName}</span>
                  <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                    {roleLabel}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="size-4" /> {t("shell.profile")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="size-4" /> {t("shell.appSettings")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onSelect={(event) => {
                    event.preventDefault();
                    requestLogout();
                  }}
                >
                  <LogOut className="size-4" /> {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>

    <LogoutConfirmDialog
      open={logoutOpen}
      onOpenChange={setLogoutOpen}
      onConfirm={logout}
    />
    </>
  );
}
