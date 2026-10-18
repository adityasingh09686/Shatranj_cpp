#include "Board.h"
#include "Pawn.h"
#include "Knight.h"
#include "Bishop.h"
#include "Rook.h"
#include "Queen.h"
#include "King.h"
#include <sstream>
#include <cctype>


static std::unique_ptr<Piece> clonePiece(const Piece* p) {
    if (!p) return nullptr;
    switch (p->getType()) {
        case PieceType::Pawn:   return std::make_unique<Pawn>(p->getColor());
        case PieceType::Knight: return std::make_unique<Knight>(p->getColor());
        case PieceType::Bishop: return std::make_unique<Bishop>(p->getColor());
        case PieceType::Rook:   return std::make_unique<Rook>(p->getColor());
        case PieceType::Queen:  return std::make_unique<Queen>(p->getColor());
        case PieceType::King:   return std::make_unique<King>(p->getColor());
        default: return nullptr;
    }
}

Board::Board()
    : sideToMove(Color::White), // whoes turn is this 
      castleWhiteKingside(true), // castle is allowed 
      castleWhiteQueenside(true), // castle is allowed 
      castleBlackKingside(true),  // castle is allowed 
      castleBlackQueenside(true),  // castle is allowed 
      enPassantTarget(Position()), // positon is valid for inpassent move or not
      halfMoveClock(0), //  the number of half moves since the last capture or pawn advance
      fullMoveNumber(1) // the number of full moves 
{
    // squares[][] is value-initialized to nullptr automatically
}

Board::Board(const Board& other)
    : sideToMove(other.sideToMove),
      castleWhiteKingside(other.castleWhiteKingside),
      castleWhiteQueenside(other.castleWhiteQueenside),
      castleBlackKingside(other.castleBlackKingside),
      castleBlackQueenside(other.castleBlackQueenside),
      enPassantTarget(other.enPassantTarget),
      halfMoveClock(other.halfMoveClock),
      fullMoveNumber(other.fullMoveNumber)
{
    for (int f = 0; f < 8; ++f) {
        for (int r = 0; r < 8; ++r) {
            squares[f][r] = clonePiece(other.squares[f][r].get());
        }
    }
}

Board& Board::operator=(const Board& other) {
    if (this == &other) return *this;

    sideToMove           = other.sideToMove;
    castleWhiteKingside  = other.castleWhiteKingside;
    castleWhiteQueenside = other.castleWhiteQueenside;
    castleBlackKingside  = other.castleBlackKingside;
    castleBlackQueenside = other.castleBlackQueenside;
    enPassantTarget      = other.enPassantTarget;
    halfMoveClock        = other.halfMoveClock;
    fullMoveNumber       = other.fullMoveNumber;

    for (int f = 0; f < 8; ++f) {
        for (int r = 0; r < 8; ++r) {
            squares[f][r] = clonePiece(other.squares[f][r].get());
        }
    }

    return *this;
}

void Board::initStandardPosition() {
    for (int f = 0; f < 8; ++f) {
        for (int r = 0; r < 8; ++r) {
            squares[f][r] = nullptr;
        }
    }

    // --- White pieces ---
    setPieceAt(Position(0,0), std::make_unique<Rook>(Color::White));
    setPieceAt(Position(1,0), std::make_unique<Knight>(Color::White));
    setPieceAt(Position(2,0), std::make_unique<Bishop>(Color::White));
    setPieceAt(Position(3,0), std::make_unique<Queen>(Color::White));
    setPieceAt(Position(4,0), std::make_unique<King>(Color::White));
    setPieceAt(Position(5,0), std::make_unique<Bishop>(Color::White));
    setPieceAt(Position(6,0), std::make_unique<Knight>(Color::White));
    setPieceAt(Position(7,0), std::make_unique<Rook>(Color::White));
    for (int f = 0; f < 8; ++f)
        setPieceAt(Position(f,1), std::make_unique<Pawn>(Color::White));

    // --- Black pieces ---
    setPieceAt(Position(0,7), std::make_unique<Rook>(Color::Black));
    setPieceAt(Position(1,7), std::make_unique<Knight>(Color::Black));
    setPieceAt(Position(2,7), std::make_unique<Bishop>(Color::Black));
    setPieceAt(Position(3,7), std::make_unique<Queen>(Color::Black));
    setPieceAt(Position(4,7), std::make_unique<King>(Color::Black));
    setPieceAt(Position(5,7), std::make_unique<Bishop>(Color::Black));
    setPieceAt(Position(6,7), std::make_unique<Knight>(Color::Black));
    setPieceAt(Position(7,7), std::make_unique<Rook>(Color::Black));
    for (int f = 0; f < 8; ++f)
        setPieceAt(Position(f,6), std::make_unique<Pawn>(Color::Black));

    // Reset game state
    sideToMove           = Color::White;
    castleWhiteKingside  = true;
    castleWhiteQueenside = true;
    castleBlackKingside  = true;
    castleBlackQueenside = true;
    enPassantTarget      = Position();
    halfMoveClock        = 0;
    fullMoveNumber       = 1;
}

// basically valid pointers ko return karta hain jo achi hain
const Piece* Board::getPieceAt(Position pos) const {
    if (!pos.isValid()) return nullptr;
    return squares[pos.file][pos.rank].get();
}

// if the shi is valid then move the shi to that position
void Board::setPieceAt(Position pos, std::unique_ptr<Piece> piece) {
    if (pos.isValid())
        squares[pos.file][pos.rank] = std::move(piece);
}
// THis is for removing the piece from that position 
std::unique_ptr<Piece> Board::removePieceAt(Position pos) {
    if (!pos.isValid()) return nullptr;
    return std::move(squares[pos.file][pos.rank]);
}

// this is for excuting the actual move that is being made by the player
void Board::makeMove(const Move& move) {
    const Piece* movingPiece = getPieceAt(move.from);
    if (!movingPiece) return;

    Color  mover     = movingPiece->getColor();
    PieceType ptype  = movingPiece->getType();
    bool isCapture   = (getPieceAt(move.to) != nullptr);

    // --- En passant capture ---
    if (move.flag == MoveFlag::EnPassant) {
        // Remove the captured pawn (same file as destination, same rank as origin)
        int capturedRank = (mover == Color::White) ? move.to.rank - 1 : move.to.rank + 1;
        removePieceAt(Position(move.to.file, capturedRank));
        isCapture = true;
    }

    // --- Move the piece ---
    auto piece = removePieceAt(move.from);
    setPieceAt(move.to, std::move(piece));

    // --- Promotion ---
    if (move.flag == MoveFlag::Promotion) {
        std::unique_ptr<Piece> promoted;
        switch (move.promotionType) {
            case PieceType::Queen:  promoted = std::make_unique<Queen>(mover);  break;
            case PieceType::Rook:   promoted = std::make_unique<Rook>(mover);   break;
            case PieceType::Bishop: promoted = std::make_unique<Bishop>(mover); break;
            case PieceType::Knight: promoted = std::make_unique<Knight>(mover); break;
            default:                promoted = std::make_unique<Queen>(mover);  break;
        }
        setPieceAt(move.to, std::move(promoted));
    }

    // --- Castling: move the rook ---
    if (move.flag == MoveFlag::CastleKingside) {
        int rank = (mover == Color::White) ? 0 : 7;
        auto rook = removePieceAt(Position(7, rank));
        setPieceAt(Position(5, rank), std::move(rook));
    }
    if (move.flag == MoveFlag::CastleQueenside) {
        int rank = (mover == Color::White) ? 0 : 7;
        auto rook = removePieceAt(Position(0, rank));
        setPieceAt(Position(3, rank), std::move(rook));
    }

    // --- Update en passant target ---
    if (move.flag == MoveFlag::DoublePawnPush) {
        int epRank = (mover == Color::White) ? move.from.rank + 1 : move.from.rank - 1;
        enPassantTarget = Position(move.from.file, epRank);
    } else {
        enPassantTarget = Position(); // clear
    }

    // --- Revoke castling rights ---
    if (ptype == PieceType::King) {
        if (mover == Color::White) { castleWhiteKingside = false; castleWhiteQueenside = false; }
        else                       { castleBlackKingside = false; castleBlackQueenside = false; }
    }
    if (ptype == PieceType::Rook) {
        if (move.from == Position(0,0)) castleWhiteQueenside = false;
        if (move.from == Position(7,0)) castleWhiteKingside  = false;
        if (move.from == Position(0,7)) castleBlackQueenside = false;
        if (move.from == Position(7,7)) castleBlackKingside  = false;
    }
    // Also revoke if a rook is captured on its starting square
    if (move.to == Position(0,0)) castleWhiteQueenside = false;
    if (move.to == Position(7,0)) castleWhiteKingside  = false;
    if (move.to == Position(0,7)) castleBlackQueenside = false;
    if (move.to == Position(7,7)) castleBlackKingside  = false;

    // --- Half-move clock (reset on pawn move or capture) ---
    if (ptype == PieceType::Pawn || isCapture)
        halfMoveClock = 0;
    else
        ++halfMoveClock;

    // --- Full move number ---
    if (mover == Color::Black)
        ++fullMoveNumber;

    // --- Flip side to move ---
    sideToMove = (mover == Color::White) ? Color::Black : Color::White;
}

std::vector<Move> Board::generatePseudoLegalMoves() const {
    std::vector<Move> moves;
    for (int f = 0; f < 8; ++f) {
        for (int r = 0; r < 8; ++r) {
            const Piece* p = getPieceAt(Position(f, r));
            if (!p || p->getColor() != sideToMove) continue;
            auto pieceMoves = p->getPseudoLegalMoves(*this, Position(f, r));
            moves.insert(moves.end(), pieceMoves.begin(), pieceMoves.end());
        }
    }
    return moves;
}

std::vector<Move> Board::generateLegalMoves() const {
    std::vector<Move> pseudoMoves = generatePseudoLegalMoves();
    std::vector<Move> legalMoves;

    for (const Move& m : pseudoMoves) {
        // Copy the board, apply the move, check if own king is in check
        Board copy = *this;  // NOTE: requires copy constructor (see below)
        copy.makeMove(m);
        // After the move, sideToMove flipped — check the side that just moved
        Color justMoved = (sideToMove == Color::White) ? Color::White : Color::Black;
        if (!copy.isInCheck(justMoved))
            legalMoves.push_back(m);
    }
    return legalMoves;
}

bool Board::isSquareAttackedBy(Position pos, Color attacker) const {
    int pawnForward = (attacker == Color::White) ? 1 : -1;

    for (int f = 0; f < 8; ++f) {
        for (int r = 0; r < 8; ++r) {
            const Piece* p = getPieceAt(Position(f, r));
            if (!p || p->getColor() != attacker) continue;

            // Pawns only attack diagonally forward
            if (p->getType() == PieceType::Pawn) {
                if ((pos.file == f - 1 || pos.file == f + 1) && pos.rank == r + pawnForward) {
                    return true;
                }
                continue;
            }

            // King attacks any adjacent square (excluding its own square)
            if (p->getType() == PieceType::King) {
                if (!(pos.file == f && pos.rank == r) &&
                    std::abs(pos.file - f) <= 1 && std::abs(pos.rank - r) <= 1) {
                    return true;
                }
                continue;
            }

            // Knight, Bishop, Rook, Queen
            auto moves = p->getPseudoLegalMoves(*this, Position(f, r));
            for (const Move& m : moves) {
                if (m.to == pos) return true;
            }
        }
    }
    return false;
}


bool Board::isInCheck(Color side) const {
    Position kingPos = findKing(side);
    if (!kingPos.isValid()) return false;
    Color opponent = (side == Color::White) ? Color::Black : Color::White;
    return isSquareAttackedBy(kingPos, opponent);
}

bool Board::isCheckmate(Color side) const {
    if (!isInCheck(side)) return false;
    // Generate legal moves for side — need a temporary mutable copy
    Board copy = *this;
    copy.sideToMove = side;
    return copy.generateLegalMoves().empty();
}

bool Board::isStalemate(Color side) const {
    if (isInCheck(side)) return false;
    Board copy = *this;
    copy.sideToMove = side;
    return copy.generateLegalMoves().empty();
}

Position Board::findKing(Color side) const {
    for (int f = 0; f < 8; ++f)
        for (int r = 0; r < 8; ++r) {
            const Piece* p = getPieceAt(Position(f, r));
            if (p && p->getColor() == side && p->getType() == PieceType::King)
                return Position(f, r);
        }
    return Position(); // invalid
}

bool Board::canCastleKingside(Color c) const {
    return (c == Color::White) ? castleWhiteKingside : castleBlackKingside;
}

bool Board::canCastleQueenside(Color c) const {
    return (c == Color::White) ? castleWhiteQueenside : castleBlackQueenside;
}

std::string Board::toFEN() const {
    std::string fen;

    // 1. Piece placement (rank 7 down to rank 0)
    for (int r = 7; r >= 0; --r) {
        int emptyCount = 0;
        for (int f = 0; f < 8; ++f) {
            const Piece* p = getPieceAt(Position(f, r));
            if (!p) {
                ++emptyCount;
            } else {
                if (emptyCount > 0) {
                    fen += std::to_string(emptyCount);
                    emptyCount = 0;
                }
                char c = ' ';
                switch (p->getType()) {
                    case PieceType::Pawn:   c = 'P'; break;
                    case PieceType::Knight: c = 'N'; break;
                    case PieceType::Bishop: c = 'B'; break;
                    case PieceType::Rook:   c = 'R'; break;
                    case PieceType::Queen:  c = 'Q'; break;
                    case PieceType::King:   c = 'K'; break;
                    default: break;
                }
                if (p->getColor() == Color::Black) {
                    c = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
                }
                fen += c;
            }
        }
        if (emptyCount > 0) {
            fen += std::to_string(emptyCount);
        }
        if (r > 0) fen += '/';
    }

    // 2. Active color
    fen += (sideToMove == Color::White) ? " w " : " b ";

    // 3. Castling availability
    std::string castling;
    if (castleWhiteKingside)  castling += 'K';
    if (castleWhiteQueenside) castling += 'Q';
    if (castleBlackKingside)  castling += 'k';
    if (castleBlackQueenside) castling += 'q';
    if (castling.empty()) castling = "-";
    fen += castling;

    // 4. En passant target
    fen += ' ';
    if (enPassantTarget.isValid()) {
        fen += enPassantTarget.toAlgebraic();
    } else {
        fen += '-';
    }

    // 5. Halfmove clock & 6. Fullmove number
    fen += ' ';
    fen += std::to_string(halfMoveClock);
    fen += ' ';
    fen += std::to_string(fullMoveNumber);

    return fen;
}

bool Board::loadFEN(const std::string& fen) {
    std::istringstream ss(fen);
    std::string pieces, side, castling, ep;
    int halfmove = 0, fullmove = 1;

    if (!(ss >> pieces >> side >> castling >> ep)) {
        return false;
    }
    ss >> halfmove >> fullmove;

    // Clear board
    for (int f = 0; f < 8; ++f) {
        for (int r = 0; r < 8; ++r) {
            squares[f][r] = nullptr;
        }
    }

    // Parse piece positions
    int rank = 7;
    int file = 0;
    for (char c : pieces) {
        if (c == '/') {
            --rank;
            file = 0;
            if (rank < 0) return false;
        } else if (std::isdigit(static_cast<unsigned char>(c))) {
            file += (c - '0');
        } else {
            if (file >= 8 || rank < 0) return false;
            Color col = std::isupper(static_cast<unsigned char>(c)) ? Color::White : Color::Black;
            char lower = static_cast<char>(std::tolower(static_cast<unsigned char>(c)));
            std::unique_ptr<Piece> piece = nullptr;

            switch (lower) {
                case 'p': piece = std::make_unique<Pawn>(col); break;
                case 'n': piece = std::make_unique<Knight>(col); break;
                case 'b': piece = std::make_unique<Bishop>(col); break;
                case 'r': piece = std::make_unique<Rook>(col); break;
                case 'q': piece = std::make_unique<Queen>(col); break;
                case 'k': piece = std::make_unique<King>(col); break;
                default: return false;
            }
            setPieceAt(Position(file, rank), std::move(piece));
            ++file;
        }
    }

    // Active color
    if (side == "w" || side == "W") sideToMove = Color::White;
    else if (side == "b" || side == "B") sideToMove = Color::Black;
    else return false;

    // Castling rights
    castleWhiteKingside  = (castling.find('K') != std::string::npos);
    castleWhiteQueenside = (castling.find('Q') != std::string::npos);
    castleBlackKingside  = (castling.find('k') != std::string::npos);
    castleBlackQueenside = (castling.find('q') != std::string::npos);

    // En passant
    if (ep != "-" && ep.length() == 2) {
        int epF = ep[0] - 'a';
        int epR = ep[1] - '1';
        if (epF >= 0 && epF < 8 && epR >= 0 && epR < 8) {
            enPassantTarget = Position(epF, epR);
        } else {
            enPassantTarget = Position();
        }
    } else {
        enPassantTarget = Position();
    }

    halfMoveClock  = halfmove;
    fullMoveNumber = (fullmove > 0) ? fullmove : 1;

    return true;
}