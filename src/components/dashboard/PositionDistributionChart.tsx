import { ResponsiveContainer, RadialBar, RadialBarChart, Tooltip, Legend } from "recharts";

export interface PositionDatum {
  name: string;
  value: number;
  fill: string;
}

const POS_COLORS = [
  "oklch(0.86 0.27 152)",
  "oklch(0.65 0.18 252)",
  "oklch(0.83 0.16 85)",
  "oklch(0.65 0.24 25)",
  "oklch(0.7 0.18 310)",
  "oklch(0.72 0.15 200)",
  "oklch(0.72 0.18 40)",
  "oklch(0.78 0.16 130)",
  "oklch(0.7 0.2 340)",
];

export function colorForIndex(i: number) {
  return POS_COLORS[i % POS_COLORS.length];
}

export function PositionDistributionChart({ data }: { data: PositionDatum[] }) {
  return (
    <div className="h-72 -mx-2">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart innerRadius="30%" outerRadius="100%" data={data} startAngle={90} endAngle={-270}>
          <RadialBar background={{ fill: "oklch(0.17 0.008 240)" }} dataKey="value" cornerRadius={6} />
          <Tooltip
            contentStyle={{
              background: "oklch(0.13 0.006 240)",
              border: "1px solid oklch(0.22 0.008 240)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
