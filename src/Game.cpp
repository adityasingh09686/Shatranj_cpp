#include "Game.h"
#include <iostream>
#include <algorithm>
#include <cctype>

Game::Game() : state(GameState::Ongoing) {
    board.initStandardPosition();
}

static std::string trimAndClean(const std::string& str) {
    std::string clean;
    for (char c : str) {
        if (!std::isspace(static_cast<unsigned char>(c))) {
            clean += c;
        }
    }
    return clean;
}

bool Game::parseMove(const std::string& input, Position& from, Position& to, PieceType& promo) {
    std::string s = trimAndClean(input);
    if (s.empty()) return false;

    // Handle coordinate notation with hyphen: e.g. "e2-e4" -> "e2e4"
    if (s.length() >= 5 && s[2] == '-') {
        s.erase(2, 1);
    }

    if (s.length() < 4 || s.length() > 5) return false;

    char fromFileChar = static_cast<char>(std::tolower(static_cast<unsigned char>(s[0])));
    char fromRankChar = s[1];
    char toFileChar   = static_cast<char>(std::tolower(static_cast<unsigned char>(s[2])));
    char toRankChar   = s[3];

    if (fromFileChar < 'a' || fromFileChar > 'h') return false;
    if (fromRankChar < '1' || fromRankChar > '8') return false;
    if (toFileChar < 'a'   || toFileChar > 'h')   return false;
    if (toRankChar < '1'   || toRankChar > '8')   return false;

    from = Position(fromFileChar - 'a', fromRankChar - '1');
    to   = Position(toFileChar - 'a', toRankChar - '1');
    promo = PieceType::Queen;

    if (s.length() == 5) {
        char promoChar = static_cast<char>(std::tolower(static_cast<unsigned char>(s[4])));
        switch (promoChar) {
            case 'q': promo = PieceType::Queen;  break;
            case 'r': promo = PieceType::Rook;   break;
            case 'b': promo = PieceType::Bishop; break;
            case 'n': promo = PieceType::Knight; break;
            default: return false;
        }
    }

    return true;
}

bool Game::processMove(const std::string& rawInput) {
    std::string input = trimAndClean(rawInput);
    if (input.empty()) return false;

    auto legalMoves = board.generateLegalMoves();
    if (legalMoves.empty()) return false;

    Move selectedMove;
    bool moveFound = false;

    // 1. Check Castling notation (O-O, o-o, 0-0, O-O-O, 0-0-0)
    std::string lowerInput = input;
    std::transform(lowerInput.begin(), lowerInput.end(), lowerInput.begin(), ::tolower);

    if (lowerInput == "o-o-o" || lowerInput == "0-0-0") {
        for (const auto& m : legalMoves) {
            if (m.flag == MoveFlag::CastleQueenside) {
                selectedMove = m;
                moveFound = true;
                break;
            }
        }
    } else if (lowerInput == "o-o" || lowerInput == "0-0") {
        for (const auto& m : legalMoves) {
            if (m.flag == MoveFlag::CastleKingside) {
                selectedMove = m;
                moveFound = true;
                break;
            }
        }
    }

    // 2. Try Standard Coordinate Notation (e.g. "e2e4", "g1f3", "e2-e4")
    if (!moveFound) {
        Position from, to;
        PieceType promo = PieceType::None;
        if (parseMove(input, from, to, promo)) {
            for (const auto& m : legalMoves) {
                if (m.from == from && m.to == to) {
                    if (m.flag == MoveFlag::Promotion) {
                        if (m.promotionType == promo) {
                            selectedMove = m;
                            moveFound = true;
                            break;
                        }
                    } else {
                        selectedMove = m;
                        moveFound = true;
                        break;
                    }
                }
            }
        }
    }

    // 3. Try Standard Algebraic Notation (e.g. "Nf3", "Nc3", "e4", "d4", "Nxf3")
    if (!moveFound) {
        std::string s = input;
        // Remove capture mark 'x', check mark '+', checkmate '#', and promotion '='
        s.erase(std::remove(s.begin(), s.end(), 'x'), s.end());
        s.erase(std::remove(s.begin(), s.end(), '+'), s.end());
        s.erase(std::remove(s.begin(), s.end(), '#'), s.end());
        s.erase(std::remove(s.begin(), s.end(), '='), s.end());

        // A) Piece moves like "Nf3", "Bb5", "Qd4", "Re1", "Kf1"
        if (s.length() == 3) {
            char pieceChar = static_cast<char>(std::toupper(static_cast<unsigned char>(s[0])));
            char toFile = static_cast<char>(std::tolower(static_cast<unsigned char>(s[1])));
            char toRank = s[2];

            PieceType targetType = PieceType::None;
            if (pieceChar == 'N') targetType = PieceType::Knight;
            else if (pieceChar == 'B') targetType = PieceType::Bishop;
            else if (pieceChar == 'R') targetType = PieceType::Rook;
            else if (pieceChar == 'Q') targetType = PieceType::Queen;
            else if (pieceChar == 'K') targetType = PieceType::King;

            if (targetType != PieceType::None && toFile >= 'a' && toFile <= 'h' && toRank >= '1' && toRank <= '8') {
                Position targetPos(toFile - 'a', toRank - '1');
                for (const auto& m : legalMoves) {
                    const Piece* p = board.getPieceAt(m.from);
                    if (p && p->getType() == targetType && m.to == targetPos) {
                        selectedMove = m;
                        moveFound = true;
                        break;
                    }
                }
            }
            // A2) Pawn captures like "exd5" -> "ed5"
            else if (s[0] >= 'a' && s[0] <= 'h' && toFile >= 'a' && toFile <= 'h' && toRank >= '1' && toRank <= '8') {
                int fromFile = s[0] - 'a';
                Position targetPos(toFile - 'a', toRank - '1');
                for (const auto& m : legalMoves) {
                    const Piece* p = board.getPieceAt(m.from);
                    if (p && p->getType() == PieceType::Pawn && m.from.file == fromFile && m.to == targetPos) {
                        selectedMove = m;
                        moveFound = true;
                        break;
                    }
                }
            }
            // A3) Pawn promotions like "e8=Q" -> "e8Q"
            else if (s[0] >= 'a' && s[0] <= 'h' && (s[1] == '8' || s[1] == '1')) {
                char promoChar = static_cast<char>(std::toupper(static_cast<unsigned char>(s[2])));
                PieceType promoType = PieceType::None;
                if (promoChar == 'Q') promoType = PieceType::Queen;
                else if (promoChar == 'R') promoType = PieceType::Rook;
                else if (promoChar == 'B') promoType = PieceType::Bishop;
                else if (promoChar == 'N') promoType = PieceType::Knight;

                if (promoType != PieceType::None) {
                    Position targetPos(s[0] - 'a', s[1] - '1');
                    for (const auto& m : legalMoves) {
                        const Piece* p = board.getPieceAt(m.from);
                        if (p && p->getType() == PieceType::Pawn && m.to == targetPos && 
                            m.flag == MoveFlag::Promotion && m.promotionType == promoType) {
                            selectedMove = m;
                            moveFound = true;
                            break;
                        }
                    }
                }
            }
        }
        // B) Disambiguated piece moves like "Nbd2", "N1d2", "Rad1"
        else if (s.length() == 4) {
            char pieceChar = static_cast<char>(std::toupper(static_cast<unsigned char>(s[0])));
            char disambig = static_cast<char>(std::tolower(static_cast<unsigned char>(s[1])));
            char toFile = static_cast<char>(std::tolower(static_cast<unsigned char>(s[2])));
            char toRank = s[3];

            PieceType targetType = PieceType::None;
            if (pieceChar == 'N') targetType = PieceType::Knight;
            else if (pieceChar == 'B') targetType = PieceType::Bishop;
            else if (pieceChar == 'R') targetType = PieceType::Rook;
            else if (pieceChar == 'Q') targetType = PieceType::Queen;
            else if (pieceChar == 'K') targetType = PieceType::King;

            if (targetType != PieceType::None && toFile >= 'a' && toFile <= 'h' && toRank >= '1' && toRank <= '8') {
                Position targetPos(toFile - 'a', toRank - '1');
                for (const auto& m : legalMoves) {
                    const Piece* p = board.getPieceAt(m.from);
                    if (p && p->getType() == targetType && m.to == targetPos) {
                        if (disambig >= 'a' && disambig <= 'h' && m.from.file == (disambig - 'a')) {
                            selectedMove = m;
                            moveFound = true;
                            break;
                        }
                        if (disambig >= '1' && disambig <= '8' && m.from.rank == (disambig - '1')) {
                            selectedMove = m;
                            moveFound = true;
                            break;
                        }
                    }
                }
            }
        }
        // C) Pawn moves like "e4", "d5"
        else if (s.length() == 2) {
            char toFile = static_cast<char>(std::tolower(static_cast<unsigned char>(s[0])));
            char toRank = s[1];

            if (toFile >= 'a' && toFile <= 'h' && toRank >= '1' && toRank <= '8') {
                Position targetPos(toFile - 'a', toRank - '1');
                for (const auto& m : legalMoves) {
                    const Piece* p = board.getPieceAt(m.from);
                    if (p && p->getType() == PieceType::Pawn && m.to == targetPos) {
                        selectedMove = m;
                        moveFound = true;
                        break;
                    }
                }
            }
        }
    }

    if (!moveFound) {
        return false;
    }

    // Apply the valid move
    board.makeMove(selectedMove);

    // Evaluate game status
    Color nextSide = board.getSideToMove();
    if (board.isCheckmate(nextSide)) {
        state = GameState::Checkmate;
    } else if (board.isStalemate(nextSide)) {
        state = GameState::Stalemate;
    } else if (board.getHalfMoveClock() >= 100) {
        state = GameState::DrawFiftyMoves;
    }

    return true;
}

void Game::start() {
    board.initStandardPosition();
    state = GameState::Ongoing;

    std::cout << "========================================\n";
    std::cout << "        WELCOME TO CHESS (CONSOLE)      \n";
    std::cout << "========================================\n";
    std::cout << "How to enter moves:\n";
    std::cout << "  - Coordinate:  'g1f3' or 'g1-f3' or 'e2e4'\n";
    std::cout << "  - Algebraic:   'Nf3' or 'Nc3' or 'e4' or 'O-O'\n";
    std::cout << "Commands:\n";
    std::cout << "  - 'moves'  : list all currently legal moves\n";
    std::cout << "  - 'resign' : forfeit the game\n";
    std::cout << "  - 'quit'   : exit the program\n";

    while (!isGameOver()) {
        ConsoleRenderer::render(board);

        std::string prompt = (board.getSideToMove() == Color::White) ? "White" : "Black";
        std::cout << prompt << " to move > ";
        
        std::string line;
        if (!std::getline(std::cin, line)) break;

        std::string input = trimAndClean(line);
        if (input.empty()) continue;

        if (input == "quit" || input == "exit") {
            std::cout << "Game exited by user.\n";
            break;
        }

        if (input == "resign") {
            state = GameState::Resigned;
            Color winner = (board.getSideToMove() == Color::White) ? Color::Black : Color::White;
            std::cout << "\n" << (winner == Color::White ? "White" : "Black") << " wins by resignation!\n";
            break;
        }

        if (input == "moves") {
            auto moves = board.generateLegalMoves();
            std::cout << "\nLegal moves (" << moves.size() << "):\n";
            int count = 0;
            for (const auto& m : moves) {
                const Piece* p = board.getPieceAt(m.from);
                char piecePrefix = ' ';
                if (p && p->getType() == PieceType::Knight) piecePrefix = 'N';
                else if (p && p->getType() == PieceType::Bishop) piecePrefix = 'B';
                else if (p && p->getType() == PieceType::Rook) piecePrefix = 'R';
                else if (p && p->getType() == PieceType::Queen) piecePrefix = 'Q';
                else if (p && p->getType() == PieceType::King) piecePrefix = 'K';

                std::cout << m.from.toAlgebraic() << m.to.toAlgebraic();
                if (piecePrefix != ' ') std::cout << "(" << piecePrefix << ")";
                std::cout << "  ";
                if (++count % 6 == 0) std::cout << "\n";
            }
            std::cout << "\n\n";
            continue;
        }

        if (!processMove(input)) {
            std::cout << "\n[!] Invalid or illegal move: '" << line << "'\n";
            std::cout << "    Tip: Type 'g1f3' or 'Nf3' to move the horse/knight, or type 'moves' to see options.\n";
        }
    }

    if (state == GameState::Checkmate) {
        ConsoleRenderer::render(board);
        Color winner = (board.getSideToMove() == Color::White) ? Color::Black : Color::White;
        std::cout << "\n========================================\n";
        std::cout << "  CHECKMATE! " << (winner == Color::White ? "White" : "Black") << " wins the game!\n";
        std::cout << "========================================\n";
    } else if (state == GameState::Stalemate) {
        ConsoleRenderer::render(board);
        std::cout << "\n========================================\n";
        std::cout << "  STALEMATE! The game ends in a draw.\n";
        std::cout << "========================================\n";
    } else if (state == GameState::DrawFiftyMoves) {
        ConsoleRenderer::render(board);
        std::cout << "\n========================================\n";
        std::cout << "  DRAW by 50-move rule!\n";
        std::cout << "========================================\n";
    }
}