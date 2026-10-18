#pragma once
#include <memory>
#include <vector>
#include "Piece.h"

class Board {
private:
    // 8x8 grid of piece pointers; nullptr means the square is empty
    std::unique_ptr<Piece> squares[8][8];

    // Side whose turn it is to move
    Color sideToMove;

    // Castling rights flags
    bool castleWhiteKingside;
    bool castleWhiteQueenside;
    bool castleBlackKingside;
    bool castleBlackQueenside;

    // En-passant target square (-1,-1 means none)
    Position enPassantTarget;

    // Half-move clock for the 50-move rule
    int halfMoveClock;

    // Full move number (starts at 1, increments after Black moves)
    int fullMoveNumber;

public:

    // Initialise an empty board with default state
    Board();

    // Deep copy constructor and copy assignment operator
    Board(const Board& other);
    Board& operator=(const Board& other);

    // Place all pieces in their standard starting positions
    void initStandardPosition();

    // Return a raw (non-owning) pointer to the piece at pos, or nullptr
    const Piece* getPieceAt(Position pos) const;

    // Place a piece on the board, taking ownership (nullptr clears the square)
    void setPieceAt(Position pos, std::unique_ptr<Piece> piece);

    // Remove and return the piece at pos (caller takes ownership)
    std::unique_ptr<Piece> removePieceAt(Position pos);

    // Apply a move (assumed pseudo-legal; does NOT validate legality)
    void makeMove(const Move& move);

    // Return all pseudo-legal moves for the side currently to move
    std::vector<Move> generatePseudoLegalMoves() const;

    std::vector<Move> generateLegalMoves() const;

    // Is the given side's king currently in check?
    bool isInCheck(Color side) const;

    bool isCheckmate(Color side) const;

    bool isStalemate(Color side) const;

    Position findKing(Color side) const;


    Color getSideToMove()          const { return sideToMove; }
    Position getEnPassantTarget()  const { return enPassantTarget; }
    int  getHalfMoveClock()        const { return halfMoveClock; }
    int  getFullMoveNumber()       const { return fullMoveNumber; }

    bool canCastleKingside(Color c)  const;
    bool canCastleQueenside(Color c) const;

    // True if any piece of the given side attacks the square at pos
    bool isSquareAttackedBy(Position pos, Color attacker) const;

    // FEN export and import
    std::string toFEN() const;
    bool loadFEN(const std::string& fen);
};