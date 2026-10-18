#pragma once
#include <string>
#include <cstdlib>  // for abs()

// basically represent the number of colors available
enum class Color {
    White, Black, None
};

struct Position {
    int file;  // 0-7 represents a-h
    int rank;  // 0-7 represents 1-8

    // Invalid position by default
    Position() {
        file = -1;
        rank = -1;
    }

    // Create a position with given coordinates
    Position(int f, int r) {
        file = f;
        rank = r;
    }

    // Check if the position is inside the chessboard
    bool isValid() const {
        return file >= 0 && file <= 7 &&
               rank >= 0 && rank <= 7;
    }

    // Compare two positions
    bool operator==(const Position& other) const {
        return file == other.file && rank == other.rank;
    }


    bool operator!=(const Position& other) const {
    return !(*this == other);
    }

    // Convert position to algebraic notation, e.g., (4,3) -> "e4"
    std::string toAlgebraic() const {
        if (!isValid()) return "-";
        return std::string(1, static_cast<char>('a' + file)) +
               static_cast<char>('1' + rank);
    }

    // Optional: check if another position is diagonal from this one
    bool isDiagonal(const Position& other) const {
        return std::abs(file - other.file) ==
               std::abs(rank - other.rank);
    }
};

// The enums are used for the type of the piece which is defined 
enum class PieceType {
    Pawn, Knight, Bishop, Rook, Queen, King, None
};

// This is basically the list of the special moves 
enum class MoveFlag {
    Normal, DoublePawnPush, EnPassant, CastleKingside, CastleQueenside, Promotion
};

// The move from one place to other
struct Move {
    Position from;
    Position to;
    MoveFlag flag = MoveFlag::Normal;
    PieceType promotionType = PieceType::None;
};

