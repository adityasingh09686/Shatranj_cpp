#pragma once
#include "Board.h"

class ConsoleRenderer {
public:
    static void render(const Board& board);
    static char getPieceChar(const Piece* piece);
};