import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, MoreHorizontal, ArrowRightLeft, Trash2, Eye, Users } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Athlete } from "@/types";

interface Props {
  athletes: Athlete[];
  onTransfer: (a: Athlete) => void;
}

export function RosterTable({ athletes, onTransfer }: Props) {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState<string>("__all__");

  const positions = useMemo(
    () => Array.from(new Set(athletes.map((a) => a.position))),
    [athletes],
  );

  const list = useMemo(
    () => athletes.filter((a) => {
      if (pos !== "__all__" && a.position !== pos) return false;
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    }),
    [athletes, q, pos],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar atleta…"
            className="w-full rounded-xl bg-surface/60 border border-border pl-9 pr-3 py-2 text-sm outline-none focus:border-primary/50 transition"
          />
        </div>
        <Select value={pos} onValueChange={setPos}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Posição" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas posições</SelectItem>
            {positions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">{list.length} atleta(s)</span>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface/40">
            <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-medium px-5 py-3">Atleta</th>
              <th className="text-left font-medium px-3 py-3">Posição</th>
              <th className="text-right font-medium px-3 py-3">Idade</th>
              <th className="text-right font-medium px-3 py-3">Altura</th>
              <th className="text-right font-medium px-3 py-3">Status</th>
              <th className="text-right font-medium px-5 py-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground text-sm">
                <Users className="h-6 w-6 mx-auto mb-2 opacity-50" /> Sem atletas neste filtro.
              </td></tr>
            )}
            {list.map((a, i) => (
              <motion.tr
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.01 }}
                className="border-t border-border/30 hover:bg-surface/30 transition"
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/30 to-info/30 grid place-items-center text-xs font-bold">
                      {a.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
                    </div>
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground">#{a.jersey_number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    {a.position}
                  </span>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{a.age}</td>
                <td className="px-3 py-3 text-right text-muted-foreground tabular-nums">{a.height_cm} cm</td>
                <td className="px-3 py-3 text-right">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> ativo
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="h-8 w-8 rounded-md hover:bg-surface grid place-items-center text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover/95 backdrop-blur-xl">
                      <DropdownMenuItem className="cursor-pointer"><Eye className="h-3.5 w-3.5 mr-2" /> Ver perfil</DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => onTransfer(a)}>
                        <ArrowRightLeft className="h-3.5 w-3.5 mr-2" /> Transferir
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
