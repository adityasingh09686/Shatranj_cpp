import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';

interface ChessClockProps {
  timeMs: number;
  isActive: boolean;
  onTimeout: () => void;
  label?: string;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  timeMs,
  isActive,
  onTimeout,
  label
}) => {
  useEffect(() => {
    if (isActive && timeMs <= 0) {
      onTimeout();
    }
  }, [isActive, timeMs, onTimeout]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (totalSeconds < 10) {
      const tenths = Math.floor((ms % 1000) / 100);
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${tenths}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = isActive && timeMs > 0 && timeMs <= 30000;

  return (
    <div
      className={`digital-clock ${isActive ? 'active' : ''} ${
        isLowTime ? 'low-time' : ''
      }`}
      title={label ? `${label} Clock` : 'Chess Clock'}
    >
      <Clock size={14} className={isActive ? 'animate-pulse' : ''} />
      <span>{formatTime(timeMs)}</span>
    </div>
  );
};
