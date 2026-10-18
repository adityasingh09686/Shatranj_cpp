#pragma once
#include "Board.h"

class Evaluator {
public:
    // Piece base values in centipawns
    static const int PAWN_VALUE   = 100;
    static const int KNIGHT_VALUE = 320;
    static const int BISHOP_VALUE = 330;
    static const int ROOK_VALUE   = 500;
    static const int QUEEN_VALUE  = 900;
    static const int KING_VALUE   = 20000;

    // Static evaluation of the board from White's perspective (+: White advantage, -: Black advantage)
    static int evaluate(const Board& board);

    // Get value of a specific piece type
    static int getPieceValue(PieceType type);

    // Get positional piece-square table bonus
    static int getPieceSquareValue(PieceType type, Color color, Position pos);
};
