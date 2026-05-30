import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

export interface RadarDatum {
  axis: string;
  atleta: number;
  media: number;
}

export function AthleteComparisonRadar({ data }: { data: RadarDatum[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="78%">
          <PolarGrid stroke="oklch(0.22 0.008 240)" />
          <PolarAngleAxis dataKey="axis" stroke="oklch(0.62 0.012 240)" fontSize={11} />
          <Radar name="Atleta" dataKey="atleta" stroke="oklch(0.86 0.27 152)" fill="oklch(0.86 0.27 152)" fillOpacity={0.35} />
          <Radar name="Média do time" dataKey="media" stroke="oklch(0.65 0.18 252)" fill="oklch(0.65 0.18 252)" fillOpacity={0.18} />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.13 0.006 240)",
              border: "1px solid oklch(0.22 0.008 240)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
