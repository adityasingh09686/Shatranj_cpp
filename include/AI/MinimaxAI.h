#pragma once
#include "Board.h"
#include "AI/Evaluator.h"

class MinimaxAI {
private:
    int nodesEvaluated;

    // Negamax algorithm with alpha-beta pruning
    int negamax(Board& board, int depth, int alpha, int beta, int colorMultiplier);

    // Order moves for better alpha-beta pruning efficiency
    void orderMoves(const Board& board, std::vector<Move>& moves);

public:
    MinimaxAI();

    // Find the best legal move for the current side to move
    Move findBestMove(const Board& board, int depth = 3);

    int getNodesEvaluated() const { return nodesEvaluated; }
};
