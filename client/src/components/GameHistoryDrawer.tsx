import React from 'react';
import { X, Archive, Copy, Calendar, Award } from 'lucide-react';

export interface SavedGameRecord {
  id: string;
  date: string;
  result: string;
  movesCount: number;
  pgn: string;
  whiteAccuracy?: number;
  blackAccuracy?: number;
  mode: string;
}

interface GameHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  games: SavedGameRecord[];
  onLoadGamePGN: (pgn: string) => void;
  onClearHistory: () => void;
}

export const GameHistoryDrawer: React.FC<GameHistoryDrawerProps> = ({
  isOpen,
  onClose,
  games,
  onLoadGamePGN,
  onClearHistory
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-window" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              padding: '0.45rem',
              borderRadius: '0.65rem',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.35)'
            }}>
              <Archive size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Match History Archive
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
                {games.length} {games.length === 1 ? 'game' : 'games'} recorded
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {games.length > 0 && (
              <button
                onClick={onClearHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f87171',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Clear All
              </button>
            )}
            <button onClick={onClose} className="btn-icon-close">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List of games */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '400px', overflowY: 'auto' }}>
          {games.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280', fontSize: '0.8rem', fontStyle: 'italic' }}>
              No matches archived yet. Complete a game to see it recorded here!
            </div>
          ) : (
            games.map((g) => (
              <div
                key={g.id}
                style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  border: '1px solid rgba(75, 85, 99, 0.4)',
                  borderRadius: '0.85rem',
                  padding: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: g.result === '1-0' ? '#10b981' : g.result === '0-1' ? '#f43f5e' : '#f59e0b'
                    }}>
                      {g.result}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#e5e7eb', fontWeight: 600 }}>
                      {g.mode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.7rem', color: '#9ca3af' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={11} /> {g.date}
                    </span>
                    <span>•</span>
                    <span>{g.movesCount} moves</span>
                    {g.whiteAccuracy !== undefined && (
                      <>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#a7f3d0' }}>
                          <Award size={11} /> {g.whiteAccuracy}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <button
                    onClick={() => navigator.clipboard.writeText(g.pgn)}
                    title="Copy PGN"
                    className="btn-chip"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={() => {
                      onLoadGamePGN(g.pgn);
                      onClose();
                    }}
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '0.5rem',
                      background: '#4f46e5',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Review
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
