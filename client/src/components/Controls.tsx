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
    <div className="controls-card bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
      {/* Primary Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setShowNewGameModal(true)}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-md hover:shadow-emerald-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Game
        </button>

        <button
          onClick={onOpenAnalysis}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-md hover:shadow-indigo-500/20 transition active:scale-95"
        >
          <Sparkles className="w-4 h-4" /> Analyze Game
        </button>
      </div>

      {/* Secondary Controls Bar */}
      <div className="grid grid-cols-4 gap-2 pt-1 border-t border-slate-700/60">
        <button
          onClick={onUndo}
          disabled={!canUndo || isGameOver}
          title="Undo move"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-700/60 text-slate-300 text-[10px] font-medium transition"
        >
          <RotateCcw className="w-4 h-4 mb-1" /> Undo
        </button>

        <button
          onClick={onFlipBoard}
          title={`Flip board (currently ${orientation})`}
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition"
        >
          <ArrowUpDown className="w-4 h-4 mb-1" /> Flip
        </button>

        <button
          onClick={onRestart}
          title="Restart match"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[10px] font-medium transition"
        >
          <RefreshCw className="w-4 h-4 mb-1" /> Restart
        </button>

        <button
          onClick={onResign}
          disabled={isGameOver}
          title="Resign game"
          className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-700/60 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 disabled:opacity-30 text-[10px] font-medium transition"
        >
          <Flag className="w-4 h-4 mb-1" /> Resign
        </button>
      </div>

      {/* Share / Export Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => copyToClipboard(fen, 'FEN')}
            title="Copy FEN"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 text-[11px] transition"
          >
            <Copy className="w-3 h-3" /> FEN
          </button>
          <button
            onClick={() => copyToClipboard(pgn, 'PGN')}
            title="Copy PGN"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 text-[11px] transition"
          >
            <Copy className="w-3 h-3" /> PGN
          </button>
          <button
            onClick={downloadPGN}
            title="Download PGN file"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 text-[11px] transition"
          >
            <Download className="w-3 h-3" />
          </button>
          {copiedText && (
            <span className="text-[10px] text-emerald-400 font-semibold animate-fade-in">
              {copiedText} Copied!
            </span>
          )}
        </div>

        <button
          onClick={toggleSound}
          title={soundEnabled ? 'Mute sound' : 'Enable sound'}
          className="p-1.5 rounded-lg bg-slate-700/40 hover:bg-slate-700 text-slate-300 transition"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
        </button>
      </div>

      {/* New Game Setup Modal */}
      {showNewGameModal && (
        <div className="modal-overlay fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="modal-content bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-100 mb-1">New Match Setup</h2>
            <p className="text-xs text-slate-400 mb-5">Select opponent and game options</p>

            {/* Mode Selection */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Game Mode</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMode('vs_custom_ai_white')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    selectedMode === 'vs_custom_ai_white'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">Play as White vs Custom C++ AI</div>
                    <div className="text-xs text-slate-400">Your custom Minimax + Alpha-Beta Pruning engine</div>
                  </div>
                  <span className="text-xl">♔</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('vs_custom_ai_black')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    selectedMode === 'vs_custom_ai_black'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">Play as Black vs Custom C++ AI</div>
                    <div className="text-xs text-slate-400">Custom C++ AI makes the first move as White</div>
                  </div>
                  <span className="text-xl">♚</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('two_player')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    selectedMode === 'two_player'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">Local Two-Player (Human vs Human)</div>
                    <div className="text-xs text-slate-400">Pass and play on the same device</div>
                  </div>
                  <span className="text-xl">👥</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode('vs_stockfish')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    selectedMode === 'vs_stockfish'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">Play vs Stockfish (Grandmaster Mode)</div>
                    <div className="text-xs text-slate-400">Official Stockfish UCI engine</div>
                  </div>
                  <span className="text-xl">⚡</span>
                </button>
              </div>
            </div>

            {/* AI Search Depth Difficulty Slider */}
            {selectedMode !== 'two_player' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Engine Depth / Difficulty
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
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
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setShowNewGameModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartGame}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-lg shadow-emerald-600/30 transition"
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
