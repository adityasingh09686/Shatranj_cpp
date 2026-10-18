#pragma once
#include "Board.h"
#include "AI/Evaluator.h"
#include "AI/TranspositionTable.h"
#include "AI/Zobrist.h"
#include "AI/OpeningBook.h"

class MinimaxAI {
private:
    int nodesEvaluated;
    TranspositionTable tt;
    Move killerMoves[64][2];

    // Quiescence search to avoid the horizon effect
    int quiescence(Board& board, int alpha, int beta, int colorMultiplier, int qDepth);

    // Negamax algorithm with alpha-beta pruning and transposition table
    int negamax(Board& board, int depth, int alpha, int beta, int colorMultiplier, int ply);

    // Order moves for optimal alpha-beta cutoffs
    void orderMoves(const Board& board, std::vector<Move>& moves, const Move& hashMove, int ply);

public:
    MinimaxAI();

    // Find the best legal move for the current side to move
    Move findBestMove(const Board& board, int depth = 3, const std::vector<std::string>& historyUCI = {});

    int getNodesEvaluated() const { return nodesEvaluated; }
    void clearTranspositionTable() { tt.clear(); }
};
