import {
  Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export interface LoadPoint {
  label: string;
  km: number;
  avg: number;
}

const tooltipStyle = {
  background: "oklch(0.13 0.006 240)",
  border: "1px solid oklch(0.22 0.008 240)",
  borderRadius: 12,
  fontSize: 12,
};

export function WeeklyLoadChart({ data }: { data: LoadPoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.86 0.27 152)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="oklch(0.86 0.27 152)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 240)" vertical={false} />
          <XAxis dataKey="label" stroke="oklch(0.62 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="oklch(0.62 0.012 240)" fontSize={11} tickLine={false} axisLine={false} width={32} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => `${v.toFixed(1)} km`} />
          <Area type="monotone" dataKey="km" name="Carga" stroke="oklch(0.86 0.27 152)" strokeWidth={2.5} fill="url(#loadGrad)" />
          <Line type="monotone" dataKey="avg" name="Média clube" stroke="oklch(0.65 0.18 252)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
