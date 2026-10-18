#pragma once
#include <cstdint>
#include <vector>
#include "Board.h"

enum class TTFlag : uint8_t {
    Exact = 0,
    LowerBound = 1,
    UpperBound = 2
};

struct TTEntry {
    uint64_t key = 0;
    Move bestMove;
    int16_t score = 0;
    int8_t depth = -1;
    TTFlag flag = TTFlag::Exact;
    uint8_t age = 0;
};

class TranspositionTable {
private:
    std::vector<TTEntry> table;
    size_t numEntries;
    uint8_t currentAge = 0;

public:
    explicit TranspositionTable(size_t sizeInMB = 32);

    void resize(size_t sizeInMB);
    void clear();
    void incrementAge() { ++currentAge; }

    bool probe(uint64_t key, int depth, int alpha, int beta, int& outScore, Move& outBestMove);
    void store(uint64_t key, int depth, int score, TTFlag flag, const Move& bestMove);

    bool getBestMove(uint64_t key, Move& outMove);
};
