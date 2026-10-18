import { CppChessEngine } from './cppEngine';
import { StockfishUCI } from './stockfish';
import {
  EvaluationScore,
  MoveAnalysisReport,
  MoveClassification,
  PostGameAnalysisReport,
  SideColor
} from './types';

export class GameAnalysisPipeline {
  private activeAnalyses = new Map<string, { cancelled: boolean }>();

  constructor(
    private cppEngine: CppChessEngine,
    private stockfish: StockfishUCI
  ) {}

  public cancel(analysisId: string) {
    const item = this.activeAnalyses.get(analysisId);
    if (item) {
      item.cancelled = true;
      this.stockfish.stopSearch();
    }
  }

  public async analyzeGame(
    analysisId: string,
    historyUCI: string[],
    historySAN: string[],
    depth = 10,
    onProgress?: (ply: number, total: number) => void
  ): Promise<PostGameAnalysisReport> {
    const state = { cancelled: false };
    this.activeAnalyses.set(analysisId, state);

    const movesReport: MoveAnalysisReport[] = [];
    const classificationSummary = {
      white: {
        'Best': 0, 'Excellent': 0, 'Good': 0,
        'Inaccuracy': 0, 'Mistake': 0, 'Blunder': 0,
        'Missed Win': 0, 'Book': 0
      },
      black: {
        'Best': 0, 'Excellent': 0, 'Good': 0,
        'Inaccuracy': 0, 'Mistake': 0, 'Blunder': 0,
        'Missed Win': 0, 'Book': 0
      }
    };

    // Replay moves sequentially from start
    await this.cppEngine.newGame();
    let currentGameState = await this.cppEngine.getState();
    const totalPlies = historyUCI.length;

    let whiteLossSum = 0;
    let whiteMoveCount = 0;
    let blackLossSum = 0;
    let blackMoveCount = 0;
    const criticalTurningPoints: number[] = [];

    for (let ply = 0; ply < totalPlies; ++ply) {
      if (state.cancelled) {
        this.activeAnalyses.delete(analysisId);
        throw new Error('Analysis cancelled by user');
      }

      if (onProgress) {
        onProgress(ply + 1, totalPlies);
      }

      const uciMove = historyUCI[ply];
      const sanMove = historySAN[ply];
      const side: SideColor = (ply % 2 === 0) ? 'white' : 'black';
      const moveNumber = Math.floor(ply / 2) + 1;
      const fenBefore = currentGameState.fen;

      // 1. Analyze position before move with Stockfish
      const analysisBefore = await this.stockfish.analyzePosition(fenBefore, depth);
      const evalBefore = analysisBefore.score;
      const bestEngineMove = analysisBefore.bestMove;

      // 2. Play the move via C++ engine
      currentGameState = await this.cppEngine.makeMove(uciMove);
      if (!currentGameState.ok || !currentGameState.fen) {
        throw new Error(`Failed to apply move ${uciMove} at ply ${ply}: ${currentGameState.error || 'No FEN returned'}`);
      }
      const fenAfter = currentGameState.fen;

      // 3. Analyze position after move with Stockfish
      const analysisAfter = await this.stockfish.analyzePosition(fenAfter, depth);
      const evalAfter = analysisAfter.score;

      // 4. Calculate score loss from moving player's perspective
      // Remember: eval values are normalized to White perspective (positive = White, negative = Black)
      const cpBefore = this.scoreToEquivalentCp(evalBefore);
      const cpAfter = this.scoreToEquivalentCp(evalAfter);

      let scoreLoss = 0;
      if (side === 'white') {
        scoreLoss = Math.max(0, cpBefore - cpAfter);
        whiteLossSum += scoreLoss;
        whiteMoveCount++;
      } else {
        scoreLoss = Math.max(0, cpAfter - cpBefore);
        blackLossSum += scoreLoss;
        blackMoveCount++;
      }

      // 5. Classify the move
      const classification = this.classifyMove(
        uciMove,
        bestEngineMove,
        scoreLoss,
        evalBefore,
        evalAfter,
        side
      );

      classificationSummary[side][classification]++;

      // 6. Detect critical turning points (>200 cp swing)
      if (scoreLoss >= 200) {
        criticalTurningPoints.push(ply + 1);
      }

      movesReport.push({
        ply: ply + 1,
        moveNumber,
        side,
        san: sanMove,
        uci: uciMove,
        fenBefore,
        fenAfter,
        evalBefore,
        evalAfter,
        scoreLoss,
        classification,
        bestEngineMove,
        pv: analysisBefore.pv
      });
    }

    // Accuracy calculation: 100 * exp(-0.004 * avgLoss)
    const whiteAvgLoss = whiteMoveCount > 0 ? (whiteLossSum / whiteMoveCount) : 0;
    const blackAvgLoss = blackMoveCount > 0 ? (blackLossSum / blackMoveCount) : 0;

    const whiteAccuracy = Math.round(Math.max(10, Math.min(100, 100 * Math.exp(-0.004 * whiteAvgLoss))));
    const blackAccuracy = Math.round(Math.max(10, Math.min(100, 100 * Math.exp(-0.004 * blackAvgLoss))));

    this.activeAnalyses.delete(analysisId);

    return {
      id: analysisId,
      totalPlies,
      whiteAccuracy,
      blackAccuracy,
      classificationSummary,
      moves: movesReport,
      criticalTurningPoints
    };
  }

  private scoreToEquivalentCp(score: EvaluationScore): number {
    if (score.type === 'cp') {
      return score.value;
    }
    // Forced mate in M moves:
    // M1 = ~30000 cp, M2 = 29000 cp, etc.
    const sign = score.value >= 0 ? 1 : -1;
    const distance = Math.abs(score.value);
    return sign * (30000 - distance * 100);
  }

  private classifyMove(
    playedMove: string,
    bestMove: string,
    scoreLoss: number,
    evalBefore: EvaluationScore,
    evalAfter: EvaluationScore,
    side: SideColor
  ): MoveClassification {
    // Top engine recommendation or almost identical evaluation
    if (playedMove.toLowerCase() === bestMove.toLowerCase() || scoreLoss <= 10) {
      return 'Best';
    }

    // Missed Win: Player had decisive win (cp >= +500 or forced mate) and lost it (below +150 cp)
    const cpBefore = this.scoreToEquivalentCp(evalBefore);
    const cpAfter = this.scoreToEquivalentCp(evalAfter);
    const playerBefore = side === 'white' ? cpBefore : -cpBefore;
    const playerAfter = side === 'white' ? cpAfter : -cpAfter;

    if (playerBefore >= 500 && playerAfter <= 150) {
      return 'Missed Win';
    }

    if (scoreLoss <= 30) {
      return 'Excellent';
    }
    if (scoreLoss <= 65) {
      return 'Good';
    }
    if (scoreLoss <= 150) {
      return 'Inaccuracy';
    }
    if (scoreLoss <= 300) {
      return 'Mistake';
    }
    return 'Blunder';
  }
}
