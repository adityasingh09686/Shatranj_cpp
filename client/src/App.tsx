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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">♔</span>
            <div>
              <h1 className="brand-title">
                SHATRANJ <span className="badge-engine">C++ ENGINE</span>
              </h1>
              <p className="brand-subtitle">
                Minimax AI + Stockfish Analysis Dashboard
              </p>
            </div>
          </div>

          {/* Mode Badge & Opponent Indicator */}
          <div className="header-mode-badge">
            {gameMode === 'vs_custom_ai_white' || gameMode === 'vs_custom_ai_black' ? (
              <>
                <Cpu size={15} color="#10b981" />
                <span>Custom C++ AI (Depth {aiDepth})</span>
              </>
            ) : gameMode === 'vs_stockfish' ? (
              <>
                <Cpu size={15} color="#f59e0b" />
                <span style={{ color: '#fde68a' }}>Stockfish UCI Engine</span>
              </>
            ) : (
              <>
                <User size={15} color="#6366f1" />
                <span>Local 2-Player</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="error-toast">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} color="#f87171" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', fontWeight: 800, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Workspace Dashboard */}
      <main className="main-layout">
        {/* Left: Real-time Stockfish Evaluation Bar */}
        <div className="eval-column">
          <EvaluationBar
            analysis={liveAnalysis}
            isThinking={isStockfishThinking}
            orientation={orientation}
          />
        </div>

        {/* Center: Interactive Chessboard */}
        <div className="board-column">
          {/* Top Player Status */}
          <div className="player-card">
            <div className="player-info">
              <span className="player-avatar">{orientation === 'white' ? '♚' : '♔'}</span>
              <span>{orientation === 'white' ? (gameMode === 'two_player' ? 'Black' : 'Computer 🤖') : 'White'}</span>
            </div>
            {isAiThinking && (
              <span className="ai-status">
                <Cpu size={14} /> AI Thinking...
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
          <div className="player-card">
            <div className="player-info">
              <span className="player-avatar">{orientation === 'white' ? '♔' : '♚'}</span>
              <span>{orientation === 'white' ? 'You (White)' : 'You (Black)'}</span>
            </div>
            {gameState.isGameOver && (
              <span className="game-over-status">
                <Trophy size={14} /> {
                  gameState.status === 'checkmate' ? 'Checkmate!' :
                  gameState.status === 'stalemate' ? 'Stalemate Draw' :
                  gameState.status === 'draw_fifty_moves' ? '50-Move Draw' : 'Game Over'
                }
              </span>
            )}
          </div>
        </div>

        {/* Right Sidebar: Move History & Controls */}
        <div className="sidebar-column">
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
      <footer className="app-footer">
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
