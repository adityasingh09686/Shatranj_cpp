#pragma once
#include "Piece.h"

class Queen : public Piece {
public:
    Queen(Color color);

    std::vector<Move> getPseudoLegalMoves(const Board& board, Position from) const override;
};