import React, { useState } from 'react';
import { GameMode, SideColor } from '../types';
import {
  RotateCcw,
  RefreshCw,
  Flag,
  ArrowUpDown,
  Sparkles,
  Copy,
  Download,
  Volume2,
  VolumeX,
  Plus,
  Palette,
  Eye,
  EyeOff,
  Target,
  BookOpen,
  Archive,
  Play,
  Pause
} from 'lucide-react';
import { sounds } from '../utils/sound';

interface ControlsProps {
  gameMode: GameMode;
  aiDepth: number;
  orientation: SideColor;
  canUndo: boolean;
  isGameOver: boolean;
  fen: string;
  pgn: string;
  onNewGame: (mode: GameMode, depth: number, timeMins: number) => void;
  onRestart: () => void;
  onUndo: () => void;
  onResign: () => void;
  onFlipBoard: () => void;
  onOpenAnalysis: () => void;
  currentTheme: string;
  onChangeTheme: (theme: string) => void;
  showArrows: boolean;
  onToggleArrows: () => void;
  onOpenPuzzles: () => void;
  onOpenHistorical: () => void;
  onOpenArchive: () => void;
  isSpectating?: boolean;
  isSpectatorPaused?: boolean;
  onToggleSpectatorPause?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  gameMode,
  aiDepth,
  orientation,
  canUndo,
  isGameOver,
  fen,
  pgn,
  onNewGame,
  onRestart,
  onUndo,
  onResign,
  onFlipBoard,
  onOpenAnalysis,
  currentTheme,
  onChangeTheme,
  showArrows,
  onToggleArrows,
  onOpenPuzzles,
  onOpenHistorical,
  onOpenArchive,
  isSpectating = false,
  isSpectatorPaused = false,
  onToggleSpectatorPause
}) => {
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>(gameMode);
  const [selectedDepth, setSelectedDepth] = useState<number>(aiDepth);
  const [selectedTimeMins, setSelectedTimeMins] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const toggleSound = () => {
    sounds.enabled = !soundEnabled;
    setSoundEnabled(!soundEnabled);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const downloadPGN = () => {
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shatranj_game_${Date.now()}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartGame = () => {
    onNewGame(selectedMode, selectedDepth, selectedTimeMins);
    setShowNewGameModal(false);
  };

  const themes = [
    { id: 'emerald', label: 'Forest Emerald' },
    { id: 'wood', label: 'Walnut Wood' },
    { id: 'midnight', label: 'Midnight Cyber' },
    { id: 'ocean', label: 'Slate Ocean' }
  ];

  const cycleTheme = () => {
    const curIdx = themes.findIndex(t => t.id === currentTheme);
    const nextIdx = (curIdx + 1) % themes.length;
    onChangeTheme(themes[nextIdx].id);
  };

  return (
    <div className="controls-card">
      {/* Primary Actions */}
      <div className="primary-actions-grid">
        <button
          onClick={() => setShowNewGameModal(true)}
          className="btn-primary-action btn-new-game"
        >
          <Plus size={16} /> New Game
        </button>

        <button
          onClick={onOpenAnalysis}
          className="btn-primary-action btn-analyze-game"
        >
          <Sparkles size={16} /> Analyze Game
        </button>
      </div>

      {/* Feature Exploration Tabs (Puzzles, Historical, Archive) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
        <button
          onClick={onOpenPuzzles}
          title="Tactical Puzzles"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0.5rem 0.3rem',
            borderRadius: '0.65rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            color: '#a7f3d0',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Target size={13} /> Puzzles
        </button>

        <button
          onClick={onOpenHistorical}
          title="Famous Historical Masterpieces"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0.5rem 0.3rem',
            borderRadius: '0.65rem',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            color: '#fde68a',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <BookOpen size={13} /> Classics
        </button>

        <button
          onClick={onOpenArchive}
          title="Saved Match History"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            padding: '0.5rem 0.3rem',
            borderRadius: '0.65rem',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.35)',
            color: '#c7d2fe',
            fontSize: '0.72rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Archive size={13} /> History
        </button>
      </div>

      {/* Spectator battle pause/play bar if in spectator mode */}
      {isSpectating && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.5rem 0.85rem',
          borderRadius: '0.65rem',
          background: 'rgba(245, 158, 11, 0.2)',
          border: '1px solid rgba(245, 158, 11, 0.4)'
        }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fde68a' }}>
            AI Battle Spectator
          </span>
          {onToggleSpectatorPause && (
            <button
              onClick={onToggleSpectatorPause}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.3rem 0.6rem',
                borderRadius: '0.45rem',
                background: '#f59e0b',
                color: '#0b0f19',
                fontWeight: 800,
                fontSize: '0.72rem',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isSpectatorPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
              {isSpectatorPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>
      )}

      {/* Secondary Controls Bar */}
      <div className="secondary-actions-grid">
        <button
          onClick={onUndo}
          disabled={!canUndo || isGameOver}
          title="Undo move"
          className="btn-secondary"
        >
          <RotateCcw size={16} /> Undo
        </button>

        <button
          onClick={onFlipBoard}
          title={`Flip board (currently ${orientation})`}
          className="btn-secondary"
        >
          <ArrowUpDown size={16} /> Flip
        </button>

        <button
          onClick={onRestart}
          title="Restart match"
          className="btn-secondary"
        >
          <RefreshCw size={16} /> Restart
        </button>

        <button
          onClick={onResign}
          disabled={isGameOver}
          title="Resign game"
          className="btn-secondary resign"
        >
          <Flag size={16} /> Resign
        </button>
      </div>

      {/* Share / Export Bar */}
      <div className="share-bar">
        <div className="share-actions">
          <button
            onClick={() => copyToClipboard(fen, 'FEN')}
            title="Copy FEN"
            className="btn-chip"
          >
            <Copy size={13} /> FEN
          </button>
          <button
            onClick={() => copyToClipboard(pgn, 'PGN')}
            title="Copy PGN"
            className="btn-chip"
          >
            <Copy size={13} /> PGN
          </button>
          <button
            onClick={downloadPGN}
            title="Download PGN file"
            className="btn-chip"
          >
            <Download size={13} />
          </button>
          {copiedText && (
            <span className="copied-badge">
              {copiedText} Copied!
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Arrow Hints Toggle */}
          <button
            onClick={onToggleArrows}
            title={showArrows ? 'Hide Move Arrows' : 'Show Move Arrows'}
            className="sound-toggle-btn"
          >
            {showArrows ? <Eye size={14} color="#10b981" /> : <EyeOff size={14} />}
          </button>

          {/* Theme Palette Cycle */}
          <button
            onClick={cycleTheme}
            title={`Switch Theme (Current: ${currentTheme})`}
            className="sound-toggle-btn"
          >
            <Palette size={14} />
          </button>

          {/* Audio Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            className="sound-toggle-btn"
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} color="#f43f5e" />}
          </button>
        </div>
      </div>

      {/* New Game Setup Modal */}
      {showNewGameModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h2>New Match Setup</h2>
            <p>Select opponent, game options, and clock speed</p>

            {/* Mode Selection */}
            <div className="mode-radio-list">
              <button
                type="button"
                onClick={() => setSelectedMode('vs_custom_ai_white')}
                className={`mode-option-btn ${
                  selectedMode === 'vs_custom_ai_white' ? 'selected' : ''
                }`}
              >
                <div>
                  <div className="mode-label-title">Play as White vs Custom C++ AI</div>
                  <div className="mode-label-desc">Your custom Minimax + Opening Book + Alpha-Beta engine</div>
                </div>
                <span className="mode-icon">♔</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('vs_custom_ai_black')}
                className={`mode-option-btn ${
                  selectedMode === 'vs_custom_ai_black' ? 'selected' : ''
                }`}
              >
                <div>
                  <div className="mode-label-title">Play as Black vs Custom C++ AI</div>
                  <div className="mode-label-desc">Custom C++ AI opens with theoretical opening book</div>
                </div>
                <span className="mode-icon">♚</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('two_player')}
                className={`mode-option-btn ${
                  selectedMode === 'two_player' ? 'selected' : ''
                }`}
              >
                <div>
                  <div className="mode-label-title">Local Two-Player (Human vs Human)</div>
                  <div className="mode-label-desc">Pass and play on the same device</div>
                </div>
                <span className="mode-icon">👥</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('vs_stockfish')}
                className={`mode-option-btn ${
                  selectedMode === 'vs_stockfish' ? 'selected stockfish' : ''
                }`}
              >
                <div>
                  <div className="mode-label-title">Play vs Stockfish (Grandmaster Mode)</div>
                  <div className="mode-label-desc">Official Stockfish UCI engine</div>
                </div>
                <span className="mode-icon">⚡</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('spectator_ai_vs_ai')}
                className={`mode-option-btn ${
                  selectedMode === 'spectator_ai_vs_ai' ? 'selected' : ''
                }`}
              >
                <div>
                  <div className="mode-label-title">AI Battle: C++ Minimax vs Stockfish</div>
                  <div className="mode-label-desc">Spectator mode: Watch engines duel in real time</div>
                </div>
                <span className="mode-icon">🤖</span>
              </button>
            </div>

            {/* Time Control Options */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', display: 'block', marginBottom: '0.45rem' }}>
                Time Control
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
                {[
                  { mins: 0, label: '∞ Casual' },
                  { mins: 1, label: '1m Bullet' },
                  { mins: 3, label: '3m Blitz' },
                  { mins: 5, label: '5m Blitz' },
                  { mins: 10, label: '10m Rapid' }
                ].map((tc) => (
                  <button
                    key={tc.mins}
                    type="button"
                    onClick={() => setSelectedTimeMins(tc.mins)}
                    style={{
                      padding: '0.45rem 0.2rem',
                      borderRadius: '0.55rem',
                      background: selectedTimeMins === tc.mins ? '#10b981' : '#1e293b',
                      color: selectedTimeMins === tc.mins ? '#ffffff' : '#9ca3af',
                      border: '1px solid',
                      borderColor: selectedTimeMins === tc.mins ? '#10b981' : 'rgba(75, 85, 99, 0.5)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {tc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Search Depth Difficulty Slider */}
            {selectedMode !== 'two_player' && (
              <div className="difficulty-slider-box">
                <div className="slider-header">
                  <label>
                    Engine Depth / Difficulty
                  </label>
                  <span>
                    Depth {selectedDepth} {
                      selectedDepth === 1 ? '(Novice)' :
                      selectedDepth === 2 ? '(Casual)' :
                      selectedDepth === 3 ? '(Intermediate)' :
                      selectedDepth === 4 ? '(Advanced)' : '(Expert)'
                    }
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={selectedDepth}
                  onChange={(e) => setSelectedDepth(parseInt(e.target.value, 10))}
                  className="difficulty-slider"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowNewGameModal(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartGame}
                className="btn-start"
              >
                Start Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
