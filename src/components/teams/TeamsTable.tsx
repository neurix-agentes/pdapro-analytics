import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MoreHorizontal, Pencil, Archive, ArrowUpRight, ShieldCheck, Trash2 } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Team, Club, Coach } from "@/types";

interface Props {
  teams: Team[];
  clubs: Club[];
  coaches: Coach[];
  onEdit: (t: Team) => void;
  onArchive: (t: Team) => void;
  onDelete: (t: Team) => void;
}

export function TeamsTable({ teams, clubs, coaches, onEdit, onArchive, onDelete }: Props) {
  if (!teams.length) {
    return (
      <div className="glass rounded-2xl py-16 text-center">
        <ShieldCheck className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-60" />
        <div className="text-sm text-muted-foreground">Nenhum time encontrado para os filtros atuais.</div>
      </div>
    );
  }
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface/40 sticky top-0">
          <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="text-left font-medium px-5 py-3">Time</th>
            <th className="text-left font-medium px-3 py-3">Categoria</th>
            <th className="text-left font-medium px-3 py-3">Clube</th>
            <th className="text-right font-medium px-3 py-3">Atletas</th>
            <th className="text-left font-medium px-3 py-3">Treinador</th>
            <th className="text-left font-medium px-3 py-3">Temporada</th>
            <th className="text-right font-medium px-5 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const club = clubs.find((c) => c.id === t.club_id);
            const coach = coaches.find((c) => c.id === t.coach_id);
            return (
              <motion.tr
                key={t.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="border-t border-border/30 hover:bg-surface/30 transition group"
              >
                <td className="px-5 py-3">
                  <Link to="/teams/$teamId" params={{ teamId: t.id }} className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary grid place-items-center">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate inline-flex items-center gap-1.5">
                        {t.name}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-primary transition" />
                      </div>
                      {t.archived && (
                        <span className="text-[10px] text-muted-foreground">Arquivado</span>
                      )}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-info/10 text-info border border-info/20">
                    {t.category}
                  </span>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{club?.name ?? "—"}</td>
                <td className="px-3 py-3 text-right tabular-nums font-medium">{t.athletes_count}</td>
                <td className="px-3 py-3 text-muted-foreground text-xs">{coach?.name ?? "—"}</td>
                <td className="px-3 py-3 text-muted-foreground text-xs">{t.season ?? "—"}</td>
                <td className="px-5 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 rounded-md hover:bg-surface grid place-items-center text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl">
                      <DropdownMenuItem asChild className="cursor-pointer">
                        <Link to="/teams/$teamId" params={{ teamId: t.id }}>
                          <ArrowUpRight className="h-3.5 w-3.5 mr-2" /> Abrir time
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(t)} className="cursor-pointer">
                        <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onArchive(t)} className="cursor-pointer">
                        <Archive className="h-3.5 w-3.5 mr-2" /> {t.archived ? "Reativar" : "Arquivar"}
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
