export type SideColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'checkmate' | 'stalemate' | 'resigned' | 'draw_fifty_moves';

export interface GameStateResponse {
  ok: boolean;
  fen: string;
  sideToMove: SideColor;
  inCheck: boolean;
  status: GameStatus;
  isGameOver: boolean;
  legalMoves: string[];
  historySAN: string[];
  historyUCI: string[];
  pgn: string;
  lastMoveSAN?: string;
  lastMoveUCI?: string;
  aiMove?: string;
  aiMoveSAN?: string;
  nodesEvaluated?: number;
  error?: string;
}

export interface WDLEstimate {
  whiteWin: number;
  draw: number;
  blackWin: number;
}

export interface EvaluationScore {
  type: 'cp' | 'mate';
  value: number; // positive = White advantage, negative = Black advantage
  formatted: string; // e.g. "+1.42" or "M3" or "-0.85" or "-M2"
}

export interface PositionAnalysis {
  depth: number;
  seldepth: number;
  score: EvaluationScore;
  wdl?: WDLEstimate;
  nodes: number;
  nps: number;
  time: number;
  bestMove: string;
  pv: string[];
}

export type MoveClassification = 
  | 'Best' 
  | 'Excellent' 
  | 'Good' 
  | 'Inaccuracy' 
  | 'Mistake' 
  | 'Blunder' 
  | 'Missed Win'
  | 'Book';

export interface MoveAnalysisReport {
  ply: number;
  moveNumber: number;
  side: SideColor;
  san: string;
  uci: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: EvaluationScore;
  evalAfter: EvaluationScore;
  scoreLoss: number; // centipawns lost from this move
  classification: MoveClassification;
  bestEngineMove: string;
  bestEngineMoveSAN?: string;
  pv: string[];
  commentary?: string;
}

export interface PostGameAnalysisReport {
  id: string;
  totalPlies: number;
  whiteAccuracy: number;
  blackAccuracy: number;
  classificationSummary: {
    white: Record<MoveClassification, number>;
    black: Record<MoveClassification, number>;
  };
  moves: MoveAnalysisReport[];
  criticalTurningPoints: number[]; // plies where game swung significantly
}
