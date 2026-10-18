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
    <div className="modal-overlay">
      <div className="analysis-modal-window">
        {/* Header */}
        <div className="analysis-header">
          <div className="analysis-title-box">
            <div className="analysis-spark-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Stockfish Game Analysis
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                Move quality classifications, centipawn loss, and evaluation graph
              </p>
            </div>
          </div>

          <div className="analysis-header-btns">
            {onRestartAnalysis && report && (
              <button
                onClick={onRestartAnalysis}
                title="Re-run analysis"
                className="btn-icon-close"
              >
                <RotateCcw size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-icon-close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="analysis-body">
          {/* Loading / Progress State */}
          {isLoading && (
            <div style={{
              background: 'rgba(31, 41, 55, 0.6)',
              border: '1px solid rgba(75, 85, 99, 0.4)',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: '#818cf8',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Analyzing positions with Stockfish...
              </div>

              {progress && (
                <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: '#9ca3af',
                    marginBottom: '0.4rem'
                  }}>
                    <span>Move {progress.current} of {progress.total}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    background: '#374151',
                    borderRadius: '9999px',
                    height: '8px',
                    overflow: 'hidden'
                  }}>
                    <div
                      style={{
                        background: '#6366f1',
                        height: '100%',
                        width: `${(progress.current / progress.total) * 100}%`,
                        transition: 'width 0.2s ease'
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <button
                  onClick={onCancel}
                  style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '0.6rem',
                    fontSize: '0.75rem',
                    background: '#374151',
                    border: '1px solid rgba(75, 85, 99, 0.5)',
                    color: '#f87171',
                    cursor: 'pointer'
                  }}
                >
                  Cancel Analysis
                </button>
              </div>
            </div>
          )}

          {/* Analysis Report */}
          {report && !isLoading && (
            <>
              {/* Accuracy & Score Cards */}
              <div className="accuracy-cards-grid">
                {/* White Accuracy Card */}
                <div className="accuracy-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontSize: '2rem' }}>♔</span>
                    <div>
                      <div className="accuracy-title">White Accuracy</div>
                      <div className="accuracy-value">
                        {report.whiteAccuracy}%
                      </div>
                    </div>
                  </div>
                  <div className="accuracy-breakdown">
                    <div>{report.classificationSummary.white.Best} Best Moves</div>
                    <div className="blunder-count">{report.classificationSummary.white.Blunder} Blunders</div>
                  </div>
                </div>

                {/* Black Accuracy Card */}
                <div className="accuracy-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <span style={{ fontSize: '2rem' }}>♚</span>
                    <div>
                      <div className="accuracy-title">Black Accuracy</div>
                      <div className="accuracy-value">
                        {report.blackAccuracy}%
                      </div>
                    </div>
                  </div>
                  <div className="accuracy-breakdown">
                    <div>{report.classificationSummary.black.Best} Best Moves</div>
                    <div className="blunder-count">{report.classificationSummary.black.Blunder} Blunders</div>
                  </div>
                </div>
              </div>

              {/* Interactive Evaluation Graph */}
              <div className="chart-card">
                <div className="chart-header">
                  <h4>
                    <TrendingUp size={14} color="#6366f1" />
                    Evaluation Trajectory
                  </h4>
                  <span>Click any point to review position</span>
                </div>

                <div style={{ position: 'relative', overflowX: 'auto' }}>
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="svg-chart"
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
                          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
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
              <div className="analysis-moves-card">
                <div className="moves-title">
                  Detailed Move-by-Move Analysis ({report.moves.length} moves)
                </div>

                <div className="analysis-move-rows">
                  {report.moves.map((m) => {
                    const badge = classificationColors[m.classification];
                    const isSelected = selectedPly === m.ply;

                    return (
                      <div
                        key={m.ply}
                        onClick={() => onSelectPly(m.ply)}
                        className={`analysis-move-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="move-info-left">
                          <span className="move-idx">
                            {m.moveNumber}.{m.side === 'black' ? '..' : ''}
                          </span>

                          <span className="move-san">
                            {m.san}
                          </span>

                          <span
                            className="classification-pill"
                            style={{
                              color: badge?.dot || '#6366f1',
                              borderColor: badge?.dot ? `${badge.dot}60` : '#6366f1',
                              backgroundColor: badge?.dot ? `${badge.dot}18` : 'transparent'
                            }}
                          >
                            {m.classification}
                          </span>

                          {m.scoreLoss > 20 && (
                            <span className="loss-pill">
                              -{m.scoreLoss}cp
                            </span>
                          )}
                        </div>

                        <div className="move-info-right">
                          <div>
                            Eval: <span className="eval-stat">{m.evalAfter.formatted}</span>
                          </div>

                          {m.bestEngineMove && m.classification !== 'Best' && (
                            <div className="best-rec-pill">
                              Best: {m.bestEngineMove}
                            </div>
                          )}

                          <ChevronRight size={14} color="#6b7280" />
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
        <div className="analysis-footer">
          <span>
            Powered by Stockfish UCI Engine & C++ Rule Verifier
          </span>
          <button
            onClick={onClose}
            className="btn-close-report"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
