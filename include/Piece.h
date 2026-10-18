#pragma once
#include <vector>
#include "Types.h"

class Board; // forward declaration, see above

class Piece {
protected:
    Color color;
    PieceType type;

public:
    Piece(Color c, PieceType t) : color(c), type(t) {}

    // The below code is going to be used for overriding in diff classes for the derived versions
    // of piece 
    virtual ~Piece() {
        
    } 

    Color getColor() const { return color; }
    PieceType getType() const { return type; }

    // pure virtual — every subclass MUST implement this
    virtual std::vector<Move> getPseudoLegalMoves(const Board& board, Position from) const = 0;
};