import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

interface WorkTimerProps {
  startTime: string; // ISO timestamp
  isRunning: boolean;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function WorkTimer({ startTime, isRunning }: WorkTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    
    const updateElapsed = () => {
      const now = Date.now();
      const diff = Math.floor((now - start) / 1000);
      setElapsed(Math.max(0, diff));
    };

    // Initial calculation
    updateElapsed();

    // Only tick if running
    if (isRunning) {
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, isRunning]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-md font-mono text-lg font-semibold">
      <Timer className="w-5 h-5 animate-pulse" />
      <span>{formatDuration(elapsed)}</span>
    </div>
  );
}
