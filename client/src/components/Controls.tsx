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
  Plus
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
  onNewGame: (mode: GameMode, depth: number) => void;
  onRestart: () => void;
  onUndo: () => void;
  onResign: () => void;
  onFlipBoard: () => void;
  onOpenAnalysis: () => void;
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
  onOpenAnalysis
}) => {
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>(gameMode);
  const [selectedDepth, setSelectedDepth] = useState<number>(aiDepth);
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
    onNewGame(selectedMode, selectedDepth);
    setShowNewGameModal(false);
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

        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          className="sound-toggle-btn"
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} color="#f43f5e" />}
        </button>
      </div>

      {/* New Game Setup Modal */}
      {showNewGameModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h2>New Match Setup</h2>
            <p>Select opponent and game options</p>

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
                  <div className="mode-label-desc">Your custom Minimax + Alpha-Beta Pruning engine</div>
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
                  <div className="mode-label-desc">Custom C++ AI makes the first move as White</div>
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
