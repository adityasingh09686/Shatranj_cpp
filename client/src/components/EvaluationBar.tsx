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
    <div className="eval-bar-wrapper flex flex-col items-center gap-2 h-full justify-between">
      {/* Real-time Vertical Bar */}
      <div className="eval-bar-track relative w-8 h-[480px] max-h-full rounded-lg overflow-hidden bg-slate-900 border border-slate-700/80 shadow-lg flex flex-col justify-end">
        {/* White fill bar (from bottom if white orientation, from top if black) */}
        <div
          className="eval-bar-fill w-full bg-slate-100 transition-all duration-300 ease-out shadow-sm"
          style={{ height: `${fillHeight}%` }}
        />

        {/* Evaluation score badge */}
        <div className="eval-badge absolute inset-x-0 bottom-2 flex justify-center pointer-events-none">
          <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-100 shadow border border-slate-700/50">
            {analysis?.score ? analysis.score.formatted : '0.00'}
          </span>
        </div>

        {/* Engine thinking indicator */}
        {isThinking && (
          <div className="absolute top-2 inset-x-0 flex justify-center animate-spin">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>

      {/* WDL probability estimate breakdown */}
      {analysis?.wdl && (
        <div className="wdl-breakdown w-28 bg-slate-800/80 border border-slate-700/60 rounded-xl p-2 text-center text-[10px] shadow">
          <div className="text-slate-400 text-[9px] uppercase tracking-wider mb-1 font-semibold">
            Engine WDL %
          </div>
          <div className="flex h-2 rounded-full overflow-hidden bg-slate-700 mb-1.5">
            <div
              className="bg-slate-200"
              style={{ width: `${analysis.wdl.whiteWin}%` }}
              title={`White win: ${analysis.wdl.whiteWin}%`}
            />
            <div
              className="bg-slate-400"
              style={{ width: `${analysis.wdl.draw}%` }}
              title={`Draw: ${analysis.wdl.draw}%`}
            />
            <div
              className="bg-slate-700"
              style={{ width: `${analysis.wdl.blackWin}%` }}
              title={`Black win: ${analysis.wdl.blackWin}%`}
            />
          </div>
          <div className="flex justify-between font-mono text-[9px] text-slate-300">
            <span className="text-slate-200">{analysis.wdl.whiteWin}%</span>
            <span className="text-slate-400">{analysis.wdl.draw}%</span>
            <span className="text-slate-400">{analysis.wdl.blackWin}%</span>
          </div>
        </div>
      )}

      {/* Engine search metadata */}
      {analysis && (
        <div className="text-[10px] font-mono text-slate-500 text-center leading-tight">
          d:{analysis.depth} | {Math.round(analysis.nodes / 1000)}k
        </div>
      )}
    </div>
  );
};
