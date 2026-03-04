import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ScoreStatRow } from "../../../../../types";
import { ChartSkeleton } from "../chart-skeleton";

interface ScoreConvergenceChartProps {
  data?: ScoreStatRow[];
  isLoading: boolean;
}

export function ScoreConvergenceChart({
  data,
  isLoading,
}: ScoreConvergenceChartProps) {
  if (isLoading) return <ChartSkeleton />;
  if (!data?.length) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <XAxis
          dataKey="ITERATION"
          stroke="rgba(255,255,255,0.3)"
          fontSize={10}
        />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} width={50} />
        <Tooltip
          contentStyle={{
            background: "rgba(15,15,20,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8,
            color: "#fff",
          }}
        />
        <Line
          type="monotone"
          dataKey="avg_executed"
          stroke="#fd805d"
          dot={false}
          name="Avg Executed"
        />
        <Line
          type="monotone"
          dataKey="avg_worst"
          stroke="#4ecdc4"
          dot={false}
          name="Avg Worst"
        />
        <Line
          type="monotone"
          dataKey="avg_best"
          stroke="#ffe66d"
          dot={false}
          name="Avg Best"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
