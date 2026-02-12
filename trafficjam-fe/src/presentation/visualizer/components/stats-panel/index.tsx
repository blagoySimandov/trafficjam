import { useState } from "react";
import {
  AreaChart,
  Area,
  ReferenceLine,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { ChevronUp } from "lucide-react";
import { formatSimulationTime } from "../../utils/format-time";
import type { TripStats } from "../../hooks/use-trip-stats";
import styles from "./stats-panel.module.css";

interface StatsPanelProps {
  stats: TripStats;
  currentTime: number;
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function Sparkline({
  data,
  currentTime,
}: {
  data: { time: number; count: number }[];
  currentTime: number;
}) {
  return (
    <div className={styles.sparkline}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fd805d" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#fd805d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#fd805d"
            strokeWidth={1.5}
            fill="url(#sparkFill)"
            isAnimationActive={false}
          />
          <ReferenceLine
            x={data.findIndex((d) => d.time >= currentTime)}
            stroke="rgba(255,255,255,0.5)"
            strokeDasharray="2 2"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatsPanel({ stats, currentTime }: StatsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={styles.panel}>
      <div className={styles.header} onClick={() => setCollapsed((c) => !c)}>
        <span className={styles.title}>Statistics</span>
        <ChevronUp
          size={14}
          className={`${styles.toggleIcon} ${collapsed ? styles.toggleIconCollapsed : ""}`}
        />
      </div>

      {!collapsed && (
        <div className={styles.body}>
          <div className={styles.liveCount}>
            <div className={styles.liveNumber}>{stats.activeVehicles}</div>
            <div className={styles.liveLabel}>Active Vehicles</div>
          </div>

          <div className={styles.grid}>
            <StatCard value={String(stats.totalTrips)} label="Total Trips" />
            <StatCard
              value={`${stats.avgMovingSpeedKmh.toFixed(1)} km/h`}
              label="Avg Speed"
            />
            <StatCard
              value={`${stats.peakVehicles.count} @ ${formatSimulationTime(stats.peakVehicles.time)}`}
              label="Peak"
            />
          </div>

          <Sparkline
            data={stats.vehicleCountTimeSeries}
            currentTime={currentTime}
          />
        </div>
      )}
    </div>
  );
}
