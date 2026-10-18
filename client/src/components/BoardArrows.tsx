import React from 'react';
import { SideColor } from '../types';

interface BoardArrowsProps {
  bestMove?: string; // e.g. "e2e4" or "g1f3"
  lastMove?: { from: string; to: string };
  threatMove?: string;
  orientation: SideColor;
  showBestMove?: boolean;
}

export const BoardArrows: React.FC<BoardArrowsProps> = ({
  bestMove,
  lastMove,
  threatMove,
  orientation,
  showBestMove = true
}) => {
  // Convert square name (e.g. "e4") to percentage center coordinate (0..100)
  const squareToPercent = (sq: string) => {
    if (!sq || sq.length < 2) return null;
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq[1], 10) - 1;
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;

    const col = orientation === 'white' ? file : 7 - file;
    const row = orientation === 'white' ? 7 - rank : rank;

    const x = col * 12.5 + 6.25;
    const y = row * 12.5 + 6.25;
    return { x, y };
  };

  const renderArrow = (
    fromSq: string,
    toSq: string,
    color: string,
    id: string,
    dashArray?: string
  ) => {
    const from = squareToPercent(fromSq);
    const to = squareToPercent(toSq);
    if (!from || !to) return null;

    // Shorten line slightly so arrowhead lands cleanly on target square center
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const targetOffset = 3.5;
    const endX = to.x - Math.cos(angle) * targetOffset;
    const endY = to.y - Math.sin(angle) * targetOffset;

    return (
      <g key={id}>
        <defs>
          <marker
            id={`arrowhead-${id}`}
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0.8, 5 3, 0 5.2" fill={color} />
          </marker>
        </defs>
        <line
          x1={`${from.x}%`}
          y1={`${from.y}%`}
          x2={`${endX}%`}
          y2={`${endY}%`}
          stroke={color}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          opacity="0.82"
          markerEnd={`url(#arrowhead-${id})`}
        />
        {/* Subtle glow circle on starting square */}
        <circle
          cx={`${from.x}%`}
          cy={`${from.y}%`}
          r="1.8"
          fill={color}
          opacity="0.65"
        />
      </g>
    );
  };

  return (
    <svg className="board-arrows-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
      {/* 1. Threat Move (Rose color) */}
      {threatMove && threatMove.length >= 4 && (
        renderArrow(
          threatMove.substring(0, 2),
          threatMove.substring(2, 4),
          '#f43f5e',
          'threat'
        )
      )}

      {/* 2. Last Move (Subtle dashed amber arrow) */}
      {lastMove && lastMove.from && lastMove.to && (
        renderArrow(
          lastMove.from,
          lastMove.to,
          'rgba(245, 158, 11, 0.5)',
          'lastmove',
          '4 4'
        )
      )}

      {/* 3. Best Engine Recommendation Move (Emerald glowing arrow) */}
      {showBestMove && bestMove && bestMove.length >= 4 && (
        renderArrow(
          bestMove.substring(0, 2),
          bestMove.substring(2, 4),
          '#10b981',
          'best'
        )
      )}
    </svg>
  );
};
