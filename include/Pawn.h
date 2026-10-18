#pragma once
#include "Piece.h"

class Pawn : public Piece {
public:
    Pawn(Color color);

    std::vector<Move> getPseudoLegalMoves(const Board& board, Position from) const override;
};