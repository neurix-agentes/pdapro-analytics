import { Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Activity, Flame, FileBarChart, MapPinned, Settings,
  Search, Upload, PanelLeftClose, PanelLeftOpen, Building2, ShieldCheck, LogOut,
} from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { ClubSwitcher } from "@/components/app/ClubSwitcher";
import { TeamSwitcher } from "@/components/app/TeamSwitcher";
import { NotificationsPopover } from "@/components/app/NotificationsPopover";
import { Breadcrumbs } from "@/components/app/Breadcrumbs";
import { SeasonSwitcher } from "@/components/app/SeasonSwitcher";
import { SecurityPostureBanner } from "@/components/app/SecurityPostureBanner";
import { useSidebarStore } from "@/store";
import { useSession, signOut } from "@/hooks/useAuth";
import { useMyClubIds } from "@/hooks/queries";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clubs",     label: "Clubes",     icon: Building2 },
  { to: "/teams",     label: "Times",      icon: ShieldCheck },
  { to: "/athletes",  label: "Atletas",    icon: Users },
  { to: "/sessions",  label: "Sessões",    icon: Activity },
  { to: "/heatmaps",  label: "Heatmaps",   icon: Flame },
  { to: "/reports",   label: "Relatórios", icon: FileBarChart },
  { to: "/fields",    label: "Campos",     icon: MapPinned },
  { to: "/settings",  label: "Configurações", icon: Settings },
] as const;

function displayName(user: { user_metadata?: Record<string, unknown>; email?: string | null } | null) {
  if (!user) return "";
  const meta = user.user_metadata ?? {};
  return (meta.name as string) || (meta.full_name as string) || (user.email?.split("@")[0] ?? "");
}

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const { user, loading } = useSession();
  const myClubs = useMyClubIds();

  // Guard: not signed in → /auth
  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  // Onboarding: signed in but no clubs → /onboarding
  useEffect(() => {
    if (
      user &&
      !myClubs.isLoading &&
      (myClubs.data?.length ?? 0) === 0 &&
      pathname !== "/onboarding"
    ) {
      router.navigate({ to: "/onboarding" });
    }
  }, [user, myClubs.isLoading, myClubs.data, pathname, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground text-sm">
        Carregando…
      </div>
    );
  }

  const name = displayName(user);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={`hidden lg:flex shrink-0 flex-col border-r border-border/60 bg-[color:var(--sidebar)] sticky top-0 h-screen transition-all duration-300 ${
          collapsed ? "w-[72px]" : "w-72"
        }`}
      >
        <div className="px-4 pt-5 pb-3 flex items-center justify-between">
          {!collapsed ? <Logo /> : <div className="mx-auto h-9 w-9 rounded-xl bg-primary/15 grid place-items-center text-primary font-bold">P</div>}
          {!collapsed && (
            <button
              onClick={toggle}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface/60 grid place-items-center transition"
              aria-label="Colapsar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-3 pb-3 space-y-2">
          {collapsed ? (
            <div className="flex justify-center"><ClubSwitcher compact /></div>
          ) : (
            <>
              <ClubSwitcher />
              <TeamSwitcher />
              <SeasonSwitcher />
            </>
          )}
        </div>

        <div className="px-3"><div className="h-px bg-border/60" /></div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {!collapsed && (
            <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Plataforma
            </div>
          )}
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                } ${collapsed ? "justify-center px-0" : ""}`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary glow-primary"
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/60 space-y-2">
          {!collapsed && (
            <Link
              to="/sessions"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition glow-primary"
            >
              <Upload className="h-4 w-4" /> Nova sessão
            </Link>
          )}
          {collapsed && (
            <button
              onClick={toggle}
              className="mx-auto h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface/60 grid place-items-center transition"
              aria-label="Expandir"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          {!collapsed && (
            <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 hover:bg-surface/60 transition">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground font-bold text-xs grid place-items-center">
                {name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{name}</div>
                <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-4 px-6 lg:px-8 py-3">
            <Breadcrumbs />
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar atletas, sessões…"
                className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-12 py-2 text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 transition"
              />
              <kbd className="hidden md:inline-flex absolute right-2 top-1/2 -translate-y-1/2 h-5 px-1.5 rounded border border-border bg-surface text-[10px] text-muted-foreground items-center">
                ⌘K
              </kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" /> Operacional
              </span>
              <NotificationsPopover />
              <UserMenu name={name} email={user.email ?? ""} />
            </div>
          </div>
        </header>

        {import.meta.env.DEV && <SecurityPostureBanner />}

        <main className="flex-1 px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function UserMenu({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/auth" });
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground font-bold text-xs grid place-items-center">
        {name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "?"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-xl border-border">
        <DropdownMenuLabel>
          <div className="text-sm font-semibold">{name}</div>
          <div className="text-[11px] text-muted-foreground">{email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/settings">Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to="/settings">Configurações</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
