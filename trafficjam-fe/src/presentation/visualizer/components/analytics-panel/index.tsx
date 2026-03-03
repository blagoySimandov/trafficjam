import * as ScrollArea from "@radix-ui/react-scroll-area";
import styles from "./analytics-panel.module.css";
import { ModeShareChart } from "./charts/mode-share-chart";
import { TripStatsCards } from "./charts/trip-stats-cards";
import { DeparturesArrivalsChart } from "./charts/departures-arrivals-chart";
import { ModeShareDistanceChart } from "./charts/mode-share-distance-chart";
import { ScoreConvergenceChart } from "./charts/score-convergence-chart";
import {
  useModeShare,
  useTripStats,
  useLegHistogram,
  useModeShareByDistance,
  useScoreStats,
} from "../../../../hooks";

interface AnalyticsPanelProps {
  scenarioId: string;
  runId: string;
  open: boolean;
}

export function AnalyticsPanel({
  scenarioId,
  runId,
  open,
}: AnalyticsPanelProps) {
  const modeShare = useModeShare(scenarioId, runId);
  const { tripStats, populationTripStats } = useTripStats(scenarioId, runId);
  const legHistogram = useLegHistogram(scenarioId, runId);
  const modeShareByDistance = useModeShareByDistance(scenarioId, runId);
  const scoreStats = useScoreStats(scenarioId, runId);

  return (
    <div className={`${styles.panel} ${open ? "" : styles.panelHidden}`}>
      <ScrollArea.Root style={{ height: "100%" }}>
        <ScrollArea.Viewport style={{ height: "100%", overflowY: "scroll" }}>
          <div className={styles.scrollContent}>
            <Section title="Mode Share">
              <ModeShareChart
                data={modeShare.data}
                isLoading={modeShare.isLoading}
              />
            </Section>

            <Section title="Trip Statistics">
              <TripStatsCards
                tripStats={tripStats.data}
                populationTripStats={populationTripStats.data}
                isLoading={tripStats.isLoading || populationTripStats.isLoading}
              />
            </Section>

            <Section title="Departures & Arrivals">
              <DeparturesArrivalsChart
                data={legHistogram.data}
                isLoading={legHistogram.isLoading}
              />
            </Section>

            <Section title="Mode Share by Distance">
              <ModeShareDistanceChart
                data={modeShareByDistance.data}
                isLoading={modeShareByDistance.isLoading}
              />
            </Section>

            <Section title="Score Convergence">
              <ScoreConvergenceChart
                data={scoreStats.data}
                isLoading={scoreStats.isLoading}
              />
            </Section>
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical">
          <ScrollArea.Thumb />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}
