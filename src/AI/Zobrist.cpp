#include "AI/Zobrist.h"

uint64_t Zobrist::pieceSquare[64][12];
uint64_t Zobrist::sideToMoveKey;
uint64_t Zobrist::castlingKeys[16];
uint64_t Zobrist::epKeys[9];
bool Zobrist::initialized = false;

// Deterministic SplitMix64 PRNG to guarantee reproducible hash seeds
static uint64_t splitMix64(uint64_t& state) {
    state += 0x9e3779b97f4a7c15ULL;
    uint64_t z = state;
    z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9ULL;
    z = (z ^ (z >> 27)) * 0x94d049bb133111ebULL;
    return z ^ (z >> 31);
}

int Zobrist::pieceToIndex(PieceType type, Color color) {
    int base = 0;
    switch (type) {
        case PieceType::Pawn:   base = 0; break;
        case PieceType::Knight: base = 1; break;
        case PieceType::Bishop: base = 2; break;
        case PieceType::Rook:   base = 3; break;
        case PieceType::Queen:  base = 4; break;
        case PieceType::King:   base = 5; break;
    }
    return (color == Color::White) ? base : (base + 6);
}

void Zobrist::init() {
    if (initialized) return;

    uint64_t rngState = 0x853c49e6748fea9bULL;

    for (int sq = 0; sq < 64; ++sq) {
        for (int p = 0; p < 12; ++p) {
            pieceSquare[sq][p] = splitMix64(rngState);
        }
    }

    sideToMoveKey = splitMix64(rngState);

    for (int i = 0; i < 16; ++i) {
        castlingKeys[i] = splitMix64(rngState);
    }

    for (int i = 0; i < 9; ++i) {
        epKeys[i] = splitMix64(rngState);
    }

    initialized = true;
}

uint64_t Zobrist::computeHash(const Board& board) {
    if (!initialized) init();

    uint64_t hash = 0;

    for (int file = 0; file < 8; ++file) {
        for (int rank = 0; rank < 8; ++rank) {
            Position pos(file, rank);
            const Piece* piece = board.getPieceAt(pos);
            if (piece) {
                int sq = rank * 8 + file;
                int pIdx = pieceToIndex(piece->getType(), piece->getColor());
                hash ^= pieceSquare[sq][pIdx];
            }
        }
    }

    if (board.getSideToMove() == Color::Black) {
        hash ^= sideToMoveKey;
    }

    int castlingIndex = (board.canCastleKingside(Color::White)  ? 1 : 0) |
                        (board.canCastleQueenside(Color::White) ? 2 : 0) |
                        (board.canCastleKingside(Color::Black)  ? 4 : 0) |
                        (board.canCastleQueenside(Color::Black) ? 8 : 0);
    hash ^= castlingKeys[castlingIndex];

    Position epPos = board.getEnPassantTarget();
    if (epPos.isValid()) {
        hash ^= epKeys[epPos.file];
    } else {
        hash ^= epKeys[8];
    }

    return hash;
}
