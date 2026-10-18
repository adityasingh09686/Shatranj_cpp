#pragma once
#include "Board.h"
#include <string>

class ConsoleRenderer {
public:
    static void render(const Board& board);
    static std::string getPieceSymbol(const Piece* piece);
    static char getPieceChar(const Piece* piece);
};