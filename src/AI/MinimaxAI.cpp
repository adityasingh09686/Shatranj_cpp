#include "AI/MinimaxAI.h"
#include <algorithm>

MinimaxAI::MinimaxAI() : nodesEvaluated(0) {}

void MinimaxAI::orderMoves(const Board& board, std::vector<Move>& moves) {
    auto scoreMove = [&](const Move& m) -> int {
        int score = 0;
        const Piece* mover = board.getPieceAt(m.from);
        const Piece* target = board.getPieceAt(m.to);

        // Captures: prioritize capturing valuable pieces with less valuable pieces (MVV-LVA)
        if (target != nullptr) {
            int victimVal = Evaluator::getPieceValue(target->getType());
            int attackerVal = mover ? Evaluator::getPieceValue(mover->getType()) : 0;
            score += 10000 + (victimVal * 10) - attackerVal;
        } else if (m.flag == MoveFlag::EnPassant) {
            score += 10000 + (Evaluator::PAWN_VALUE * 10) - Evaluator::PAWN_VALUE;
        }

        // Promotions
        if (m.flag == MoveFlag::Promotion) {
            score += 9000 + Evaluator::getPieceValue(m.promotionType);
        }

        // Castling
        if (m.flag == MoveFlag::CastleKingside || m.flag == MoveFlag::CastleQueenside) {
            score += 500;
        }

        return score;
    };

    std::sort(moves.begin(), moves.end(), [&](const Move& a, const Move& b) {
        return scoreMove(a) > scoreMove(b);
    });
}

int MinimaxAI::negamax(Board& board, int depth, int alpha, int beta, int colorMultiplier) {
    ++nodesEvaluated;

    Color side = board.getSideToMove();
    if (board.isCheckmate(side)) {
        return -100000 - depth;
    }
    if (board.isStalemate(side) || board.getHalfMoveClock() >= 100) {
        return 0;
    }

    if (depth <= 0) {
        return colorMultiplier * Evaluator::evaluate(board);
    }

    auto moves = board.generateLegalMoves();
    if (moves.empty()) {
        if (board.isInCheck(side)) return -100000 - depth;
        return 0;
    }

    orderMoves(board, moves);

    int maxScore = -1000000;

    for (const auto& m : moves) {
        Board copy = board;
        copy.makeMove(m);

        int score = -negamax(copy, depth - 1, -beta, -alpha, -colorMultiplier);

        if (score > maxScore) {
            maxScore = score;
        }
        if (score > alpha) {
            alpha = score;
        }
        if (alpha >= beta) {
            break; // Beta cut-off
        }
    }

    return maxScore;
}

Move MinimaxAI::findBestMove(const Board& board, int depth) {
    nodesEvaluated = 0;
    auto moves = board.generateLegalMoves();
    if (moves.empty()) {
        return Move();
    }
    if (moves.size() == 1) {
        return moves[0];
    }

    orderMoves(board, moves);

    int colorMultiplier = (board.getSideToMove() == Color::White) ? 1 : -1;
    int bestScore = -1000000;
    Move bestMove = moves[0];

    int alpha = -1000000;
    int beta  =  1000000;

    for (const auto& m : moves) {
        Board copy = board;
        copy.makeMove(m);

        int score = -negamax(copy, depth - 1, -beta, -alpha, -colorMultiplier);

        if (score > bestScore) {
            bestScore = score;
            bestMove = m;
        }
        if (score > alpha) {
            alpha = score;
        }
    }

    return bestMove;
}
