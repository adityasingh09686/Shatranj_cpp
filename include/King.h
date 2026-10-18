#pragma once
#include "Piece.h"

class King : public Piece {
public:
    King(Color color);

    std::vector<Move> getPseudoLegalMoves(const Board& board, Position from) const override;
};