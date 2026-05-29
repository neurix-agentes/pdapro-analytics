import { Bell, CheckCheck } from "lucide-react";
import { useNotificationStore } from "@/store";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

const toneColor: Record<string, string> = {
  info: "text-info bg-info/10",
  success: "text-primary bg-primary/10",
  warning: "text-[oklch(0.83_0.16_85)] bg-[oklch(0.83_0.16_85/0.12)]",
};

export function NotificationsPopover() {
  const items = useNotificationStore((s) => s.items);
  const unread = useNotificationStore((s) => s.unread)();
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  return (
    <Popover>
      <PopoverTrigger className="relative h-9 w-9 rounded-xl border border-border bg-surface/60 hover:bg-surface flex items-center justify-center transition">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary glow-primary" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-popover/95 backdrop-blur-xl border-border">
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Notificações</div>
            <div className="text-[11px] text-muted-foreground">{unread} não lidas</div>
          </div>
          <button
            onClick={markAllRead}
            className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
          >
            <CheckCheck className="h-3 w-3" /> Marcar lidas
          </button>
        </div>
        <ul className="max-h-80 overflow-auto">
          {items.map((n) => (
            <li
              key={n.id}
              className={`px-4 py-3 border-b border-border/40 last:border-0 hover:bg-surface/40 transition ${n.read ? "opacity-70" : ""}`}
            >
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 h-2 w-2 rounded-full ${n.read ? "bg-muted" : "bg-primary glow-primary"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{n.title}</div>
                  {n.body && <div className="text-[11px] text-muted-foreground truncate">{n.body}</div>}
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${toneColor[n.tone ?? "info"]}`}>
                      {n.tone}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
