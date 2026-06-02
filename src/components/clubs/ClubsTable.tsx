import { Link } from "@tanstack/react-router";
import { MoreHorizontal, Archive, Pencil, ArrowUpRight, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Club, Team } from "@/types";

interface Props {
  clubs: Club[];
  teams: Team[];
  onEdit: (c: Club) => void;
  onArchive: (c: Club) => void;
}

export function ClubsTable({ clubs, teams, onEdit, onArchive }: Props) {
  if (!clubs.length) {
    return (
      <div className="glass rounded-2xl py-16 text-center">
        <Building2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-60" />
        <div className="text-sm text-muted-foreground">Nenhum clube cadastrado.</div>
      </div>
    );
  }
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface/40 sticky top-0">
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-medium px-5 py-3">Clube</th>
            <th className="text-left font-medium px-3 py-3">Cidade</th>
            <th className="text-right font-medium px-3 py-3">Times</th>
            <th className="text-right font-medium px-3 py-3">Atletas</th>
            <th className="text-left font-medium px-3 py-3">Criado</th>
            <th className="text-left font-medium px-3 py-3">Status</th>
            <th className="text-right font-medium px-5 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {clubs.map((c, i) => {
            const tCount = teams.filter((t) => t.club_id === c.id && !t.archived).length;
            return (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="border-t border-border/30 hover:bg-surface/30 transition group"
              >
                <td className="px-5 py-3">
                  <Link
                    to="/clubs/$clubId"
                    params={{ clubId: c.id }}
                    className="flex items-center gap-3"
                  >
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={c.name}
                        className="h-10 w-10 rounded-lg object-cover shrink-0 border border-border"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-lg grid place-items-center text-[10px] font-bold tracking-wider shrink-0"
                        style={{
                          background: `color-mix(in oklab, ${c.primary_color ?? "#00FF88"} 20%, transparent)`,
                          color: c.primary_color ?? "#00FF88",
                        }}
                      >
                        {c.short_name}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate inline-flex items-center gap-1.5">
                        {c.name}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition" />
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{c.country ?? "—"}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{c.city}{c.state ? ` · ${c.state}` : ""}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">{tCount}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">{c.active_athletes}</td>
                <td className="px-3 py-3 text-muted-foreground text-xs">
                  {new Date(c.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-3 py-3">
                  {c.archived ? (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      Arquivado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Ativo
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 rounded-md hover:bg-surface grid place-items-center text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/clubs/$clubId" params={{ clubId: c.id }}>
                          <ArrowUpRight className="h-3.5 w-3.5 mr-2" /> Ver detalhes
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(c)} className="cursor-pointer">
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchive(c)} className="cursor-pointer">
                        <Archive className="h-3.5 w-3.5 mr-2" /> {c.archived ? "Reativar" : "Arquivar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
