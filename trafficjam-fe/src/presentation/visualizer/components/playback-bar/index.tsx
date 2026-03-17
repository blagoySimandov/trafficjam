import { useRef } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "../../../../utils/cn";
import { formatSimulationTime } from "../../../../utils";
import type { SimulationTimeState } from "../../hooks/use-simulation-time";
import { SPEED_OPTIONS } from "../../hooks/use-simulation-time";
import styles from "./playback-bar.module.css";

function PlayPauseButton({ isPlaying, toggle }: { isPlaying: boolean; toggle: () => void }) {
  return (
    <button className={styles.playButton} onClick={toggle}>
      {isPlaying ? <Pause size={18} /> : <Play size={18} />}
    </button>
  );
}

function TimeScrubber({ time, range, seekTo, pause, play, isPlaying }: Pick<SimulationTimeState, "time" | "range" | "seekTo" | "pause" | "play" | "isPlaying">) {
  const wasPlayingRef = useRef(false);
  return (
    <input
      className={styles.scrubber}
      type="range"
      min={range[0]}
      max={range[1]}
      step={1}
      value={time}
      onPointerDown={() => { wasPlayingRef.current = isPlaying; pause(); }}
      onChange={(e) => seekTo(Number(e.target.value))}
      onPointerUp={() => { if (wasPlayingRef.current) play(); }}
    />
  );
}

function SpeedSelector({ speed, setSpeed }: Pick<SimulationTimeState, "speed" | "setSpeed">) {
  return (
    <>
      {SPEED_OPTIONS.map((opt) => (
        <button
          key={opt}
          className={cn(styles.speedButton, opt === speed && styles.speedButtonActive)}
          onClick={() => setSpeed(opt)}
        >
          {opt}x
        </button>
      ))}
    </>
  );
}

function TimeDisplay({ time }: { time: number }) {
  return <span className={styles.clock}>{formatSimulationTime(time)}</span>;
}

export function PlaybackBar({ simulation }: { simulation: SimulationTimeState }) {
  return (
    <div className={styles.bar}>
      <PlayPauseButton isPlaying={simulation.isPlaying} toggle={simulation.togglePlayback} />
      <TimeScrubber time={simulation.time} range={simulation.range} seekTo={simulation.seekTo} pause={simulation.pause} play={simulation.play} isPlaying={simulation.isPlaying} />
      <SpeedSelector speed={simulation.speed} setSpeed={simulation.setSpeed} />
      <TimeDisplay time={simulation.time} />
    </div>
  );
}
