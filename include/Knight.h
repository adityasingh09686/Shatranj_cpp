#pragma once
#include "Piece.h"

class Knight : public Piece {
public:
    Knight(Color color);

    std::vector<Move> getPseudoLegalMoves(const Board& board, Position from) const override;
};