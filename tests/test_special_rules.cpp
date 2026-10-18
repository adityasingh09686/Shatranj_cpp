#include <iostream>
#include <cassert>
#include "Board.h"
#include "Game.h"

void testCastlingKingside() {
    Game g;
    // Clear e2, f1, g1 to enable kingside castling:
    // 1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O
    assert(g.processMove("e2e4"));
    assert(g.processMove("e7e5"));
    assert(g.processMove("g1f3"));
    assert(g.processMove("b8c6"));
    assert(g.processMove("f1c4"));
    assert(g.processMove("f8c5"));
    assert(g.processMove("e1g1")); // O-O
    assert(g.getMoveHistorySAN().back() == "O-O");
    // Verify King is on g1 (file 6, rank 0) and Rook is on f1 (file 5, rank 0)
    const Piece* king = g.getBoard().getPieceAt(Position(6, 0));
    const Piece* rook = g.getBoard().getPieceAt(Position(5, 0));
    assert(king && king->getType() == PieceType::King);
    assert(rook && rook->getType() == PieceType::Rook);
    std::cout << "[PASS] Kingside castling executed correctly\n";
}

void testEnPassant() {
    Game g;
    // 1. e4 a6 2. e5 d5 3. exd6 (en passant)
    assert(g.processMove("e2e4"));
    assert(g.processMove("a7a6"));
    assert(g.processMove("e4e5"));
    assert(g.processMove("d7d5"));
    // Black pawn double-pushed d7 to d5 -> enPassantTarget is d6 (file 3, rank 5)
    assert(g.getBoard().getEnPassantTarget() == Position(3, 5));
    assert(g.processMove("e5d6"));
    assert(g.getMoveHistorySAN().back() == "exd6");
    // Captured black pawn at d5 (file 3, rank 4) should be removed!
    assert(g.getBoard().getPieceAt(Position(3, 4)) == nullptr);
    // White pawn should be at d6 (file 3, rank 5)
    const Piece* p = g.getBoard().getPieceAt(Position(3, 5));
    assert(p && p->getType() == PieceType::Pawn && p->getColor() == Color::White);
    std::cout << "[PASS] En passant capture executed correctly\n";
}

void testPromotion() {
    Board b;
    // White pawn on a7 ready to promote to Queen:
    // fen: 8/P7/8/8/8/8/8/4K2k w - - 0 1
    bool ok = b.loadFEN("8/P7/8/8/8/8/8/4K2k w - - 0 1");
    assert(ok);
    Game g;
    g.processApiCommand("{\"cmd\":\"load_fen\",\"fen\":\"8/P7/8/8/8/8/8/4K2k w - - 0 1\"}");
    assert(g.processMove("a7a8q"));
    const Piece* promoted = g.getBoard().getPieceAt(Position(0, 7));
    assert(promoted && promoted->getType() == PieceType::Queen && promoted->getColor() == Color::White);
    assert(g.getMoveHistorySAN().back() == "a8=Q+");
    std::cout << "[PASS] Pawn promotion to Queen executed correctly\n";
}

int main() {
    std::cout << "--- Running Special Rules Tests ---\n";
    testCastlingKingside();
    testEnPassant();
    testPromotion();
    std::cout << "All special rules tests passed successfully!\n";
    return 0;
}
