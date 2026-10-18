#include "AI/OpeningBook.h"
#include <random>
#include <unordered_map>

struct BookLine {
    std::vector<std::string> moves;
};

static const std::vector<BookLine> openingLines = {
    // 1. Ruy Lopez (Spanish) Main Line & Morphy Defense
    {{"e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5a4", "g8f6", "e1g1", "f8e7"}},
    {{"e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "a7a6", "b5c6", "d7c6", "e1g1", "f7f6"}},
    {{"e2e4", "e7e5", "g1f3", "b8c6", "f1b5", "g8f6", "e1g1", "f6e4", "d2d4", "e4d6"}},

    // 2. Italian Game (Giuoco Piano & Two Knights)
    {{"e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "f8c5", "c2c3", "g8f6", "d2d4", "e5d4"}},
    {{"e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "d2d3", "f8c5", "e1g1", "d7d6"}},

    // 3. Sicilian Defense (Najdorf, Dragon, Classical)
    {{"e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "a7a6"}},
    {{"e2e4", "c7c5", "g1f3", "d7d6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "g7g6"}},
    {{"e2e4", "c7c5", "g1f3", "b8c6", "d2d4", "c5d4", "f3d4", "g8f6", "b1c3", "e7e5"}},
    {{"e2e4", "c7c5", "g1f3", "e7e6", "d2d4", "c5d4", "f3d4", "a7a6", "b1c3", "d8c7"}},

    // 4. French Defense (Winawer & Classical)
    {{"e2e4", "e7e6", "d2d4", "d7d5", "b1c3", "f8b4", "e4e5", "c7c5", "a2a3", "b4c3"}},
    {{"e2e4", "e7e6", "d2d4", "d7d5", "b1c3", "g8f6", "c1g5", "f8e7", "e4e5", "f6d7"}},

    // 5. Caro-Kann Defense (Classical & Advance)
    {{"e2e4", "c7c6", "d2d4", "d7d5", "b1c3", "d5e4", "c3e4", "c8f5", "e4g3", "f5g6"}},
    {{"e2e4", "c7c6", "d2d4", "d7d5", "e4e5", "c8f5", "g1f3", "e7e6", "f1e2", "c6c5"}},

    // 6. Queen's Gambit Declined (Orthodox & Tartakower)
    {{"d2d4", "d7d5", "c2c4", "e7e6", "b1c3", "g8f6", "c1g5", "f8e7", "e2e3", "e1g1"}},
    {{"d2d4", "d7d5", "c2c4", "e7e6", "g1f3", "g8f6", "b1c3", "c7c6", "e2e3", "b8d7"}},

    // 7. Queen's Gambit Accepted & Slav
    {{"d2d4", "d7d5", "c2c4", "d5c4", "g1f3", "g8f6", "e2e3", "e7e6", "f1c4", "c7c5"}},
    {{"d2d4", "d7d5", "c2c4", "c7c6", "g1f3", "g8f6", "b1c3", "d5c4", "a2a4", "c8f5"}},

    // 8. King's Indian & Grunfeld
    {{"d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "f8g7", "e2e4", "d7d6", "g1f3", "e1g1"}},
    {{"d2d4", "g8f6", "c2c4", "g7g6", "b1c3", "d7d5", "c4d5", "f6d5", "e2e4", "d5c3"}},

    // 9. Nimzo-Indian & Queen's Indian
    {{"d2d4", "g8f6", "c2c4", "e7e6", "b1c3", "f8b4", "e2e3", "e1g1", "f1d3", "d7d5"}},
    {{"d2d4", "g8f6", "c2c4", "e7e6", "g1f3", "b7b6", "g2g3", "c8b7", "f1g2", "f8e7"}},

    // 10. English Opening
    {{"c2c4", "e7e5", "b1c3", "g8f6", "g1f3", "b8c6", "g2g3", "d7d5", "c4d5", "f6d5"}},
    {{"c2c4", "c7c5", "g1f3", "g8f6", "b1c3", "b8c6", "d2d4", "c5d4", "f3d4", "e7e6"}}
};

bool OpeningBook::getBookMove(const Board& board, const std::vector<std::string>& historyUCI, Move& outMove) {
    size_t ply = historyUCI.size();

    std::vector<std::string> candidates;

    for (const auto& line : openingLines) {
        if (line.moves.size() <= ply) continue;

        // Check if all past moves match this line prefix
        bool matches = true;
        for (size_t i = 0; i < ply; ++i) {
            if (line.moves[i] != historyUCI[i]) {
                matches = false;
                break;
            }
        }

        if (matches) {
            candidates.push_back(line.moves[ply]);
        }
    }

    if (candidates.empty()) {
        return false;
    }

    // Pick a candidate move randomly
    static std::mt19937 rng(42);
    std::uniform_int_distribution<size_t> dist(0, candidates.size() - 1);
    std::string chosenUCI = candidates[dist(rng)];

    // Convert UCI string to legal Move
    auto legalMoves = board.generateLegalMoves();
    for (const auto& m : legalMoves) {
        std::string uci = m.from.toAlgebraic() + m.to.toAlgebraic();
        if (m.flag == MoveFlag::Promotion) {
            switch (m.promotionType) {
                case PieceType::Queen:  uci += "q"; break;
                case PieceType::Rook:   uci += "r"; break;
                case PieceType::Bishop: uci += "b"; break;
                case PieceType::Knight: uci += "n"; break;
                default: break;
            }
        }

        if (uci == chosenUCI) {
            outMove = m;
            return true;
        }
    }

    return false;
}
