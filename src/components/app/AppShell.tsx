import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Activity, Flame, FileBarChart, MapPinned, Settings, Bell, Search, Upload,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/athletes", label: "Atletas", icon: Users },
  { to: "/sessions", label: "Sessões", icon: Activity },
  { to: "/heatmaps", label: "Heatmaps", icon: Flame },
  { to: "/reports", label: "Relatórios", icon: FileBarChart },
  { to: "/fields", label: "Campos", icon: MapPinned },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border/60 bg-[color:var(--sidebar)] sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-border/60">
          <Logo />
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={`group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition relative ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                }`}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary glow-primary" />}
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/60">
          <Link
            to="/sessions"
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-2.5 text-sm font-semibold hover:opacity-90 transition glow-primary"
          >
            <Upload className="h-4 w-4" /> Nova sessão
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 lg:px-8 py-3.5">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Buscar atletas, sessões…"
                className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground/60 outline-none focus:border-primary/50 transition"
              />
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button className="relative h-9 w-9 rounded-xl border border-border bg-surface/60 hover:bg-surface flex items-center justify-center transition">
                <Bell className="h-4 w-4" />
                <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary glow-primary" />
              </button>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground font-bold text-sm flex items-center justify-center">
                CT
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 lg:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
