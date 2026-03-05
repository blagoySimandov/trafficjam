import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MatsimMode } from "../../../../../types";
import { ChartSkeleton } from "../chart-skeleton";

type TransformedChartData = {
  distanceBin: string;
} & Record<MatsimMode, number>;

interface ModeShareDistanceChartProps {
  data?: TransformedChartData[];
  isLoading: boolean;
}

export function ModeShareDistanceChart({
  data,
  isLoading,
}: ModeShareDistanceChartProps) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <XAxis
          dataKey="distanceBin"
          stroke="rgba(255,255,255,0.3)"
          fontSize={10}
          angle={-30}
          textAnchor="end"
          height={40}
        />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} width={40} />
        <Tooltip
          contentStyle={{
            background: "rgba(15,15,20,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Bar dataKey="car" stackId="a" fill="#fd805d" />
        <Bar dataKey="walk" stackId="a" fill="#4ecdc4" />
        <Bar dataKey="bike" stackId="a" fill="#ffe66d" />
        <Bar dataKey="pt" stackId="a" fill="#a78bfa" />
      </BarChart>
    </ResponsiveContainer>
  );
}
