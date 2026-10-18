import React from 'react';
import { X, BookOpen, Play, Calendar, UserCheck } from 'lucide-react';

export interface HistoricalGame {
  id: string;
  white: string;
  black: string;
  event: string;
  year: number;
  result: string;
  description: string;
  uciMoves: string[];
}

export const HISTORICAL_GAMES: HistoricalGame[] = [
  {
    id: 'opera-game',
    white: 'Paul Morphy',
    black: 'Duke of Brunswick & Count Isouard',
    event: 'Paris Opera House',
    year: 1858,
    result: '1-0',
    description: 'The archetype of swift piece development and open lines, concluding with a queen sacrifice and checkmate by rook and bishop.',
    uciMoves: [
      'e2e4', 'e7e5', 'g1f3', 'd7d6', 'd2d4', 'c8g4', 'd4e5', 'g4f3',
      'd1f3', 'd6e5', 'f1c4', 'g8f6', 'f3b3', 'd8e7', 'b1c3', 'c7c6',
      'c1g5', 'b7b5', 'c3b5', 'c6b5', 'c4b5', 'b8d7', 'e1c1', 'a8d8',
      'd1d7', 'd8d7', 'h1d1', 'e7e6', 'b5d7', 'f6d7', 'b3b8', 'd7b8',
      'd1d8'
    ]
  },
  {
    id: 'game-of-century',
    white: 'Donald Byrne',
    black: 'Bobby Fischer',
    event: 'Rosenwald Memorial, New York',
    year: 1956,
    result: '0-1',
    description: '13-year-old Bobby Fischer uncorks a breathtaking Queen sacrifice (...Be6!!) leading to an unstoppable windmill attack.',
    uciMoves: [
      'g1f3', 'g8f6', 'c2c4', 'g7g6', 'b1c3', 'f8g7', 'd2d4', 'e8g8',
      'c1f4', 'd7d5', 'd1b3', 'd5c4', 'b3c4', 'c7c6', 'e2e4', 'b8d7',
      'a1d1', 'd7b6', 'c4c5', 'c8g4', 'f4g5', 'b6a4', 'c5a3', 'a4c3',
      'b2c3', 'f6e4', 'g5e7', 'd8b6', 'f1c4', 'e4c3', 'e7c5', 'f8e8',
      'e1f1', 'c8e6', 'c5b6', 'e6c4', 'f1g1', 'c3e2', 'g1f1', 'e2d4',
      'f1g1', 'd4e2', 'g1f1', 'e2c3', 'f1g1', 'a7b6', 'a3b4', 'a8a4',
      'b4b6', 'c3d1', 'h2h3', 'a4a2', 'g1h2', 'd1f2', 'h1e1', 'e8e1',
      'b6d8', 'f7f8', 'd8d4', 'c4d5', 'f3e5', 'f2e4', 'h2g1', 'g7e5',
      'g1f1', 'e4g3', 'f1e1', 'e5b2', 'e1d1', 'd5b3', 'd1e1', 'g3e2'
    ]
  },
  {
    id: 'immortal-game',
    white: 'Adolf Anderssen',
    black: 'Lionel Kieseritzky',
    event: 'London Casual Game',
    year: 1851,
    result: '1-0',
    description: 'Anderssen famously sacrifices both rooks and his queen to deliver checkmate with his remaining minor pieces.',
    uciMoves: [
      'e2e4', 'e7e5', 'f2f4', 'e5f4', 'f1c4', 'd8h4', 'e1f1', 'b7b5',
      'c4b5', 'g8f6', 'g1f3', 'h4h6', 'd2d3', 'f6h5', 'f3h4', 'h6g5',
      'h4f5', 'c7c6', 'g2g4', 'h5f6', 'h1g1', 'c6b5', 'h2h4', 'g5g6',
      'h4h5', 'g6g5', 'd1f3', 'f6g8', 'c1f4', 'g5f6', 'b1c3', 'f8c5',
      'c3d5', 'f6b2', 'f4d6', 'c5g1', 'e4e5', 'b2a1', 'f1e2', 'b8a6',
      'f5g7', 'e8d8', 'f3f6', 'g8f6', 'd6e7'
    ]
  }
];

interface HistoricalGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: HistoricalGame) => void;
}

export const HistoricalGamesModal: React.FC<HistoricalGamesModalProps> = ({
  isOpen,
  onClose,
  onSelectGame
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-window" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              padding: '0.45rem',
              borderRadius: '0.65rem',
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#f59e0b',
              border: '1px solid rgba(245, 158, 11, 0.35)'
            }}>
              <BookOpen size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Grandmaster Masterpiece Replayer
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                Study historical masterpieces step-by-step
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-icon-close">
            <X size={16} />
          </button>
        </div>

        {/* Game list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {HISTORICAL_GAMES.map((g) => (
            <div
              key={g.id}
              style={{
                background: 'rgba(31, 41, 55, 0.55)',
                border: '1px solid rgba(75, 85, 99, 0.45)',
                borderRadius: '1rem',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck size={16} color="#10b981" />
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#ffffff' }}>
                    {g.white} vs. {g.black}
                  </span>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  color: '#f59e0b',
                  background: 'rgba(245, 158, 11, 0.15)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '0.4rem'
                }}>
                  {g.result}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.72rem', color: '#9ca3af' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={12} /> {g.year}
                </span>
                <span>•</span>
                <span>{g.event}</span>
                <span>•</span>
                <span>{g.uciMoves.length} plies</span>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
                {g.description}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.35rem' }}>
                <button
                  onClick={() => {
                    onSelectGame(g);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '0.6rem',
                    background: '#6366f1',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Play size={12} fill="currentColor" /> Load Match
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
