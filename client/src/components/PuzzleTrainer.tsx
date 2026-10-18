import React, { useState } from 'react';
import { Target, CheckCircle2, AlertCircle, ArrowRight, Lightbulb, Trophy } from 'lucide-react';

export interface Puzzle {
  id: string;
  title: string;
  theme: string;
  rating: number;
  fen: string;
  solutionUCI: string[];
  description: string;
  sideToMove: 'white' | 'black';
}

export const PUZZLE_DATABASE: Puzzle[] = [
  {
    id: 'puz-1',
    title: 'Back-Rank Decimation',
    theme: 'Back Rank Mate',
    rating: 1250,
    fen: '3r2k1/5ppp/8/8/8/8/4QPPP/4R1K1 w - - 0 1',
    solutionUCI: ['e2e8', 'd8e8', 'e1e8'],
    description: 'White has overwhelming back-rank pressure. Deliver a forced checkmate sequence.',
    sideToMove: 'white'
  },
  {
    id: 'puz-2',
    title: 'Royal Knight Fork',
    theme: 'Fork & Pin',
    rating: 1380,
    fen: 'r1b1k2r/pppp1ppp/8/8/2N1q3/8/PPP2PPP/R2QKB1R w KQkq - 0 1',
    solutionUCI: ['c4e3'],
    description: 'Black checked White and attacks undefended squares. Block the check with tempo.',
    sideToMove: 'white'
  },
  {
    id: 'puz-3',
    title: 'Smothered Mate Pattern',
    theme: 'Smothered Mate',
    rating: 1620,
    fen: '6k1/5Npp/8/8/8/8/5PPP/4q1K1 w - - 0 1',
    solutionUCI: ['f7h6', 'g8h8', 'e1g8', 'f8g8', 'h6f7'],
    description: 'A classic smothered mate motif locking the enemy King in the corner.',
    sideToMove: 'white'
  },
  {
    id: 'puz-4',
    title: 'Greek Gift Sacrifice',
    theme: 'Attacking the King',
    rating: 1750,
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/1bPP4/2N1PN2/PP1B1PPP/R2QKB1R w KQ - 0 7',
    solutionUCI: ['f1d3', 'd5c4', 'd3c4'],
    description: 'Find the active central development move preparing kingside fireworks.',
    sideToMove: 'white'
  },
  {
    id: 'puz-5',
    title: 'Deflection of the Guard',
    theme: 'Deflection',
    rating: 1490,
    fen: '5rk1/5ppp/8/8/8/8/1R3PPP/1R4K1 w - - 0 1',
    solutionUCI: ['b2b8', 'f8b8', 'b1b8'],
    description: 'Deflect the defending black rook from safeguarding the back rank.',
    sideToMove: 'white'
  }
];

interface PuzzleTrainerProps {
  onLoadPuzzle: (puzzle: Puzzle) => void;
  activePuzzle: Puzzle | null;
  onExitPuzzle: () => void;
  puzzleStatus: 'unsolved' | 'correct' | 'wrong';
  onShowHint: () => void;
}

export const PuzzleTrainer: React.FC<PuzzleTrainerProps> = ({
  onLoadPuzzle,
  activePuzzle,
  onExitPuzzle,
  puzzleStatus,
  onShowHint
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [streak, setStreak] = useState(0);

  const handleNext = () => {
    const nextIdx = (currentIdx + 1) % PUZZLE_DATABASE.length;
    setCurrentIdx(nextIdx);
    onLoadPuzzle(PUZZLE_DATABASE[nextIdx]);
    if (puzzleStatus === 'correct') {
      setStreak((s) => s + 1);
    }
  };

  const puzzle = activePuzzle || PUZZLE_DATABASE[currentIdx];

  return (
    <div className="puzzle-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={18} color="#10b981" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
            {puzzle.title}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{
            fontSize: '0.7rem',
            fontFamily: 'monospace',
            fontWeight: 800,
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.2)',
            color: '#a5b4fc',
            border: '1px solid rgba(99, 102, 241, 0.4)'
          }}>
            Rating {puzzle.rating}
          </span>
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 800,
            padding: '0.2rem 0.5rem',
            borderRadius: '9999px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fde68a',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            <Trophy size={11} /> Streak: {streak}
          </span>
        </div>
      </div>

      <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginBottom: '1rem', lineHeight: '1.4' }}>
        {puzzle.description}
      </p>

      {/* Status banner */}
      <div style={{ marginBottom: '1rem' }}>
        {puzzleStatus === 'correct' && (
          <div className="puzzle-feedback-badge correct">
            <CheckCircle2 size={14} /> Correct! Brilliant find!
          </div>
        )}
        {puzzleStatus === 'wrong' && (
          <div className="puzzle-feedback-badge wrong">
            <AlertCircle size={14} /> That move is not optimal. Try again!
          </div>
        )}
        {puzzleStatus === 'unsolved' && (
          <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic' }}>
            Find the best move for {puzzle.sideToMove === 'white' ? 'White ♔' : 'Black ♚'}...
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.65rem', borderTop: '1px solid rgba(75, 85, 99, 0.4)' }}>
        <button
          onClick={onShowHint}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'none',
            border: 'none',
            color: '#f59e0b',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Lightbulb size={14} /> Show Hint
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={onExitPuzzle}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '0.6rem',
              background: 'none',
              border: '1px solid rgba(75, 85, 99, 0.4)',
              color: '#9ca3af',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Exit Puzzles
          </button>
          <button
            onClick={handleNext}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '0.6rem',
              background: '#10b981',
              border: 'none',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
            }}
          >
            Next Puzzle <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};
