#include "Rook.h"
#include "Board.h"

// Constructor for the Rook class
Rook::Rook(Color color) : Piece(color, PieceType::Rook) {}

// Find all pseudo-legal moves for a rook from a given position
std::vector<Move> Rook::getPseudoLegalMoves(const Board& board, Position from) const {
    std::vector<Move> moves;

    // Direction offsets for the rook: up, down, right, left
    const int offsets[4][2] = {
        {1, 0}, {-1, 0}, {0, 1}, {0, -1}
    };

    // Iterate through all 4 directions
    for (int i = 0; i < 4; i++) {
        int newFile = from.file + offsets[i][0];
        int newRank = from.rank + offsets[i][1];
        Position to(newFile, newRank);

        while (to.isValid()) {
            const Piece* targetPiece = board.getPieceAt(to);

            // Valid move if square is empty 
            if (targetPiece == nullptr) {
                moves.push_back({from, to});
            }
            // If square is occupied by friendly piece, stop scanning in this direction
            else if (targetPiece->getColor() == this->color) {
                break;
            }
            // If square is occupied by opponent piece, capture is valid, then stop scanning
            else {
                moves.push_back({from, to});
                break;
            }

            // Move to next square along the current ray
            to = Position(to.file + offsets[i][0], to.rank + offsets[i][1]);
        }
    }

    return moves;
}
