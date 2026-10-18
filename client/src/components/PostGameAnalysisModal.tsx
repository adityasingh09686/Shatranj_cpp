import React, { useState } from 'react';
import { MoveClassification, PostGameAnalysisReport } from '../types';
import { X, Sparkles, TrendingUp, ChevronRight, RefreshCw, RotateCcw } from 'lucide-react';

interface PostGameAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PostGameAnalysisReport | null;
  isLoading: boolean;
  progress?: { current: number; total: number };
  onCancel: () => void;
  onSelectPly: (ply: number) => void;
  selectedPly: number;
  onRestartAnalysis?: () => void;
}

const classificationColors: Record<MoveClassification, { bg: string; text: string; dot: string }> = {
  'Best': { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: '#10b981' },
  'Excellent': { bg: 'bg-teal-500/15', text: 'text-teal-400', dot: '#14b8a6' },
  'Good': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: '#3b82f6' },
  'Inaccuracy': { bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: '#eab308' },
  'Mistake': { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: '#f97316' },
  'Blunder': { bg: 'bg-rose-500/15', text: 'text-rose-400', dot: '#f43f5e' },
  'Missed Win': { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: '#a855f7' },
  'Book': { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: '#94a3b8' }
};

export const PostGameAnalysisModal: React.FC<PostGameAnalysisModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  progress,
  onCancel,
  onSelectPly,
  selectedPly,
  onRestartAnalysis
}) => {
  const [hoveredPly, setHoveredPly] = useState<number | null>(null);

  if (!isOpen) return null;

  // Chart coordinate calculations
  const chartHeight = 160;
  const chartWidth = 560;
  const paddingX = 24;
  const paddingY = 20;

  const points = React.useMemo(() => {
    if (!report || report.moves.length === 0) return [];

    const total = report.moves.length;
    const usableWidth = chartWidth - paddingX * 2;
    const midY = chartHeight / 2;

    return report.moves.map((m, idx) => {
      const x = paddingX + (idx / Math.max(1, total - 1)) * usableWidth;

      // Evaluation clamping to -800 to +800 cp for the graph
      let cp = m.evalAfter.value;
      if (m.evalAfter.type === 'mate') {
        cp = m.evalAfter.value > 0 ? 1200 : -1200;
      }
      const clamped = Math.max(-800, Math.min(800, cp));
      // Invert Y because SVG coordinates increase downwards (positive = up)
      const y = midY - (clamped / 800) * (midY - paddingY);

      return {
        x,
        y,
        move: m
      };
    });
  }, [report]);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Stockfish Game Analysis
              </h2>
              <p className="text-xs text-slate-400">
                Move quality classifications, centipawn loss, and evaluation graph
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onRestartAnalysis && report && (
              <button
                onClick={onRestartAnalysis}
                title="Re-run analysis"
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Loading / Progress State */}
          {isLoading && (
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-indigo-400 font-semibold text-sm">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing positions with Stockfish...
              </div>

              {progress && (
                <div className="space-y-1.5 max-w-md mx-auto">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Move {progress.current} of {progress.total}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-200"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={onCancel}
                className="px-4 py-1.5 rounded-xl text-xs bg-slate-700 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 transition"
              >
                Cancel Analysis
              </button>
            </div>
          )}

          {/* Analysis Report */}
          {report && !isLoading && (
            <>
              {/* Accuracy & Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* White Accuracy Card */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between shadow">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">♔</span>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">White Accuracy</div>
                      <div className="text-2xl font-black text-slate-100 font-mono">
                        {report.whiteAccuracy}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>{report.classificationSummary.white.Best} Best Moves</div>
                    <div className="text-rose-400">{report.classificationSummary.white.Blunder} Blunders</div>
                  </div>
                </div>

                {/* Black Accuracy Card */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center justify-between shadow">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">♚</span>
                    <div>
                      <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Black Accuracy</div>
                      <div className="text-2xl font-black text-slate-100 font-mono">
                        {report.blackAccuracy}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    <div>{report.classificationSummary.black.Best} Best Moves</div>
                    <div className="text-rose-400">{report.classificationSummary.black.Blunder} Blunders</div>
                  </div>
                </div>
              </div>

              {/* Interactive Evaluation Graph */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                    Evaluation Trajectory
                  </div>
                  <span className="text-[11px] text-slate-400">Click any point to review position</span>
                </div>

                <div className="relative overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-44 rounded-xl bg-slate-950/60 select-none"
                  >
                    {/* Center zero line (Equal evaluation) */}
                    <line
                      x1={paddingX}
                      y1={chartHeight / 2}
                      x2={chartWidth - paddingX}
                      y2={chartHeight / 2}
                      stroke="#475569"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />

                    {/* Advantage labels */}
                    <text x={paddingX} y={paddingY - 4} fill="#94a3b8" fontSize="9" fontFamily="monospace">
                      +White
                    </text>
                    <text x={paddingX} y={chartHeight - 6} fill="#94a3b8" fontSize="9" fontFamily="monospace">
                      +Black
                    </text>

                    {/* Connecting spline line */}
                    {points.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                      />
                    )}

                    {/* Interactive points */}
                    {points.map((p) => {
                      const isHovered = hoveredPly === p.move.ply;
                      const isSelected = selectedPly === p.move.ply;
                      const dotColor = classificationColors[p.move.classification]?.dot || '#6366f1';

                      return (
                        <circle
                          key={p.move.ply}
                          cx={p.x}
                          cy={p.y}
                          r={isSelected ? 6 : isHovered ? 5 : 3.5}
                          fill={dotColor}
                          stroke={isSelected ? '#ffffff' : '#0f172a'}
                          strokeWidth="1.5"
                          className="cursor-pointer transition-all hover:scale-125"
                          onClick={() => onSelectPly(p.move.ply)}
                          onMouseEnter={() => setHoveredPly(p.move.ply)}
                          onMouseLeave={() => setHoveredPly(null)}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Move Breakdown List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Detailed Move-by-Move Analysis ({report.moves.length} moves)
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {report.moves.map((m) => {
                    const badge = classificationColors[m.classification];
                    const isSelected = selectedPly === m.ply;

                    return (
                      <div
                        key={m.ply}
                        onClick={() => onSelectPly(m.ply)}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          isSelected
                            ? 'bg-slate-800 border-indigo-500 shadow-md'
                            : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2 sm:mb-0">
                          <span className="font-mono text-xs font-semibold text-slate-400 w-10">
                            {m.moveNumber}.{m.side === 'black' ? '..' : ''}
                          </span>

                          <span className="font-mono text-sm font-bold text-slate-100">
                            {m.san}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.text} border-current/30`}
                          >
                            {m.classification}
                          </span>

                          {m.scoreLoss > 20 && (
                            <span className="text-[11px] font-mono text-rose-400">
                              -{m.scoreLoss}cp
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                          <div>
                            Eval: <span className="text-slate-200 font-semibold">{m.evalAfter.formatted}</span>
                          </div>

                          {m.bestEngineMove && m.classification !== 'Best' && (
                            <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              <span>Best: {m.bestEngineMove}</span>
                            </div>
                          )}

                          <ChevronRight className="w-4 h-4 text-slate-500 hidden sm:block" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Powered by Stockfish UCI Engine & C++ Rule Verifier
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
