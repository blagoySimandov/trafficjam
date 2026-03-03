import type { TripStat, PopulationTripStat } from "../../../../../types";
import { ChartSkeleton } from "../chart-skeleton";
import styles from "./trip-stats-cards.module.css";

interface TripStatsCardsProps {
  tripStats?: TripStat[];
  populationTripStats?: PopulationTripStat[];
  isLoading: boolean;
}

interface CardData {
  label: string;
  value: string;
}

function extractCards(
  tripStats?: TripStat[],
  populationTripStats?: PopulationTripStat[],
): CardData[] {
  const cards: CardData[] = [];
  const trip = tripStats?.[0];
  const pop = populationTripStats?.[0];

  if (trip) {
    for (const [key, value] of Object.entries(trip)) {
      if (typeof value === "number") {
        cards.push({ label: key, value: value.toLocaleString() });
      }
    }
  }

  if (pop) {
    for (const [key, value] of Object.entries(pop)) {
      if (typeof value === "number") {
        cards.push({ label: key, value: value.toLocaleString() });
      }
    }
  }

  return cards.slice(0, 6);
}

export function TripStatsCards({
  tripStats,
  populationTripStats,
  isLoading,
}: TripStatsCardsProps) {
  if (isLoading) return <ChartSkeleton />;

  const cards = extractCards(tripStats, populationTripStats);
  if (!cards.length) return null;

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <div key={card.label} className={styles.card}>
          <span className={styles.value}>{card.value}</span>
          <span className={styles.label}>{card.label}</span>
        </div>
      ))}
    </div>
  );
}
