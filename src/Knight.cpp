#include "Knight.h"
#include "Board.h"

// Constructor for the Knight class
Knight::Knight(Color color) : Piece(color, PieceType::Knight) {}

// Find all pseudo-legal moves for a knight from a given position
std::vector<Move> Knight::getPseudoLegalMoves(const Board& board, Position from) const {
    std::vector<Move> moves;

    // The 8 possible L-shaped move offsets for a knight: (file offset, rank offset)
    const int offsets[8][2] = {
        {1, 2}, {2, 1}, {2, -1}, {1, -2},
        {-1, -2}, {-2, -1}, {-2, 1}, {-1, 2}
    };

    for (int i = 0; i < 8; i++) {
        int newFile = from.file + offsets[i][0];
        int newRank = from.rank + offsets[i][1];
        Position to(newFile, newRank);

        // Skip if destination square is off the board
        if (!to.isValid()) {
            continue;
        }

        const Piece* targetPiece = board.getPieceAt(to);

        // Valid move if square is empty or occupied by an opponent's piece
        if (targetPiece == nullptr || targetPiece->getColor() != this->color) {
            moves.push_back({from, to});
        }
    }

    return moves;
}
