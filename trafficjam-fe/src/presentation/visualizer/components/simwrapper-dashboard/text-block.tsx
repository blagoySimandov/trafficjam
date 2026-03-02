import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { simulationApi } from "../../../../api/trafficjam-be";
import type { DashboardElement } from "./types";
import styles from "./simwrapper-dashboard.module.css";

interface TextBlockProps {
  element: DashboardElement;
  scenarioId: string;
  runId: string;
}

export function TextBlock({ element, scenarioId, runId }: TextBlockProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["text-block", scenarioId, runId, element.file],
    queryFn: () => simulationApi.getSimwrapperFile<string>(scenarioId, runId, element.file!),
    enabled: !!element.file,
    staleTime: Infinity,
  });

  if (element.text) return <pre className={styles.textBlock}>{element.text}</pre>;
  if (isLoading) return <Loader2 size={20} className="animate-spin" />;
  if (!data) return null;

  return <pre className={styles.textBlock}>{data}</pre>;
}
