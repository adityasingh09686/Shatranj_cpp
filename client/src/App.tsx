import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Chessboard } from './components/Chessboard';
import { EvaluationBar } from './components/EvaluationBar';
import { MoveHistory } from './components/MoveHistory';
import { Controls } from './components/Controls';
import { ChessClock } from './components/ChessClock';
import { PuzzleTrainer, PUZZLE_DATABASE, Puzzle } from './components/PuzzleTrainer';
import { HistoricalGamesModal, HistoricalGame } from './components/HistoricalGamesModal';
import { GameHistoryDrawer, SavedGameRecord } from './components/GameHistoryDrawer';
import { PostGameAnalysisModal } from './components/PostGameAnalysisModal';
import {
  GameMode,
  GameState,
  PositionAnalysis,
  PostGameAnalysisReport,
  SideColor
} from './types';
import { sounds } from './utils/sound';
import { Trophy, AlertCircle, Cpu, User, Bot, Target } from 'lucide-react';

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

  // Theme & Visual Settings
  const [currentTheme, setCurrentTheme] = useState<string>(() => {
    return localStorage.getItem('shatranj_theme') || 'emerald';
  });
  const [showArrows, setShowArrows] = useState<boolean>(true);

  // Chess Clocks State
  const [timeControlMins, setTimeControlMins] = useState<number>(0);
  const [whiteTimeMs, setWhiteTimeMs] = useState<number>(0);
  const [blackTimeMs, setBlackTimeMs] = useState<number>(0);

  // AI vs AI Spectator duel state
  const [isSpectatorPaused, setIsSpectatorPaused] = useState<boolean>(false);

  // Tactical Puzzle Trainer State
  const [isPuzzleMode, setIsPuzzleMode] = useState<boolean>(false);
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [puzzleMoveStep, setPuzzleMoveStep] = useState<number>(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'unsolved' | 'correct' | 'wrong'>('unsolved');

  // Modals & Drawers
  const [isHistoricalModalOpen, setIsHistoricalModalOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isAnalyzingGame, setIsAnalyzingGame] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number } | undefined>();
  const [analysisReport, setAnalysisReport] = useState<PostGameAnalysisReport | null>(null);
  const activeAnalysisIdRef = useRef<string | null>(null);

  // Saved Games Archive
  const [savedGames, setSavedGames] = useState<SavedGameRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('shatranj_saved_games') || '[]');
    } catch {
      return [];
    }
  });

  // Save theme preference
  const handleChangeTheme = (theme: string) => {
    setCurrentTheme(theme);
    localStorage.setItem('shatranj_theme', theme);
  };

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

  // Clocks Countdown Timer
  useEffect(() => {
    if (timeControlMins === 0 || gameState.isGameOver || isPuzzleMode) return;
    if (gameState.historyUCI.length === 0) return; // Clocks don't tick until 1st move is made

    const timer = setInterval(() => {
      if (gameState.sideToMove === 'white') {
        setWhiteTimeMs((prev) => Math.max(0, prev - 100));
      } else {
        setBlackTimeMs((prev) => Math.max(0, prev - 100));
      }
    }, 100);

    return () => clearInterval(timer);
  }, [timeControlMins, gameState.sideToMove, gameState.isGameOver, isPuzzleMode, gameState.historyUCI.length]);

  // Timeout handler
  const handleTimeout = useCallback((color: SideColor) => {
    if (gameState.isGameOver) return;
    setGameState((prev) => ({
      ...prev,
      isGameOver: true,
      status: 'resigned' // flag fall
    }));
    sounds.playGameOver();
    setErrorMessage(`${color === 'white' ? 'White' : 'Black'} ran out of time!`);
  }, [gameState.isGameOver]);

  // AI vs AI Spectator loop & Regular AI turns
  useEffect(() => {
    if (gameState.isGameOver || isAiThinking || isPuzzleMode) return;

    if (gameMode === 'spectator_ai_vs_ai') {
      if (isSpectatorPaused) return;

      const spectatorTimer = setTimeout(() => {
        if (gameState.sideToMove === 'white') {
          triggerCustomAIMove();
        } else {
          triggerStockfishMove();
        }
      }, 1000);

      return () => clearTimeout(spectatorTimer);
    }

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
  }, [gameState.sideToMove, gameState.isGameOver, gameMode, isAiThinking, isSpectatorPaused, isPuzzleMode]);

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

  // Optional Stockfish gameplay move
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
      setReviewPly(null);
    }
    setErrorMessage(null);

    // If in Tactical Puzzle Mode, validate move
    if (isPuzzleMode && activePuzzle) {
      const expectedMove = activePuzzle.solutionUCI[puzzleMoveStep];
      if (moveUCI.startsWith(expectedMove)) {
        // Correct move
        const nextStep = puzzleMoveStep + 1;
        setPuzzleMoveStep(nextStep);

        if (nextStep >= activePuzzle.solutionUCI.length) {
          setPuzzleStatus('correct');
          sounds.playGameOver();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } else {
          // Play opponent response in puzzle sequence
          sounds.playMove();
          setTimeout(() => {
            const oppMove = activePuzzle.solutionUCI[nextStep];
            submitMoveToEngine(oppMove);
            setPuzzleMoveStep(nextStep + 1);
          }, 400);
        }
      } else {
        setPuzzleStatus('wrong');
        sounds.playCheck();
        return;
      }
    }

    submitMoveToEngine(moveUCI);
  };

  const submitMoveToEngine = async (moveUCI: string) => {
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

  // Update state, sound effects, celebration confetti, and archive completed games
  const handleStateUpdate = (newState: GameState) => {
    setGameState(newState);
    setHistoryFENs((prev) => [...prev, newState.fen]);
    setReviewPly(null);

    // Audio effects
    if (newState.isGameOver && newState.status === 'checkmate') {
      sounds.playGameOver();
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    } else if (newState.inCheck) {
      sounds.playCheck();
    } else if (newState.lastMoveSAN?.includes('x')) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    // Auto-save game to archive when game ends
    if (newState.isGameOver && !isPuzzleMode && newState.historySAN.length >= 2) {
      const record: SavedGameRecord = {
        id: `game-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        result: newState.status === 'checkmate'
          ? (newState.sideToMove === 'white' ? '0-1' : '1-0')
          : '1/2-1/2',
        movesCount: newState.historySAN.length,
        pgn: newState.pgn,
        mode: gameMode
      };
      setSavedGames((prev) => {
        const updated = [record, ...prev];
        localStorage.setItem('shatranj_saved_games', JSON.stringify(updated.slice(0, 50)));
        return updated;
      });
    }

    // Trigger Stockfish evaluation
    triggerLiveEvaluation(newState.fen);
  };

  // Start a new game
  const handleNewGame = async (mode: GameMode, depth: number, timeMins: number = 0) => {
    setGameMode(mode);
    setAiDepth(depth);
    setOrientation(mode === 'vs_custom_ai_black' ? 'black' : 'white');
    setErrorMessage(null);
    setReviewPly(null);
    setAnalysisReport(null);
    setIsPuzzleMode(false);
    setActivePuzzle(null);
    setIsSpectatorPaused(false);

    // Setup Clocks
    setTimeControlMins(timeMins);
    const ms = timeMins * 60 * 1000;
    setWhiteTimeMs(ms);
    setBlackTimeMs(ms);

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
      handleNewGame(gameMode, aiDepth, timeControlMins);
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

  // Load a Tactical Puzzle
  const handleLoadPuzzle = async (puzzle: Puzzle) => {
    setIsPuzzleMode(true);
    setActivePuzzle(puzzle);
    setPuzzleMoveStep(0);
    setPuzzleStatus('unsolved');
    setOrientation(puzzle.sideToMove);

    try {
      const res = await fetch(`${API_BASE}/game/load-fen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fen: puzzle.fen })
      });
      const data: GameState = await res.json();
      if (data.ok) {
        setGameState(data);
        setHistoryFENs([puzzle.fen]);
        triggerLiveEvaluation(puzzle.fen);
      }
    } catch (err) {
      setErrorMessage('Failed to load puzzle position');
    }
  };

  // Show hint for puzzle
  const handleShowPuzzleHint = () => {
    if (!activePuzzle) return;
    const nextMove = activePuzzle.solutionUCI[puzzleMoveStep];
    if (nextMove && nextMove.length >= 2) {
      const fromSq = nextMove.substring(0, 2);
      setErrorMessage(`Hint: Look at piece on square ${fromSq.toUpperCase()}`);
    }
  };

  // Load a Historical Grandmaster Game
  const handleSelectHistoricalGame = async (game: HistoricalGame) => {
    await handleNewGame('two_player', 3, 0);
    setOrientation('white');

    // Make all moves sequentially to recreate game
    for (const m of game.uciMoves) {
      await fetch(`${API_BASE}/game/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ move: m })
      });
    }
    fetchGameState();
  };

  // Post-Game Analysis execution
  const handleStartAnalysis = async () => {
    setIsAnalysisModalOpen(true);
    if (analysisReport) return;

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
    <div
      data-theme={currentTheme}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
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
                Opening Book • Zobrist TT • Stockfish Analysis • Tactical Puzzles
              </p>
            </div>
          </div>

          {/* Mode Badge & Opponent Indicator */}
          <div className="header-mode-badge">
            {isPuzzleMode ? (
              <>
                <Target size={15} color="#10b981" />
                <span style={{ color: '#a7f3d0' }}>Tactical Puzzle Training</span>
              </>
            ) : gameMode === 'spectator_ai_vs_ai' ? (
              <>
                <Bot size={15} color="#f59e0b" />
                <span style={{ color: '#fde68a' }}>AI Duel: Minimax vs Stockfish</span>
              </>
            ) : gameMode === 'vs_custom_ai_white' || gameMode === 'vs_custom_ai_black' ? (
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
          {/* Top Player Status with Digital Clock */}
          <div className="player-card">
            <div className="player-info">
              <span className="player-avatar">{orientation === 'white' ? '♚' : '♔'}</span>
              <span>
                {orientation === 'white'
                  ? (gameMode === 'two_player' ? 'Black' : gameMode === 'spectator_ai_vs_ai' ? 'Stockfish ⚡' : 'Computer 🤖')
                  : (gameMode === 'two_player' ? 'White' : 'White')}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {isAiThinking && (
                <span className="ai-status">
                  <Cpu size={14} /> AI Thinking...
                </span>
              )}
              {timeControlMins > 0 && (
                <ChessClock
                  timeMs={orientation === 'white' ? blackTimeMs : whiteTimeMs}
                  isActive={gameState.sideToMove === (orientation === 'white' ? 'black' : 'white') && !gameState.isGameOver}
                  onTimeout={() => handleTimeout(orientation === 'white' ? 'black' : 'white')}
                  label={orientation === 'white' ? 'Black' : 'White'}
                />
              )}
            </div>
          </div>

          {/* Chessboard component with SVG Arrow Overlays */}
          <Chessboard
            fen={displayedFEN}
            orientation={orientation}
            legalMoves={reviewPly === null ? gameState.legalMoves : []}
            lastMove={lastMoveObj}
            inCheck={reviewPly === null && gameState.inCheck}
            sideToMove={gameState.sideToMove}
            disabled={isAiThinking || gameState.isGameOver || reviewPly !== null}
            onMove={handleMakeMove}
            bestMove={liveAnalysis?.bestMove}
            showArrows={showArrows}
          />

          {/* Bottom Player Status with Digital Clock */}
          <div className="player-card">
            <div className="player-info">
              <span className="player-avatar">{orientation === 'white' ? '♔' : '♚'}</span>
              <span>
                {gameMode === 'spectator_ai_vs_ai'
                  ? 'Custom C++ AI (White)'
                  : orientation === 'white' ? 'You (White)' : 'You (Black)'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {gameState.isGameOver && (
                <span className="game-over-status">
                  <Trophy size={14} /> {
                    gameState.status === 'checkmate' ? 'Checkmate!' :
                    gameState.status === 'stalemate' ? 'Stalemate Draw' :
                    gameState.status === 'draw_fifty_moves' ? '50-Move Draw' : 'Game Over'
                  }
                </span>
              )}
              {timeControlMins > 0 && (
                <ChessClock
                  timeMs={orientation === 'white' ? whiteTimeMs : blackTimeMs}
                  isActive={gameState.sideToMove === orientation && !gameState.isGameOver}
                  onTimeout={() => handleTimeout(orientation)}
                  label={orientation === 'white' ? 'White' : 'Black'}
                />
              )}
            </div>
          </div>

          {/* Tactical Puzzle Trainer Widget (When active) */}
          {isPuzzleMode && (
            <div style={{ width: '100%', maxWidth: '560px' }}>
              <PuzzleTrainer
                onLoadPuzzle={handleLoadPuzzle}
                activePuzzle={activePuzzle}
                onExitPuzzle={() => {
                  setIsPuzzleMode(false);
                  setActivePuzzle(null);
                  fetchGameState();
                }}
                puzzleStatus={puzzleStatus}
                onShowHint={handleShowPuzzleHint}
              />
            </div>
          )}
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
            currentTheme={currentTheme}
            onChangeTheme={handleChangeTheme}
            showArrows={showArrows}
            onToggleArrows={() => setShowArrows(prev => !prev)}
            onOpenPuzzles={() => handleLoadPuzzle(PUZZLE_DATABASE[0])}
            onOpenHistorical={() => setIsHistoricalModalOpen(true)}
            onOpenArchive={() => setIsArchiveOpen(true)}
            isSpectating={gameMode === 'spectator_ai_vs_ai'}
            isSpectatorPaused={isSpectatorPaused}
            onToggleSpectatorPause={() => setIsSpectatorPaused(p => !p)}
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
        Shatranj C++ Game Engine • Native Minimax AI • Zobrist Transposition Table • Opening Book • Stockfish UCI 10/17 Analysis
      </footer>

      {/* Historical Games Modal */}
      <HistoricalGamesModal
        isOpen={isHistoricalModalOpen}
        onClose={() => setIsHistoricalModalOpen(false)}
        onSelectGame={handleSelectHistoricalGame}
      />

      {/* Match History Archive Drawer */}
      <GameHistoryDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        games={savedGames}
        onLoadGamePGN={(loadedPgn) => {
          setErrorMessage(`PGN loaded from archive (${loadedPgn.length} chars)`);
        }}
        onClearHistory={() => {
          setSavedGames([]);
          localStorage.removeItem('shatranj_saved_games');
        }}
      />

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
