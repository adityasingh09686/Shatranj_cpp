#include "UI/ConsoleRenderer.h"
#include <iostream>
#include <cctype>

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
    std::cout << "\n    a   b   c   d   e   f   g   h\n";
    std::cout << "  +---+---+---+---+---+---+---+---+\n";

    for (int r = 7; r >= 0; --r) {
        std::cout << (r + 1) << " |";
        for (int f = 0; f < 8; ++f) {
            const Piece* piece = board.getPieceAt(Position(f, r));
            std::cout << ' ' << getPieceChar(piece) << " |";
        }
        std::cout << "  " << (r + 1) << "\n";
        std::cout << "  +---+---+---+---+---+---+---+---+\n";
    }
    std::cout << "    a   b   c   d   e   f   g   h\n\n";

    // Status summary
    std::cout << "Turn: " << (board.getSideToMove() == Color::White ? "White" : "Black");
    if (board.isInCheck(board.getSideToMove())) {
        std::cout << " [IN CHECK!]";
    }
    std::cout << " | Full Move: " << board.getFullMoveNumber() 
              << " | 50-move clock: " << board.getHalfMoveClock() << "\n";
}