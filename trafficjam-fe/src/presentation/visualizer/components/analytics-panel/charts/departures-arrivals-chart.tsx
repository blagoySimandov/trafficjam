import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { LegHistogramRow } from "../../../../../types";
import { ChartSkeleton } from "../chart-skeleton";

interface DeparturesArrivalsChartProps {
  data?: LegHistogramRow[];
  isLoading: boolean;
}

function formatHour(value: unknown): string {
  const seconds = Number(value);
  return `${Math.floor(seconds / 3600)}h`;
}

export function DeparturesArrivalsChart({
  data,
  isLoading,
}: DeparturesArrivalsChartProps) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
        <XAxis
          dataKey="time"
          tickFormatter={formatHour}
          stroke="rgba(255,255,255,0.3)"
          fontSize={10}
        />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} width={40} />
        <Tooltip
          labelFormatter={formatHour}
          contentStyle={{
            background: "rgba(15,15,20,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Area
          type="monotone"
          dataKey="departures_all"
          stroke="#fd805d"
          fill="rgba(253,128,93,0.2)"
          name="Departures"
        />
        <Area
          type="monotone"
          dataKey="arrivals_all"
          stroke="#4ecdc4"
          fill="rgba(78,205,196,0.2)"
          name="Arrivals"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
