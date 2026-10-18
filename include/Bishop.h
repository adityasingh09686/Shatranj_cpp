#pragma once
#include "Piece.h"

class Bishop : public Piece {
public:
    Bishop(Color color);

    std::vector<Move> getPseudoLegalMoves(const Board& board, Position from) const override;
};