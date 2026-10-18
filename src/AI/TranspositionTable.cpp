#include "AI/TranspositionTable.h"
#include <algorithm>

TranspositionTable::TranspositionTable(size_t sizeInMB) {
    resize(sizeInMB);
}

void TranspositionTable::resize(size_t sizeInMB) {
    size_t bytes = sizeInMB * 1024 * 1024;
    numEntries = bytes / sizeof(TTEntry);
    if (numEntries == 0) numEntries = 1024;
    table.assign(numEntries, TTEntry());
}

void TranspositionTable::clear() {
    for (auto& entry : table) {
        entry = TTEntry();
    }
}

bool TranspositionTable::probe(uint64_t key, int depth, int alpha, int beta, int& outScore, Move& outBestMove) {
    size_t index = key % numEntries;
    const TTEntry& entry = table[index];

    if (entry.key == key) {
        outBestMove = entry.bestMove;

        // Only use the score if depth is at least as deep as current search
        if (entry.depth >= depth) {
            if (entry.flag == TTFlag::Exact) {
                outScore = entry.score;
                return true;
            }
            if (entry.flag == TTFlag::LowerBound && entry.score >= beta) {
                outScore = entry.score;
                return true;
            }
            if (entry.flag == TTFlag::UpperBound && entry.score <= alpha) {
                outScore = entry.score;
                return true;
            }
        }
    }

    return false;
}

bool TranspositionTable::getBestMove(uint64_t key, Move& outMove) {
    size_t index = key % numEntries;
    const TTEntry& entry = table[index];
    if (entry.key == key && (entry.bestMove.from != entry.bestMove.to)) {
        outMove = entry.bestMove;
        return true;
    }
    return false;
}

void TranspositionTable::store(uint64_t key, int depth, int score, TTFlag flag, const Move& bestMove) {
    size_t index = key % numEntries;
    TTEntry& entry = table[index];

    // Replacement strategy: Always replace if deeper or from a previous age
    bool replace = (entry.key == 0) ||
                   (entry.depth <= depth) ||
                   (entry.age != currentAge);

    if (replace) {
        entry.key = key;
        entry.depth = static_cast<int8_t>(depth);
        entry.score = static_cast<int16_t>(score);
        entry.flag = flag;
        entry.age = currentAge;
        if (bestMove.from != bestMove.to) {
            entry.bestMove = bestMove;
        }
    }
}
