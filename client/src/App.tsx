import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Chessboard } from './components/Chessboard';
import { EvaluationBar } from './components/EvaluationBar';
import { MoveHistory } from './components/MoveHistory';
import { Controls } from './components/Controls';
import { PostGameAnalysisModal } from './components/PostGameAnalysisModal';
import {
  GameMode,
  GameState,
  PositionAnalysis,
  PostGameAnalysisReport,
  SideColor
} from './types';
import { sounds } from './utils/sound';
import { Trophy, AlertCircle, Cpu, User } from 'lucide-react';

const API_BASE = '/api';

export const App: React.FC = () => {
  // Game session state
  const [gameState, setGameState] = useState<GameState>({
    ok: true,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    sideToMove: 'white',
    inCheck: false,
    status: 'ongoing',
    isGameOver: false,
    legalMoves: [],
    historySAN: [],
    historyUCI: [],
    pgn: ''
  });

  const [gameMode, setGameMode] = useState<GameMode>('vs_custom_ai_white');
  const [aiDepth, setAiDepth] = useState<number>(3);
  const [orientation, setOrientation] = useState<SideColor>('white');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isStockfishThinking, setIsStockfishThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Position history for reviewing earlier plies
  const [historyFENs, setHistoryFENs] = useState<string[]>([
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  ]);
  const [reviewPly, setReviewPly] = useState<number | null>(null);

  // Stockfish live analysis
  const [liveAnalysis, setLiveAnalysis] = useState<PositionAnalysis | null>(null);

  // Post-game analysis pipeline state
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzingGame, setIsAnalyzingGame] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | undefined>();
  const [analysisReport, setAnalysisReport] = useState<PostGameAnalysisReport | null>(null);
  const activeAnalysisIdRef = useRef<string | null>(null);

  // Fetch initial game state
  useEffect(() => {
    fetchGameState();
  }, []);

  const fetchGameState = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/state`);
      const data: GameState = await res.json();
      if (data.ok) {
        setGameState(data);
        setHistoryFENs(['rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']);
        triggerLiveEvaluation(data.fen);
      }
    } catch (err: any) {
      setErrorMessage('Could not connect to backend server. Make sure the backend is running.');
    }
  };

  // Trigger live Stockfish evaluation for current position
  const triggerLiveEvaluation = useCallback(async (fen: string) => {
    try {
      setIsStockfishThinking(true);
      const res = await fetch(`${API_BASE}/stockfish/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen, depth: 12 })
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setLiveAnalysis(data.analysis);
      }
    } catch (err) {
      // Stockfish eval error or cancelled
    } finally {
      setIsStockfishThinking(false);
    }
  }, []);

  // Check if AI needs to make a move
  useEffect(() => {
    if (gameState.isGameOver || isAiThinking) return;

    const isCustomAITurn =
      (gameMode === 'vs_custom_ai_white' && gameState.sideToMove === 'black') ||
      (gameMode === 'vs_custom_ai_black' && gameState.sideToMove === 'white');

    const isStockfishTurn =
      (gameMode === 'vs_stockfish' && gameState.sideToMove === 'black');

    if (isCustomAITurn) {
      triggerCustomAIMove();
    } else if (isStockfishTurn) {
      triggerStockfishMove();
    }
  }, [gameState.sideToMove, gameState.isGameOver, gameMode, isAiThinking]);

  // Request custom Minimax AI move from C++ engine
  const triggerCustomAIMove = async () => {
    setIsAiThinking(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/game/ai-move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depth: aiDepth })
      });
      const data: GameState = await res.json();
      if (data.ok) {
        handleStateUpdate(data);
      } else {
        setErrorMessage(data.error || 'Custom AI failed to make a move');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'AI request error');
    } finally {
      setIsAiThinking(false);
    }
  };

  // Optional Stockfish gameplay move (distinctly separated mode)
  const triggerStockfishMove = async () => {
    setIsAiThinking(true);
    setErrorMessage(null);
    try {
      const evalRes = await fetch(`${API_BASE}/stockfish/eval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: gameState.fen, depth: 10 })
      });
      const evalData = await evalRes.json();
      if (evalData.ok && evalData.analysis?.bestMove) {
        const moveRes = await fetch(`${API_BASE}/game/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ move: evalData.analysis.bestMove })
        });
        const moveData: GameState = await moveRes.json();
        if (moveData.ok) {
          handleStateUpdate(moveData);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Stockfish move error');
    } finally {
      setIsAiThinking(false);
    }
  };

  // Submit human move to backend
  const handleMakeMove = async (moveUCI: string) => {
    if (reviewPly !== null) {
      // Resume live game first
      setReviewPly(null);
    }
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: moveUCI })
      });
      const data: GameState = await res.json();
      if (data.ok) {
        handleStateUpdate(data);
      } else {
        setErrorMessage(data.error || 'Illegal move');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Move submission error');
    }
  };

  // Update state, sound effects, celebration confetti, and trigger live evaluation
  const handleStateUpdate = (newState: GameState) => {
    setGameState(newState);
    setHistoryFENs((prev) => [...prev, newState.fen]);
    setReviewPly(null);

    // Audio effects
    if (newState.isGameOver && newState.status === 'checkmate') {
      sounds.playGameOver();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else if (newState.inCheck) {
      sounds.playCheck();
    } else if (newState.lastMoveSAN?.includes('x')) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    // Trigger Stockfish evaluation
    triggerLiveEvaluation(newState.fen);
  };

  // Start a new game
  const handleNewGame = async (mode: GameMode, depth: number) => {
    setGameMode(mode);
    setAiDepth(depth);
    setOrientation(mode === 'vs_custom_ai_black' ? 'black' : 'white');
    setErrorMessage(null);
    setReviewPly(null);
    setAnalysisReport(null);

    try {
      const res = await fetch(`${API_BASE}/game/new`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data: GameState = await res.json();
      if (data.ok) {
        setGameState(data);
        setHistoryFENs([data.fen]);
        triggerLiveEvaluation(data.fen);
      }
    } catch (err: any) {
      setErrorMessage('Failed to start new game');
    }
  };

  // Restart active game
  const handleRestart = () => {
    if (window.confirm('Restart the current match from starting position?')) {
      handleNewGame(gameMode, aiDepth);
    }
  };

  // Undo move
  const handleUndo = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/undo`, {
        method: 'POST'
      });
      const data: GameState = await res.json();
      if (data.ok) {
        // If playing against AI, undo second move as well to return turn to human
        if (gameMode !== 'two_player' && data.sideToMove !== orientation) {
          const res2 = await fetch(`${API_BASE}/game/undo`, { method: 'POST' });
          const data2: GameState = await res2.json();
          if (data2.ok) {
            setGameState(data2);
            setHistoryFENs((prev) => prev.slice(0, -2));
            triggerLiveEvaluation(data2.fen);
            return;
          }
        }
        setGameState(data);
        setHistoryFENs((prev) => prev.slice(0, -1));
        triggerLiveEvaluation(data.fen);
      }
    } catch (err: any) {
      setErrorMessage('Failed to undo move');
    }
  };

  // Resign
  const handleResign = () => {
    if (window.confirm('Are you sure you want to resign this game?')) {
      setGameState((prev) => ({
        ...prev,
        status: 'resigned',
        isGameOver: true
      }));
      sounds.playGameOver();
    }
  };

  // Historical move navigation
  const handleSelectPly = (ply: number) => {
    if (ply === gameState.historySAN.length) {
      setReviewPly(null);
    } else {
      setReviewPly(ply);
    }
  };

  // Active displayed FEN (current vs historical review)
  const displayedFEN = reviewPly !== null && historyFENs[reviewPly]
    ? historyFENs[reviewPly]
    : gameState.fen;

  // Post-Game Analysis execution
  const handleStartAnalysis = async () => {
    setIsAnalysisModalOpen(true);
    if (analysisReport) return; // already analyzed

    setIsAnalyzingGame(true);
    setAnalysisProgress({ current: 0, total: gameState.historyUCI.length });

    try {
      const res = await fetch(`${API_BASE}/stockfish/analyze-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          historyUCI: gameState.historyUCI,
          historySAN: gameState.historySAN,
          depth: 10
        })
      });
      const data = await res.json();
      if (data.ok && data.analysisId) {
        activeAnalysisIdRef.current = data.analysisId;
        pollAnalysisStatus(data.analysisId);
      }
    } catch (err: any) {
      setErrorMessage('Failed to start Stockfish game analysis');
      setIsAnalyzingGame(false);
    }
  };

  const pollAnalysisStatus = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/stockfish/analysis-status/${id}`);
        const data = await res.json();
        if (data.ok) {
          if (data.status === 'running' && data.progress) {
            setAnalysisProgress(data.progress);
          } else if (data.status === 'completed' && data.report) {
            clearInterval(interval);
            setAnalysisReport(data.report);
            setIsAnalyzingGame(false);
          } else if (data.status === 'error' || data.status === 'cancelled') {
            clearInterval(interval);
            setIsAnalyzingGame(false);
          }
        }
      } catch (err) {
        clearInterval(interval);
        setIsAnalyzingGame(false);
      }
    }, 600);
  };

  const handleCancelAnalysis = async () => {
    if (activeAnalysisIdRef.current) {
      await fetch(`${API_BASE}/stockfish/cancel-analysis/${activeAnalysisIdRef.current}`, {
        method: 'POST'
      });
      setIsAnalyzingGame(false);
    }
  };

  const lastMoveObj = React.useMemo(() => {
    if (!gameState.lastMoveUCI || gameState.lastMoveUCI.length < 4) return undefined;
    return {
      from: gameState.lastMoveUCI.substring(0, 2),
      to: gameState.lastMoveUCI.substring(2, 4)
    };
  }, [gameState.lastMoveUCI]);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">♔</span>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-100 flex items-center gap-2">
                SHATRANJ <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">C++ ENGINE</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Minimax AI + Stockfish Analysis Dashboard
              </p>
            </div>
          </div>

          {/* Mode Badge & Opponent Indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700/80 text-xs">
              {gameMode === 'vs_custom_ai_white' || gameMode === 'vs_custom_ai_black' ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-slate-200">Custom C++ AI (Depth {aiDepth})</span>
                </>
              ) : gameMode === 'vs_stockfish' ? (
                <>
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-amber-300">Stockfish UCI Engine</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-semibold text-slate-200">Local 2-Player</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="max-w-md mx-auto my-3 px-4 py-2.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center justify-between text-xs text-rose-200 shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Dashboard */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_340px] gap-6 items-start">
        {/* Left: Real-time Stockfish Evaluation Bar */}
        <div className="hidden lg:flex justify-center">
          <EvaluationBar
            analysis={liveAnalysis}
            isThinking={isStockfishThinking}
            orientation={orientation}
          />
        </div>

        {/* Center: Interactive Chessboard */}
        <div className="flex flex-col items-center gap-4">
          {/* Top Player Status */}
          <div className="w-full max-w-[560px] flex items-center justify-between px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-base">{orientation === 'white' ? '♚' : '♔'}</span>
              <span>{orientation === 'white' ? (gameMode === 'two_player' ? 'Black' : 'Computer 🤖') : 'White'}</span>
            </div>
            {isAiThinking && (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <Cpu className="w-3.5 h-3.5" /> AI Thinking...
              </span>
            )}
          </div>

          {/* Chessboard component */}
          <Chessboard
            fen={displayedFEN}
            orientation={orientation}
            legalMoves={reviewPly === null ? gameState.legalMoves : []}
            lastMove={lastMoveObj}
            inCheck={reviewPly === null && gameState.inCheck}
            sideToMove={gameState.sideToMove}
            disabled={isAiThinking || gameState.isGameOver || reviewPly !== null}
            onMove={handleMakeMove}
          />

          {/* Bottom Player Status */}
          <div className="w-full max-w-[560px] flex items-center justify-between px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-base">{orientation === 'white' ? '♔' : '♚'}</span>
              <span>{orientation === 'white' ? 'You (White)' : 'You (Black)'}</span>
            </div>
            {gameState.isGameOver && (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" /> {
                  gameState.status === 'checkmate' ? 'Checkmate!' :
                  gameState.status === 'stalemate' ? 'Stalemate Draw' :
                  gameState.status === 'draw_fifty_moves' ? '50-Move Draw' : 'Game Over'
                }
              </span>
            )}
          </div>
        </div>

        {/* Right Sidebar: Move History & Controls */}
        <div className="flex flex-col gap-4">
          <Controls
            gameMode={gameMode}
            aiDepth={aiDepth}
            orientation={orientation}
            canUndo={gameState.historySAN.length > 0}
            isGameOver={gameState.isGameOver}
            fen={gameState.fen}
            pgn={gameState.pgn}
            onNewGame={handleNewGame}
            onRestart={handleRestart}
            onUndo={handleUndo}
            onResign={handleResign}
            onFlipBoard={() => setOrientation(prev => prev === 'white' ? 'black' : 'white')}
            onOpenAnalysis={handleStartAnalysis}
          />

          <MoveHistory
            historySAN={gameState.historySAN}
            currentPly={reviewPly !== null ? reviewPly : gameState.historySAN.length}
            onSelectPly={handleSelectPly}
            isReviewing={reviewPly !== null}
            onResumeLive={() => setReviewPly(null)}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        Shatranj C++ Game Engine • Native Minimax AI • Stockfish UCI 10/17 Real-Time Analysis
      </footer>

      {/* Post-Game Analysis Report Modal */}
      <PostGameAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        report={analysisReport}
        isLoading={isAnalyzingGame}
        progress={analysisProgress}
        onCancel={handleCancelAnalysis}
        onSelectPly={(ply) => {
          handleSelectPly(ply);
          setIsAnalysisModalOpen(false);
        }}
        selectedPly={reviewPly !== null ? reviewPly : gameState.historySAN.length}
        onRestartAnalysis={handleStartAnalysis}
      />
    </div>
  );
};
