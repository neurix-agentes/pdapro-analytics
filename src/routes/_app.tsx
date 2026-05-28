import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";

// Pathless layout — wraps dashboard area routes with sidebar shell.
export const Route = createFileRoute("/_app")({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
