import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, BarChart2, Loader2, AlertCircle } from "lucide-react";
import { simulationApi } from "../../../../api/trafficjam-be";
import { useDashboard } from "./use-dashboard";
import { DashboardPanel } from "./dashboard-panel";
import type { DashboardInfo } from "./types";
import styles from "./simwrapper-dashboard.module.css";

interface SimWrapperDashboardProps {
  scenarioId: string;
  runId: string;
}

function useDashboardFiles(scenarioId: string, runId: string) {
  return useQuery({
    queryKey: ["simwrapper-files", scenarioId, runId],
    queryFn: () => simulationApi.listSimwrapperFiles(scenarioId, runId),
    staleTime: 60_000,
  });
}

function useDashboardList(files: string[] | undefined) {
  return useMemo(() => {
    if (!files) return [];
    return files
      .filter((f) => /^dashboard-\d+\.yaml$/.test(f))
      .sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)?.[0] ?? "0");
        const numB = parseInt(b.match(/\d+/)?.[0] ?? "0");
        return numA - numB;
      });
  }, [files]);
}

function DashboardContent({ scenarioId, runId, files }: {
  scenarioId: string;
  runId: string;
  files: string[];
}) {
  const dashboardFiles = useDashboardList(files);
  const [activeTab, setActiveTab] = useState(0);
  const activeFile = dashboardFiles[activeTab];

  const { data: config, isLoading, error } = useDashboard(scenarioId, runId, activeFile);

  if (dashboardFiles.length === 0) {
    return <EmptyState message="No dashboard data available for this run." />;
  }

  return (
    <>
      <TabBar
        dashboardFiles={dashboardFiles}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        configs={undefined}
      />
      {isLoading && <LoadingSpinner />}
      {error && <EmptyState message="Failed to load dashboard." />}
      {config && (
        <DashboardPanel config={config} scenarioId={scenarioId} runId={runId} files={files} />
      )}
    </>
  );
}

function TabBar({ dashboardFiles, activeTab, onTabChange, configs }: {
  dashboardFiles: string[];
  activeTab: number;
  onTabChange: (i: number) => void;
  configs: DashboardInfo[] | undefined;
}) {
  if (dashboardFiles.length <= 1) return null;

  return (
    <div className={styles.tabBar}>
      {dashboardFiles.map((file, i) => (
        <button
          key={file}
          className={`${styles.tab} ${i === activeTab ? styles.tabActive : ""}`}
          onClick={() => onTabChange(i)}
        >
          {configs?.[i]?.config.header?.tab ?? `Dashboard ${i + 1}`}
        </button>
      ))}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className={styles.loading}>
      <Loader2 size={32} className="animate-spin" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={styles.error}>
      <AlertCircle size={24} style={{ marginBottom: "1rem" }} />
      <p>{message}</p>
    </div>
  );
}

export function SimWrapperDashboard({ scenarioId, runId }: SimWrapperDashboardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: files, isLoading: filesLoading } = useDashboardFiles(scenarioId, runId);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const overlayRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const stop = (e: Event) => e.stopPropagation();
    node.addEventListener("wheel", stop, { capture: true });
    return () => node.removeEventListener("wheel", stop, { capture: true });
  }, []);

  return (
    <>
      <button className={styles.openButton} onClick={toggle}>
        <BarChart2 size={20} />
        Insights
      </button>

      {isOpen && (
        <div className={styles.dashboardOverlay} ref={overlayRef}>
          <div className={styles.header}>
            <h2>Run Analysis</h2>
            <button className={styles.closeButton} onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <div className={styles.content}>
            {filesLoading ? (
              <LoadingSpinner />
            ) : files ? (
              <DashboardContent scenarioId={scenarioId} runId={runId} files={files} />
            ) : (
              <EmptyState message="Analysis data not available for this run yet." />
            )}
          </div>
        </div>
      )}
    </>
  );
}
