#include <iostream>
#include <cassert>
#include "Board.h"
#include "Game.h"

void testFoolsMate() {
    Game game;
    // 1. f3 e5 2. g4 Qh4#
    assert(game.processMove("f2f3"));
    assert(game.processMove("e7e5"));
    assert(game.processMove("g2g4"));
    assert(game.processMove("d8h4"));
    assert(game.getState() == GameState::Checkmate);
    assert(game.getBoard().isInCheck(Color::White));
    assert(game.getBoard().generateLegalMoves().empty());
    std::cout << "[PASS] Fool's Mate checkmate detected correctly\n";
}

void testPinnedPieceCannotMove() {
    Board b;
    // Black King on e8, White Rook on e1, Black Bishop on e7 (pinned to king)
    // fen: 4k3/4b3/8/8/8/8/8/4R1K1 b - - 0 1
    bool ok = b.loadFEN("4k3/4b3/8/8/8/8/8/4R1K1 b - - 0 1");
    assert(ok);
    auto moves = b.generateLegalMoves();
    // The bishop on e7 cannot move anywhere except staying on e file or blocking
    // But e-file has King on e8 and Rook on e1. Bishop moves diagonally so it cannot move at all!
    for (const auto& m : moves) {
        if (m.from == Position(4, 6)) { // e7
            assert(false && "Pinned bishop should have no legal moves");
        }
    }
    std::cout << "[PASS] Absolute pin prevents pinned piece from moving\n";
}

void testStalemate() {
    Board b;
    // Classic stalemate position: Black King at a8, White King at c7, White Queen at b6 (Black to move)
    // fen: k7/2K5/1Q6/8/8/8/8/8 b - - 0 1
    bool ok = b.loadFEN("k7/2K5/1Q6/8/8/8/8/8 b - - 0 1");
    assert(ok);
    assert(!b.isInCheck(Color::Black));
    assert(b.generateLegalMoves().empty());
    assert(b.isStalemate(Color::Black));
    std::cout << "[PASS] Stalemate detected correctly\n";
}

int main() {
    std::cout << "--- Running Check and Mate Tests ---\n";
    testFoolsMate();
    testPinnedPieceCannotMove();
    testStalemate();
    std::cout << "All check/mate tests passed successfully!\n";
    return 0;
}
