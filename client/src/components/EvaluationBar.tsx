import React from 'react';
import { PositionAnalysis, SideColor } from '../types';
import { Activity } from 'lucide-react';

interface EvaluationBarProps {
  analysis: PositionAnalysis | null;
  isThinking: boolean;
  orientation: SideColor;
}

export const EvaluationBar: React.FC<EvaluationBarProps> = ({
  analysis,
  isThinking,
  orientation
}) => {
  // Calculate percentage of bar that should be White (0% to 100%)
  const whitePercentage = React.useMemo(() => {
    if (!analysis?.score) return 50;

    const { type, value } = analysis.score;
    if (type === 'mate') {
      return value > 0 ? 100 : 0;
    }

    // Sigmoid mapping for centipawns:
    // 0 cp -> 50%
    // +300 cp (+3 pawns) -> ~80%
    // +600 cp (+6 pawns) -> ~95%
    // -600 cp (-6 pawns) -> ~5%
    const pawns = value / 100;
    const clamped = Math.max(-10, Math.min(10, pawns));
    const pct = 50 + (clamped / 10) * 45;
    return Math.max(5, Math.min(95, pct));
  }, [analysis]);

  // If orientation is black, flip the bar display so player's color is at the bottom
  const fillHeight = orientation === 'white' ? whitePercentage : (100 - whitePercentage);

  return (
    <div className="eval-bar-wrapper">
      {/* Real-time Vertical Bar */}
      <div className="eval-bar-track">
        {/* White fill bar */}
        <div
          className="eval-bar-fill"
          style={{ height: `${fillHeight}%` }}
        />

        {/* Evaluation score badge */}
        <div className="eval-badge">
          <span>
            {analysis?.score ? analysis.score.formatted : '0.00'}
          </span>
        </div>

        {/* Engine thinking indicator */}
        {isThinking && (
          <div className="eval-thinking-icon">
            <Activity size={15} color="#10b981" />
          </div>
        )}
      </div>

      {/* WDL probability estimate breakdown */}
      {analysis?.wdl && (
        <div className="wdl-card">
          <div className="wdl-title">Engine WDL %</div>
          <div className="wdl-bar">
            <div
              className="wdl-white"
              style={{ width: `${analysis.wdl.whiteWin}%` }}
              title={`White win: ${analysis.wdl.whiteWin}%`}
            />
            <div
              className="wdl-draw"
              style={{ width: `${analysis.wdl.draw}%` }}
              title={`Draw: ${analysis.wdl.draw}%`}
            />
            <div
              className="wdl-black"
              style={{ width: `${analysis.wdl.blackWin}%` }}
              title={`Black win: ${analysis.wdl.blackWin}%`}
            />
          </div>
          <div className="wdl-labels">
            <span>{analysis.wdl.whiteWin}%</span>
            <span>{analysis.wdl.draw}%</span>
            <span>{analysis.wdl.blackWin}%</span>
          </div>
        </div>
      )}

      {/* Engine search metadata */}
      {analysis && (
        <div className="eval-meta">
          d:{analysis.depth} | {Math.round(analysis.nodes / 1000)}k
        </div>
      )}
    </div>
  );
};
