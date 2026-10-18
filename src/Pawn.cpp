#include "Pawn.h"
#include "Board.h"

// Constructor for the Pawn class
Pawn::Pawn(Color color) : Piece(color, PieceType::Pawn) {}

//  all the possible legal moves we get
std::vector<Move> Pawn::getPseudoLegalMoves(const Board& board, Position from) const {
    std::vector<Move> moves;

    int forward = (this->color == Color::White) ? 1 : -1;
    int startRank = (this->color == Color::White) ? 1 : 6;
    int promotionRank = (this->color == Color::White) ? 7 : 0;

    // Helper lambda to push moves with promotion handling
    auto addMoveWithPromotion = [&](Position to, MoveFlag flag) {
        if (to.rank == promotionRank) {
            moves.push_back({from, to, MoveFlag::Promotion, PieceType::Queen});
            moves.push_back({from, to, MoveFlag::Promotion, PieceType::Rook});
            moves.push_back({from, to, MoveFlag::Promotion, PieceType::Bishop});
            moves.push_back({from, to, MoveFlag::Promotion, PieceType::Knight});
        } else {
            moves.push_back({from, to, flag, PieceType::None});
        }
    };

    // 1. Single-square advance forward
    Position oneStep(from.file, from.rank + forward);
    if (oneStep.isValid() && board.getPieceAt(oneStep) == nullptr) {
        addMoveWithPromotion(oneStep, MoveFlag::Normal);

        // 2. Double-square advance from starting rank
        Position twoSteps(from.file, from.rank + 2 * forward);
        if (from.rank == startRank && board.getPieceAt(twoSteps) == nullptr) {
            moves.push_back({from, twoSteps, MoveFlag::DoublePawnPush, PieceType::None});
        }
    }

    // 3. Diagonal captures & En Passant
    const int captureOffsets[2] = {-1, 1};
    for (int offset : captureOffsets) {
        Position targetPos(from.file + offset, from.rank + forward);
        if (!targetPos.isValid()) continue;

        const Piece* targetPiece = board.getPieceAt(targetPos);

        // Standard diagonal capture
        if (targetPiece != nullptr && targetPiece->getColor() != this->color) {
            addMoveWithPromotion(targetPos, MoveFlag::Normal);
        }
        // En Passant capture
        else if (targetPiece == nullptr && board.getEnPassantTarget().isValid() && targetPos == board.getEnPassantTarget()) {
            moves.push_back({from, targetPos, MoveFlag::EnPassant, PieceType::None});
        }
    }

    return moves;
}
