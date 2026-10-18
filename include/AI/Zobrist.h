#pragma once
#include <cstdint>
#include "Board.h"

class Zobrist {
private:
    static uint64_t pieceSquare[64][12];
    static uint64_t sideToMoveKey;
    static uint64_t castlingKeys[16];
    static uint64_t epKeys[9]; // 0-7 for files a-h, 8 for none
    static bool initialized;

    static int pieceToIndex(PieceType type, Color color);

public:
    static void init();
    static uint64_t computeHash(const Board& board);
};
