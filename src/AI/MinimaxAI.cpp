#include "AI/MinimaxAI.h"
#include <algorithm>
#include <cstring>

MinimaxAI::MinimaxAI() : nodesEvaluated(0), tt(32) {
    Zobrist::init();
    std::memset(killerMoves, 0, sizeof(killerMoves));
}

void MinimaxAI::orderMoves(const Board& board, std::vector<Move>& moves, const Move& hashMove, int ply) {
    auto scoreMove = [&](const Move& m) -> int {
        // 1. Hash move from Transposition Table gets highest priority
        if (hashMove.from == m.from && hashMove.to == m.to && hashMove.promotionType == m.promotionType) {
            return 300000;
        }

        int score = 0;
        const Piece* mover = board.getPieceAt(m.from);
        const Piece* target = board.getPieceAt(m.to);

        // 2. Captures: MVV-LVA (Most Valuable Victim - Least Valuable Attacker)
        if (target != nullptr) {
            int victimVal = Evaluator::getPieceValue(target->getType());
            int attackerVal = mover ? Evaluator::getPieceValue(mover->getType()) : 0;
            score += 100000 + (victimVal * 10) - attackerVal;
        } else if (m.flag == MoveFlag::EnPassant) {
            score += 100000 + (Evaluator::PAWN_VALUE * 10) - Evaluator::PAWN_VALUE;
        }

        // 3. Promotions
        if (m.flag == MoveFlag::Promotion) {
            score += 80000 + Evaluator::getPieceValue(m.promotionType);
        }

        // 4. Killer Moves (quiet moves that caused a beta cutoff previously at this ply)
        if (ply < 64) {
            if (m.from == killerMoves[ply][0].from && m.to == killerMoves[ply][0].to) {
                score += 50000;
            } else if (m.from == killerMoves[ply][1].from && m.to == killerMoves[ply][1].to) {
                score += 40000;
            }
        }

        // 5. Castling
        if (m.flag == MoveFlag::CastleKingside || m.flag == MoveFlag::CastleQueenside) {
            score += 1000;
        }

        return score;
    };

    std::sort(moves.begin(), moves.end(), [&](const Move& a, const Move& b) {
        return scoreMove(a) > scoreMove(b);
    });
}

int MinimaxAI::quiescence(Board& board, int alpha, int beta, int colorMultiplier, int qDepth) {
    ++nodesEvaluated;

    int standPat = colorMultiplier * Evaluator::evaluate(board);
    if (standPat >= beta) {
        return beta;
    }
    if (alpha < standPat) {
        alpha = standPat;
    }

    // Limit maximum quiescence search depth to prevent infinite capture chains
    if (qDepth >= 8) {
        return alpha;
    }

    // Generate only tactical captures
    auto allMoves = board.generateLegalMoves();
    std::vector<Move> captures;
    for (const auto& m : allMoves) {
        if (board.getPieceAt(m.to) != nullptr || m.flag == MoveFlag::EnPassant || m.flag == MoveFlag::Promotion) {
            captures.push_back(m);
        }
    }

    orderMoves(board, captures, Move(), 0);

    for (const auto& m : captures) {
        Board copy = board;
        copy.makeMove(m);

        int score = -quiescence(copy, -beta, -alpha, -colorMultiplier, qDepth + 1);

        if (score >= beta) {
            return beta;
        }
        if (score > alpha) {
            alpha = score;
        }
    }

    return alpha;
}

int MinimaxAI::negamax(Board& board, int depth, int alpha, int beta, int colorMultiplier, int ply) {
    ++nodesEvaluated;

    Color side = board.getSideToMove();
    if (board.isCheckmate(side)) {
        return -100000 + ply; // Prefer faster checkmates
    }
    if (board.isStalemate(side) || board.getHalfMoveClock() >= 100) {
        return 0;
    }

    uint64_t hash = Zobrist::computeHash(board);
    int ttScore = 0;
    Move ttBestMove;

    if (tt.probe(hash, depth, alpha, beta, ttScore, ttBestMove)) {
        return ttScore;
    }

    if (depth <= 0) {
        int qScore = quiescence(board, alpha, beta, colorMultiplier, 0);
        tt.store(hash, depth, qScore, TTFlag::Exact, Move());
        return qScore;
    }

    auto moves = board.generateLegalMoves();
    if (moves.empty()) {
        if (board.isInCheck(side)) return -100000 + ply;
        return 0;
    }

    orderMoves(board, moves, ttBestMove, ply);

    int originalAlpha = alpha;
    int maxScore = -1000000;
    Move bestMoveFound = moves[0];

    for (const auto& m : moves) {
        Board copy = board;
        copy.makeMove(m);

        int score = -negamax(copy, depth - 1, -beta, -alpha, -colorMultiplier, ply + 1);

        if (score > maxScore) {
            maxScore = score;
            bestMoveFound = m;
        }
        if (score > alpha) {
            alpha = score;
        }
        if (alpha >= beta) {
            // Beta cutoff: record killer move for quiet moves
            if (board.getPieceAt(m.to) == nullptr && m.flag != MoveFlag::Promotion && ply < 64) {
                if (!(killerMoves[ply][0].from == m.from && killerMoves[ply][0].to == m.to)) {
                    killerMoves[ply][1] = killerMoves[ply][0];
                    killerMoves[ply][0] = m;
                }
            }
            break;
        }
    }

    // Determine Transposition Table flag
    TTFlag flag = TTFlag::Exact;
    if (maxScore <= originalAlpha) {
        flag = TTFlag::UpperBound;
    } else if (maxScore >= beta) {
        flag = TTFlag::LowerBound;
    }

    tt.store(hash, depth, maxScore, flag, bestMoveFound);
    return maxScore;
}

Move MinimaxAI::findBestMove(const Board& board, int depth, const std::vector<std::string>& historyUCI) {
    nodesEvaluated = 0;

    // 1. Check Opening Book first
    if (!historyUCI.empty() || board.getHalfMoveClock() < 16) {
        Move bookMove;
        if (OpeningBook::getBookMove(board, historyUCI, bookMove)) {
            return bookMove;
        }
    }

    auto moves = board.generateLegalMoves();
    if (moves.empty()) {
        return Move();
    }
    if (moves.size() == 1) {
        return moves[0];
    }

    tt.incrementAge();

    uint64_t hash = Zobrist::computeHash(board);
    Move ttMove;
    tt.getBestMove(hash, ttMove);

    orderMoves(board, moves, ttMove, 0);

    int colorMultiplier = (board.getSideToMove() == Color::White) ? 1 : -1;
    int bestScore = -1000000;
    Move bestMove = moves[0];

    int alpha = -1000000;
    int beta  =  1000000;

    for (const auto& m : moves) {
        Board copy = board;
        copy.makeMove(m);

        int score = -negamax(copy, depth - 1, -beta, -alpha, -colorMultiplier, 1);

        if (score > bestScore) {
            bestScore = score;
            bestMove = m;
        }
        if (score > alpha) {
            alpha = score;
        }
    }

    tt.store(hash, depth, bestScore, TTFlag::Exact, bestMove);
    return bestMove;
}
