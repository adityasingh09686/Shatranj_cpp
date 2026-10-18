#include <iostream>
#include <cassert>
#include <algorithm>
#include "Board.h"

void testStartingPositionMoves() {
    Board board;
    board.initStandardPosition();
    auto legalMoves = board.generateLegalMoves();
    assert(legalMoves.size() == 20); // 16 pawn moves + 4 knight moves
    std::cout << "[PASS] Starting position legal move count is 20\n";
}

void testFenRoundtrip() {
    Board board;
    board.initStandardPosition();
    std::string startFen = board.toFEN();
    assert(startFen == "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

    Board loaded;
    bool ok = loaded.loadFEN(startFen);
    assert(ok);
    assert(loaded.toFEN() == startFen);
    assert(loaded.generateLegalMoves().size() == 20);
    std::cout << "[PASS] FEN export and load roundtrip\n";
}

void testKnightMoves() {
    Board b;
    b.initStandardPosition();
    // Knight at b1 can move to a3 and c3
    auto moves = b.generateLegalMoves();
    bool canMoveA3 = false;
    bool canMoveC3 = false;
    for (const auto& m : moves) {
        if (m.from == Position(1, 0) && m.to == Position(0, 2)) canMoveA3 = true;
        if (m.from == Position(1, 0) && m.to == Position(2, 2)) canMoveC3 = true;
    }
    assert(canMoveA3 && canMoveC3);
    std::cout << "[PASS] Knight movement verified\n";
}

int main() {
    std::cout << "--- Running Move Generation Tests ---\n";
    testStartingPositionMoves();
    testFenRoundtrip();
    testKnightMoves();
    std::cout << "All move tests passed successfully!\n";
    return 0;
}
