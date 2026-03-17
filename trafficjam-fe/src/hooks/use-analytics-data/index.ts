import { useModeShare } from "./use-mode-share";
import { useTripStats } from "./use-trip-stats";
import { useLegHistogram } from "./use-leg-histogram";
import { useModeShareByDistance } from "./use-mode-share-by-distance";
import { useScoreStats } from "./use-score-stats";

export function useAnalyticsData(scenarioId: string, runId: string) {
  const modeShare = useModeShare(scenarioId, runId);
  const { tripStats, populationTripStats } = useTripStats(scenarioId, runId);
  const legHistogram = useLegHistogram(scenarioId, runId);
  const modeShareByDistance = useModeShareByDistance(scenarioId, runId);
  const scoreStats = useScoreStats(scenarioId, runId);

  return { modeShare, tripStats, populationTripStats, legHistogram, modeShareByDistance, scoreStats };
}
