import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { MatsimMode, ModeUser } from "../../../../../types";
import { ChartSkeleton } from "../chart-skeleton";
import { useMemo } from "react";

const MODE_COLORS: Record<MatsimMode, string> = {
  car: "#fd805d",
  walk: "#4ecdc4",
  bike: "#ffe66d",
  pt: "#a78bfa",
};

interface ModeShareChartProps {
  data?: ModeUser[];
  isLoading: boolean;
}

function toChartData(data: ModeUser[]) {
  return data.map((d) => ({
    name: d.main_mode,
    value: Math.round(d.user * 100) / 100,
  }));
}

export function ModeShareChart({ data, isLoading }: ModeShareChartProps) {
  const chartData = useMemo(() => {
    if (!data?.length) return [];
    return toChartData(data);
  }, [data]);

  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return null;

  return (
    <PieChart width={340} height={220}>
      <Pie
        data={chartData}
        cx={170}
        cy={90}
        innerRadius={45}
        outerRadius={75}
        paddingAngle={2}
        dataKey="value"
        nameKey="name"
        fill="#8884d8"
        isAnimationActive={false}
        labelLine={false}
        label={({ name, percent }) =>
          percent ? `${name} ${(percent * 100).toFixed(0)}%` : name
        }
      >
        {chartData.map((entry, index) => (
          <Cell
            key={`cell-${index}`}
            fill={MODE_COLORS[entry.name as MatsimMode] ?? "#888"}
          />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          background: "rgba(15,15,20,0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8,
          color: "#fff",
        }}
        itemStyle={{ color: "#fff" }}
      />
      <Legend />
    </PieChart>
  );
}
