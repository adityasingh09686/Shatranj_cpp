#pragma once
#include <string>
#include <vector>
#include "Board.h"

class OpeningBook {
public:
    // Look up an opening book move matching the UCI move sequence played so far
    static bool getBookMove(const Board& board, const std::vector<std::string>& historyUCI, Move& outMove);
};
