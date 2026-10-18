#pragma once
#include "Piece.h"

class Rook : public Piece {
public:
    Rook(Color color);

    std::vector<Move> getPseudoLegalMoves(const Board& board, Position from) const override;
};