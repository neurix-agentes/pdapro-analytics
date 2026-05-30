import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

export interface IntensityPoint {
  label: string;
  baixa: number;
  media: number;
  alta: number;
}

export function IntensityChart({ data }: { data: IntensityPoint[] }) {
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.008 240)" vertical={false} />
          <XAxis dataKey="label" stroke="oklch(0.62 0.012 240)" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="oklch(0.62 0.012 240)" fontSize={11} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.13 0.006 240)",
              border: "1px solid oklch(0.22 0.008 240)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="baixa" stackId="i" fill="oklch(0.7 0.12 200)" radius={[0, 0, 0, 0]} />
          <Bar dataKey="media" stackId="i" fill="oklch(0.83 0.16 85)" />
          <Bar dataKey="alta" stackId="i" fill="oklch(0.65 0.24 25)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
