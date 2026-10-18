#include "AI/Evaluator.h"

// Piece-Square Tables (indexed by [rank][file], where rank 0 is White back-rank)
static const int pawnPST[8][8] = {
    {  0,   0,   0,   0,   0,   0,   0,   0},
    {  5,  10,  10, -20, -20,  10,  10,   5},
    {  5,  -5, -10,   0,   0, -10,  -5,   5},
    {  0,   0,   0,  25,  25,   0,   0,   0},
    {  5,   5,  10,  27,  27,  10,   5,   5},
    { 10,  10,  20,  30,  30,  20,  10,  10},
    { 50,  50,  50,  50,  50,  50,  50,  50},
    {  0,   0,   0,   0,   0,   0,   0,   0}
};

static const int knightPST[8][8] = {
    {-50, -40, -30, -30, -30, -30, -40, -50},
    {-40, -20,   0,   5,   5,   0, -20, -40},
    {-30,   5,  10,  15,  15,  10,   5, -30},
    {-30,   0,  15,  20,  20,  15,   0, -30},
    {-30,   5,  15,  20,  20,  15,   5, -30},
    {-30,   0,  10,  15,  15,  10,   0, -30},
    {-40, -20,   0,   0,   0,   0, -20, -40},
    {-50, -40, -30, -30, -30, -30, -40, -50}
};

static const int bishopPST[8][8] = {
    {-20, -10, -10, -10, -10, -10, -10, -20},
    {-10,   5,   0,   0,   0,   0,   5, -10},
    {-10,  10,  10,  10,  10,  10,  10, -10},
    {-10,   0,  10,  10,  10,  10,   0, -10},
    {-10,   5,   5,  10,  10,   5,   5, -10},
    {-10,   0,   5,  10,  10,   5,   0, -10},
    {-10,   0,   0,   0,   0,   0,   0, -10},
    {-20, -10, -10, -10, -10, -10, -10, -20}
};

static const int rookPST[8][8] = {
    {  0,   0,   0,   5,   5,   0,   0,   0},
    { -5,   0,   0,   0,   0,   0,   0,  -5},
    { -5,   0,   0,   0,   0,   0,   0,  -5},
    { -5,   0,   0,   0,   0,   0,   0,  -5},
    { -5,   0,   0,   0,   0,   0,   0,  -5},
    { -5,   0,   0,   0,   0,   0,   0,  -5},
    {  5,  10,  10,  10,  10,  10,  10,   5},
    {  0,   0,   0,   0,   0,   0,   0,   0}
};

static const int queenPST[8][8] = {
    {-20, -10, -10,  -5,  -5, -10, -10, -20},
    {-10,   0,   5,   0,   0,   0,   0, -10},
    {-10,   5,   5,   5,   5,   5,   0, -10},
    {  0,   0,   5,   5,   5,   5,   0,  -5},
    { -5,   0,   5,   5,   5,   5,   0,  -5},
    {-10,   0,   5,   5,   5,   5,   0, -10},
    {-10,   0,   0,   0,   0,   0,   0, -10},
    {-20, -10, -10,  -5,  -5, -10, -10, -20}
};

static const int kingPST[8][8] = {
    { 20,  30,  10,   0,   0,  10,  30,  20},
    { 20,  20,   0,   0,   0,   0,  20,  20},
    {-10, -20, -20, -20, -20, -20, -20, -10},
    {-20, -30, -30, -40, -40, -30, -30, -20},
    {-30, -40, -40, -50, -50, -40, -40, -30},
    {-30, -40, -40, -50, -50, -40, -40, -30},
    {-30, -40, -40, -50, -50, -40, -40, -30},
    {-30, -40, -40, -50, -50, -40, -40, -30}
};

int Evaluator::getPieceValue(PieceType type) {
    switch (type) {
        case PieceType::Pawn:   return PAWN_VALUE;
        case PieceType::Knight: return KNIGHT_VALUE;
        case PieceType::Bishop: return BISHOP_VALUE;
        case PieceType::Rook:   return ROOK_VALUE;
        case PieceType::Queen:  return QUEEN_VALUE;
        case PieceType::King:   return KING_VALUE;
        default: return 0;
    }
}

int Evaluator::getPieceSquareValue(PieceType type, Color color, Position pos) {
    if (!pos.isValid()) return 0;
    int r = (color == Color::White) ? pos.rank : (7 - pos.rank);
    int f = pos.file;

    switch (type) {
        case PieceType::Pawn:   return pawnPST[r][f];
        case PieceType::Knight: return knightPST[r][f];
        case PieceType::Bishop: return bishopPST[r][f];
        case PieceType::Rook:   return rookPST[r][f];
        case PieceType::Queen:  return queenPST[r][f];
        case PieceType::King:   return kingPST[r][f];
        default: return 0;
    }
}

int Evaluator::evaluate(const Board& board) {
    // Check terminal conditions first
    if (board.isCheckmate(Color::White)) return -100000;
    if (board.isCheckmate(Color::Black)) return  100000;
    if (board.isStalemate(Color::White) || board.isStalemate(Color::Black)) return 0;

    int whiteScore = 0;
    int blackScore = 0;

    for (int f = 0; f < 8; ++f) {
        for (int r = 0; r < 8; ++r) {
            Position pos(f, r);
            const Piece* p = board.getPieceAt(pos);
            if (!p) continue;

            int pieceVal = getPieceValue(p->getType());
            int pstVal   = getPieceSquareValue(p->getType(), p->getColor(), pos);
            int totalVal = pieceVal + pstVal;

            if (p->getColor() == Color::White) {
                whiteScore += totalVal;
            } else {
                blackScore += totalVal;
            }
        }
    }

    // Return score from White's perspective
    return whiteScore - blackScore;
}
