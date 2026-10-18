#include "UI/ConsoleRenderer.h"
#include <iostream>
#include <cctype>

#ifdef _WIN32
#include <windows.h>
#endif

// Set UTF-8 code page on Windows console once
static void enableUTF8Console() {
#ifdef _WIN32
    static bool initialized = false;
    if (!initialized) {
        SetConsoleOutputCP(CP_UTF8);
        SetConsoleCP(CP_UTF8);
        initialized = true;
    }
#endif
}

std::string ConsoleRenderer::getPieceSymbol(const Piece* piece) {
    if (!piece) return "·";

    if (piece->getColor() == Color::White) {
        switch (piece->getType()) {
            case PieceType::King:   return "♔";
            case PieceType::Queen:  return "♕";
            case PieceType::Rook:   return "♖";
            case PieceType::Bishop: return "♗";
            case PieceType::Knight: return "♘";
            case PieceType::Pawn:   return "♙";
            default: return "·";
        }
    } else {
        switch (piece->getType()) {
            case PieceType::King:   return "♚";
            case PieceType::Queen:  return "♛";
            case PieceType::Rook:   return "♜";
            case PieceType::Bishop: return "♝";
            case PieceType::Knight: return "♞";
            case PieceType::Pawn:   return "♟";
            default: return "·";
        }
    }
}

char ConsoleRenderer::getPieceChar(const Piece* piece) {
    if (!piece) return '.';
    char c = '.';
    switch (piece->getType()) {
        case PieceType::Pawn:   c = 'P'; break;
        case PieceType::Knight: c = 'N'; break;
        case PieceType::Bishop: c = 'B'; break;
        case PieceType::Rook:   c = 'R'; break;
        case PieceType::Queen:  c = 'Q'; break;
        case PieceType::King:   c = 'K'; break;
        default: c = '.'; break;
    }
    if (piece->getColor() == Color::Black) {
        c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
    }
    return c;
}

void ConsoleRenderer::render(const Board& board) {
    enableUTF8Console();

    std::cout << "\n    a   b   c   d   e   f   g   h\n";
    std::cout << "  ┌───┬───┬───┬───┬───┬───┬───┬───┐\n";

    for (int r = 7; r >= 0; --r) {
        std::cout << (r + 1) << " │";
        for (int f = 0; f < 8; ++f) {
            const Piece* piece = board.getPieceAt(Position(f, r));
            std::cout << ' ' << getPieceSymbol(piece) << " │";
        }
        std::cout << "  " << (r + 1) << "\n";

        if (r > 0) {
            std::cout << "  ├───┼───┼───┼───┼───┼───┼───┼───┤\n";
        } else {
            std::cout << "  └───┴───┴───┴───┴───┴───┴───┴───┘\n";
        }
    }
    std::cout << "    a   b   c   d   e   f   g   h\n\n";

    // Status summary
    std::string turnStr = (board.getSideToMove() == Color::White) ? "White ♔" : "Black ♚";
    std::cout << "Turn: " << turnStr;
    if (board.isInCheck(board.getSideToMove())) {
        std::cout << "  ⚠️ [IN CHECK!]";
    }
    std::cout << " | Full Move: " << board.getFullMoveNumber() 
              << " | 50-move clock: " << board.getHalfMoveClock() << "\n";
}