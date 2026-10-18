#include "King.h"
#include "Board.h"

// Constructor for the King class
King::King(Color color) : Piece(color, PieceType::King) {}

// Find all pseudo-legal moves for a king from a given position
std::vector<Move> King::getPseudoLegalMoves(const Board& board, Position from) const {
    std::vector<Move> moves;

    // Direction offsets for the king (8 adjacent squares)
    const int offsets[8][2] = {
        {1, 1}, {-1, -1}, {1, -1}, {-1, 1},
        {1, 0}, {-1, 0}, {0, 1}, {0, -1}
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
            moves.push_back({from, to, MoveFlag::Normal, PieceType::None});
        }
    }

    // Castling moves
    int rank = (this->color == Color::White) ? 0 : 7;
    Color opponent = (this->color == Color::White) ? Color::Black : Color::White;

    // King must be on its starting square (e1/e8) and not currently in check
    if (from == Position(4, rank) && !board.isSquareAttackedBy(from, opponent)) {
        // Kingside castling (O-O)
        if (board.canCastleKingside(this->color)) {
            const Piece* rook = board.getPieceAt(Position(7, rank));
            if (rook != nullptr && rook->getColor() == this->color && rook->getType() == PieceType::Rook) {
                // Squares between king and rook (f1, g1 / f8, g8) must be empty
                if (board.getPieceAt(Position(5, rank)) == nullptr &&
                    board.getPieceAt(Position(6, rank)) == nullptr) {
                    // Transit and destination squares must not be attacked
                    if (!board.isSquareAttackedBy(Position(5, rank), opponent) &&
                        !board.isSquareAttackedBy(Position(6, rank), opponent)) {
                        moves.push_back({from, Position(6, rank), MoveFlag::CastleKingside, PieceType::None});
                    }
                }
            }
        }

        // Queenside castling (O-O-O)
        if (board.canCastleQueenside(this->color)) {
            const Piece* rook = board.getPieceAt(Position(0, rank));
            if (rook != nullptr && rook->getColor() == this->color && rook->getType() == PieceType::Rook) {
                // Squares between king and rook (b1, c1, d1 / b8, c8, d8) must be empty
                if (board.getPieceAt(Position(1, rank)) == nullptr &&
                    board.getPieceAt(Position(2, rank)) == nullptr &&
                    board.getPieceAt(Position(3, rank)) == nullptr) {
                    // Transit and destination squares must not be attacked
                    if (!board.isSquareAttackedBy(Position(3, rank), opponent) &&
                        !board.isSquareAttackedBy(Position(2, rank), opponent)) {
                        moves.push_back({from, Position(2, rank), MoveFlag::CastleQueenside, PieceType::None});
                    }
                }
            }
        }
    }

    return moves;
}
