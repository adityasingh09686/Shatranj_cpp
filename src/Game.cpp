#include "Game.h"
#include <iostream>
#include <algorithm>
#include <cctype>

Game::Game() 
    : state(GameState::Ongoing), 
      mode(GameMode::TwoPlayer), 
      aiDepth(3) 
{
    reset();
}

static std::string trimAndClean(const std::string& str) {
    std::string clean;
    for (char c : str) {
        unsigned char uc = static_cast<unsigned char>(c);
        if (uc >= 33 && uc <= 126) {
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

    Board beforeBoard = board;
    std::string sanStr = toSAN(selectedMove, beforeBoard);
    std::string uciStr = selectedMove.from.toAlgebraic() + selectedMove.to.toAlgebraic();
    if (selectedMove.flag == MoveFlag::Promotion) {
        char promo = 'q';
        if (selectedMove.promotionType == PieceType::Rook) promo = 'r';
        else if (selectedMove.promotionType == PieceType::Bishop) promo = 'b';
        else if (selectedMove.promotionType == PieceType::Knight) promo = 'n';
        uciStr += promo;
    }

    // Apply the valid move
    board.makeMove(selectedMove);

    boardHistory.push_back(beforeBoard);
    moveHistoryUCI.push_back(uciStr);
    moveHistorySAN.push_back(sanStr);

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

Move Game::computeAIMove(int depth) {
    return ai.findBestMove(board, depth);
}

void Game::makeAIMove() {
    if (isGameOver()) return;

    std::cout << "\n🤖 Computer is thinking (depth " << aiDepth << ")...\n";
    Move bestMove = computeAIMove(aiDepth);

    if (!bestMove.from.isValid() || !bestMove.to.isValid()) {
        std::cout << "No moves found!\n";
        return;
    }

    const Piece* p = board.getPieceAt(bestMove.from);
    std::string symbol = p ? ConsoleRenderer::getPieceSymbol(p) : "";

    std::cout << "🤖 Computer played: " 
              << bestMove.from.toAlgebraic() << bestMove.to.toAlgebraic();
    if (!symbol.empty()) std::cout << " (" << symbol << ")";
    std::cout << " [Searched " << ai.getNodesEvaluated() << " positions]\n\n";

    std::string uciStr = bestMove.from.toAlgebraic() + bestMove.to.toAlgebraic();
    if (bestMove.flag == MoveFlag::Promotion) {
        char promo = 'q';
        if (bestMove.promotionType == PieceType::Rook) promo = 'r';
        else if (bestMove.promotionType == PieceType::Bishop) promo = 'b';
        else if (bestMove.promotionType == PieceType::Knight) promo = 'n';
        uciStr += promo;
    }

    processMove(uciStr);
}

void Game::start() {
    reset();

    std::cout << "========================================\n";
    std::cout << "        WELCOME TO CHESS (SHATRANJ)     \n";
    std::cout << "========================================\n";
    std::cout << "Select Game Mode:\n";
    std::cout << "  1. Human vs Human (Two Player)\n";
    std::cout << "  2. Play as White vs Computer 🤖\n";
    std::cout << "  3. Play as Black vs Computer 🤖\n";
    std::cout << "  4. Computer vs Computer (Watch) 🤖\n";
    std::cout << "Enter mode [1-4, default 1]: ";

    std::string modeLine;
    if (std::getline(std::cin, modeLine)) {
        std::string modeInput = trimAndClean(modeLine);
        if (modeInput == "2") {
            mode = GameMode::PlayerVsAI_White;
            std::cout << "Selected: Playing as White vs Computer.\n";
        } else if (modeInput == "3") {
            mode = GameMode::PlayerVsAI_Black;
            std::cout << "Selected: Playing as Black vs Computer.\n";
        } else if (modeInput == "4") {
            mode = GameMode::AIVsAI;
            std::cout << "Selected: Computer vs Computer match.\n";
        } else {
            mode = GameMode::TwoPlayer;
            std::cout << "Selected: Human vs Human (Two Player).\n";
        }
    }

    std::cout << "\nHow to enter moves:\n";
    std::cout << "  - Coordinate:  'g1f3' or 'g1-f3' or 'e2e4'\n";
    std::cout << "  - Algebraic:   'Nf3' or 'Nc3' or 'e4' or 'O-O'\n";
    std::cout << "Commands:\n";
    std::cout << "  - 'moves'  : list all currently legal moves\n";
    std::cout << "  - 'ai'     : let computer make the move\n";
    std::cout << "  - 'eval'   : show current board evaluation\n";
    std::cout << "  - 'resign' : forfeit the game\n";
    std::cout << "  - 'quit'   : exit the program\n";

    while (!isGameOver()) {
        ConsoleRenderer::render(board);

        // Check if current turn belongs to the computer
        bool isAITurn = false;
        if (mode == GameMode::PlayerVsAI_White && board.getSideToMove() == Color::Black) {
            isAITurn = true;
        } else if (mode == GameMode::PlayerVsAI_Black && board.getSideToMove() == Color::White) {
            isAITurn = true;
        } else if (mode == GameMode::AIVsAI) {
            isAITurn = true;
        }

        if (isAITurn) {
            makeAIMove();
            continue;
        }

        std::string prompt = (board.getSideToMove() == Color::White) ? "White ♔" : "Black ♚";
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

        if (input == "ai") {
            makeAIMove();
            continue;
        }

        if (input == "eval") {
            int score = Evaluator::evaluate(board);
            double pawns = static_cast<double>(score) / 100.0;
            std::cout << "\n📊 Evaluation: ";
            if (pawns > 0) std::cout << "+" << pawns << " (White advantage)\n";
            else if (pawns < 0) std::cout << pawns << " (Black advantage)\n";
            else std::cout << "0.00 (Equal position)\n";
            std::cout << "\n";
            continue;
        }

        if (input == "moves") {
            auto moves = board.generateLegalMoves();
            std::cout << "\nLegal moves (" << moves.size() << "):\n";
            int count = 0;
            for (const auto& m : moves) {
                const Piece* p = board.getPieceAt(m.from);
                std::string pieceSymbol = p ? ConsoleRenderer::getPieceSymbol(p) : "";

                std::cout << m.from.toAlgebraic() << m.to.toAlgebraic();
                if (!pieceSymbol.empty()) std::cout << "(" << pieceSymbol << ")";
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

void Game::reset() {
    board.initStandardPosition();
    state = GameState::Ongoing;
    boardHistory.clear();
    moveHistoryUCI.clear();
    moveHistorySAN.clear();
}

bool Game::undo() {
    if (boardHistory.empty()) return false;
    board = boardHistory.back();
    boardHistory.pop_back();
    if (!moveHistoryUCI.empty()) moveHistoryUCI.pop_back();
    if (!moveHistorySAN.empty()) moveHistorySAN.pop_back();

    Color next = board.getSideToMove();
    if (board.isCheckmate(next)) {
        state = GameState::Checkmate;
    } else if (board.isStalemate(next)) {
        state = GameState::Stalemate;
    } else if (board.getHalfMoveClock() >= 100) {
        state = GameState::DrawFiftyMoves;
    } else {
        state = GameState::Ongoing;
    }
    return true;
}

std::string Game::toSAN(const Move& m, const Board& before) const {
    if (m.flag == MoveFlag::CastleKingside) return "O-O";
    if (m.flag == MoveFlag::CastleQueenside) return "O-O-O";

    const Piece* piece = before.getPieceAt(m.from);
    if (!piece) return m.from.toAlgebraic() + m.to.toAlgebraic();

    std::string san;
    PieceType ptype = piece->getType();

    if (ptype == PieceType::Pawn) {
        if (m.from.file != m.to.file || m.flag == MoveFlag::EnPassant) {
            san += static_cast<char>('a' + m.from.file);
            san += "x";
        }
        san += m.to.toAlgebraic();
        if (m.flag == MoveFlag::Promotion) {
            san += "=";
            switch (m.promotionType) {
                case PieceType::Queen:  san += "Q"; break;
                case PieceType::Rook:   san += "R"; break;
                case PieceType::Bishop: san += "B"; break;
                case PieceType::Knight: san += "N"; break;
                default: san += "Q"; break;
            }
        }
    } else {
        switch (ptype) {
            case PieceType::Knight: san += "N"; break;
            case PieceType::Bishop: san += "B"; break;
            case PieceType::Rook:   san += "R"; break;
            case PieceType::Queen:  san += "Q"; break;
            case PieceType::King:   san += "K"; break;
            default: break;
        }

        // Disambiguation
        auto legal = before.generateLegalMoves();
        bool sameTypeDiffPos = false;
        bool sameFile = false;
        bool sameRank = false;

        for (const auto& other : legal) {
            if (other.from == m.from) continue;
            if (other.to != m.to) continue;
            const Piece* op = before.getPieceAt(other.from);
            if (op && op->getType() == ptype && op->getColor() == piece->getColor()) {
                sameTypeDiffPos = true;
                if (other.from.file == m.from.file) sameFile = true;
                if (other.from.rank == m.from.rank) sameRank = true;
            }
        }

        if (sameTypeDiffPos) {
            if (!sameFile) {
                san += static_cast<char>('a' + m.from.file);
            } else if (!sameRank) {
                san += static_cast<char>('1' + m.from.rank);
            } else {
                san += static_cast<char>('a' + m.from.file);
                san += static_cast<char>('1' + m.from.rank);
            }
        }

        if (before.getPieceAt(m.to) != nullptr) {
            san += "x";
        }
        san += m.to.toAlgebraic();
    }

    // Check / Checkmate suffix
    Board after = before;
    after.makeMove(m);
    Color opp = after.getSideToMove();
    if (after.isCheckmate(opp)) {
        san += "#";
    } else if (after.isInCheck(opp)) {
        san += "+";
    }

    return san;
}

std::string Game::exportPGN() const {
    std::string pgn;
    pgn += "[Event \"Shatranj Match\"]\n";
    pgn += "[Site \"Localhost\"]\n";
    pgn += "[Date \"2026.10.18\"]\n";
    pgn += "[Round \"1\"]\n";
    pgn += "[White \"White\"]\n";
    pgn += "[Black \"Black\"]\n";

    std::string result = "*";
    if (state == GameState::Checkmate) {
        result = (board.getSideToMove() == Color::White) ? "0-1" : "1-0";
    } else if (state == GameState::Stalemate || state == GameState::DrawFiftyMoves) {
        result = "1/2-1/2";
    } else if (state == GameState::Resigned) {
        result = (board.getSideToMove() == Color::White) ? "0-1" : "1-0";
    }
    pgn += "[Result \"" + result + "\"]\n\n";

    for (size_t i = 0; i < moveHistorySAN.size(); ++i) {
        if (i % 2 == 0) {
            pgn += std::to_string(i / 2 + 1) + ". ";
        }
        pgn += moveHistorySAN[i] + " ";
    }
    pgn += result + "\n";
    return pgn;
}

static std::string extractJsonString(const std::string& json, const std::string& key) {
    std::string needle = "\"" + key + "\"";
    size_t searchPos = 0;
    while (true) {
        size_t pos = json.find(needle, searchPos);
        if (pos == std::string::npos) return "";
        size_t colonPos = pos + needle.length();
        while (colonPos < json.length() && (json[colonPos] == ' ' || json[colonPos] == '\t')) ++colonPos;
        if (colonPos < json.length() && json[colonPos] == ':') {
            size_t valPos = colonPos + 1;
            while (valPos < json.length() && (json[valPos] == ' ' || json[valPos] == '\t')) ++valPos;
            if (valPos < json.length() && json[valPos] == '"') {
                ++valPos;
                size_t end = json.find('"', valPos);
                if (end != std::string::npos) {
                    return json.substr(valPos, end - valPos);
                }
            }
            return "";
        }
        searchPos = pos + 1;
    }
}

static int extractJsonInt(const std::string& json, const std::string& key, int defaultVal) {
    std::string needle = "\"" + key + "\"";
    size_t searchPos = 0;
    while (true) {
        size_t pos = json.find(needle, searchPos);
        if (pos == std::string::npos) return defaultVal;
        size_t colonPos = pos + needle.length();
        while (colonPos < json.length() && (json[colonPos] == ' ' || json[colonPos] == '\t')) ++colonPos;
        if (colonPos < json.length() && json[colonPos] == ':') {
            size_t valPos = colonPos + 1;
            while (valPos < json.length() && (json[valPos] == ' ' || json[valPos] == '\t')) ++valPos;
            std::string numStr;
            if (valPos < json.length() && (json[valPos] == '-' || std::isdigit(static_cast<unsigned char>(json[valPos])))) {
                numStr += json[valPos++];
                while (valPos < json.length() && std::isdigit(static_cast<unsigned char>(json[valPos]))) {
                    numStr += json[valPos++];
                }
                try {
                    return std::stoi(numStr);
                } catch (...) {
                    return defaultVal;
                }
            }
            return defaultVal;
        }
        searchPos = pos + 1;
    }
}

static std::string escapeJson(const std::string& s) {
    std::string out;
    for (char c : s) {
        if (c == '"') out += "\\\"";
        else if (c == '\\') out += "\\\\";
        else if (c == '\n') out += "\\n";
        else if (c == '\r') out += "\\r";
        else if (c == '\t') out += "\\t";
        else out += c;
    }
    return out;
}

static std::string buildStateResponse(const Board& b, GameState st, const std::vector<std::string>& sanHist, const std::vector<std::string>& uciHist, const std::string& pgn) {
    std::string json = "{";
    json += "\"ok\":true,";
    json += "\"fen\":\"" + escapeJson(b.toFEN()) + "\",";
    json += "\"sideToMove\":\"" + std::string(b.getSideToMove() == Color::White ? "white" : "black") + "\",";
    json += "\"inCheck\":" + std::string(b.isInCheck(b.getSideToMove()) ? "true" : "false") + ",";

    std::string statusStr = "ongoing";
    if (st == GameState::Checkmate) statusStr = "checkmate";
    else if (st == GameState::Stalemate) statusStr = "stalemate";
    else if (st == GameState::Resigned) statusStr = "resigned";
    else if (st == GameState::DrawFiftyMoves) statusStr = "draw_fifty_moves";
    json += "\"status\":\"" + statusStr + "\",";
    json += "\"isGameOver\":" + std::string(st != GameState::Ongoing ? "true" : "false") + ",";

    // Legal moves in UCI format
    auto moves = b.generateLegalMoves();
    json += "\"legalMoves\":[";
    for (size_t i = 0; i < moves.size(); ++i) {
        std::string uci = moves[i].from.toAlgebraic() + moves[i].to.toAlgebraic();
        if (moves[i].flag == MoveFlag::Promotion) {
            char p = 'q';
            if (moves[i].promotionType == PieceType::Rook) p = 'r';
            else if (moves[i].promotionType == PieceType::Bishop) p = 'b';
            else if (moves[i].promotionType == PieceType::Knight) p = 'n';
            uci += p;
        }
        json += "\"" + uci + "\"";
        if (i + 1 < moves.size()) json += ",";
    }
    json += "],";

    // History SAN
    json += "\"historySAN\":[";
    for (size_t i = 0; i < sanHist.size(); ++i) {
        json += "\"" + escapeJson(sanHist[i]) + "\"";
        if (i + 1 < sanHist.size()) json += ",";
    }
    json += "],";

    // History UCI
    json += "\"historyUCI\":[";
    for (size_t i = 0; i < uciHist.size(); ++i) {
        json += "\"" + escapeJson(uciHist[i]) + "\"";
        if (i + 1 < uciHist.size()) json += ",";
    }
    json += "],";

    // PGN
    json += "\"pgn\":\"" + escapeJson(pgn) + "\"";
    json += "}";
    return json;
}

std::string Game::processApiCommand(const std::string& jsonInput) {
    std::string cmd = extractJsonString(jsonInput, "cmd");
    if (cmd.empty()) {
        std::string trimmed = trimAndClean(jsonInput);
        if (trimmed == "new" || trimmed == "state" || trimmed == "moves" || trimmed == "undo" || trimmed == "eval" || trimmed == "pgn" || trimmed == "fen") {
            cmd = trimmed;
        }
    }

    if (cmd == "new" || cmd == "reset") {
        reset();
        return buildStateResponse(board, state, moveHistorySAN, moveHistoryUCI, exportPGN());
    }

    if (cmd == "load_fen") {
        std::string fen = extractJsonString(jsonInput, "fen");
        if (fen.empty()) return "{\"ok\":false,\"error\":\"Missing fen parameter\"}";
        if (!board.loadFEN(fen)) {
            return "{\"ok\":false,\"error\":\"Invalid FEN format\"}";
        }
        boardHistory.clear();
        moveHistoryUCI.clear();
        moveHistorySAN.clear();
        Color next = board.getSideToMove();
        if (board.isCheckmate(next)) state = GameState::Checkmate;
        else if (board.isStalemate(next)) state = GameState::Stalemate;
        else state = GameState::Ongoing;
        return buildStateResponse(board, state, moveHistorySAN, moveHistoryUCI, exportPGN());
    }

    if (cmd == "state") {
        return buildStateResponse(board, state, moveHistorySAN, moveHistoryUCI, exportPGN());
    }

    if (cmd == "moves") {
        auto moves = board.generateLegalMoves();
        std::string json = "{\"ok\":true,\"moves\":[";
        for (size_t i = 0; i < moves.size(); ++i) {
            std::string uci = moves[i].from.toAlgebraic() + moves[i].to.toAlgebraic();
            if (moves[i].flag == MoveFlag::Promotion) {
                char p = 'q';
                if (moves[i].promotionType == PieceType::Rook) p = 'r';
                else if (moves[i].promotionType == PieceType::Bishop) p = 'b';
                else if (moves[i].promotionType == PieceType::Knight) p = 'n';
                uci += p;
            }
            json += "\"" + uci + "\"";
            if (i + 1 < moves.size()) json += ",";
        }
        json += "]}";
        return json;
    }

    if (cmd == "move") {
        std::string moveStr = extractJsonString(jsonInput, "move");
        if (moveStr.empty()) return "{\"ok\":false,\"error\":\"Missing move parameter\"}";
        if (!processMove(moveStr)) {
            return "{\"ok\":false,\"error\":\"Illegal or invalid move: " + escapeJson(moveStr) + "\"}";
        }
        std::string resp = buildStateResponse(board, state, moveHistorySAN, moveHistoryUCI, exportPGN());
        // Insert lastMove fields
        std::string lastSAN = moveHistorySAN.empty() ? "" : moveHistorySAN.back();
        std::string lastUCI = moveHistoryUCI.empty() ? "" : moveHistoryUCI.back();
        std::string insert = ",\"lastMoveSAN\":\"" + escapeJson(lastSAN) + "\",\"lastMoveUCI\":\"" + escapeJson(lastUCI) + "\"";
        resp.insert(resp.length() - 1, insert);
        return resp;
    }

    if (cmd == "ai_move") {
        if (isGameOver()) {
            return "{\"ok\":false,\"error\":\"Game is already over\"}";
        }
        int depth = extractJsonInt(jsonInput, "depth", aiDepth);
        if (depth < 1) depth = 1;
        if (depth > 6) depth = 6;

        Move bestMove = computeAIMove(depth);
        if (!bestMove.from.isValid() || !bestMove.to.isValid()) {
            return "{\"ok\":false,\"error\":\"No legal moves available\"}";
        }

        std::string uciStr = bestMove.from.toAlgebraic() + bestMove.to.toAlgebraic();
        if (bestMove.flag == MoveFlag::Promotion) {
            char p = 'q';
            if (bestMove.promotionType == PieceType::Rook) p = 'r';
            else if (bestMove.promotionType == PieceType::Bishop) p = 'b';
            else if (bestMove.promotionType == PieceType::Knight) p = 'n';
            uciStr += p;
        }

        if (!processMove(uciStr)) {
            return "{\"ok\":false,\"error\":\"Failed to commit AI move\"}";
        }

        std::string resp = buildStateResponse(board, state, moveHistorySAN, moveHistoryUCI, exportPGN());
        std::string lastSAN = moveHistorySAN.empty() ? "" : moveHistorySAN.back();
        std::string insert = ",\"aiMove\":\"" + escapeJson(uciStr) + "\",\"aiMoveSAN\":\"" + escapeJson(lastSAN) + "\",\"nodesEvaluated\":" + std::to_string(ai.getNodesEvaluated());
        resp.insert(resp.length() - 1, insert);
        return resp;
    }

    if (cmd == "undo") {
        if (!undo()) {
            return "{\"ok\":false,\"error\":\"No moves to undo\"}";
        }
        return buildStateResponse(board, state, moveHistorySAN, moveHistoryUCI, exportPGN());
    }

    if (cmd == "eval") {
        int score = Evaluator::evaluate(board);
        return "{\"ok\":true,\"score\":" + std::to_string(score) + "}";
    }

    if (cmd == "fen") {
        return "{\"ok\":true,\"fen\":\"" + escapeJson(board.toFEN()) + "\"}";
    }

    if (cmd == "pgn") {
        return "{\"ok\":true,\"pgn\":\"" + escapeJson(exportPGN()) + "\"}";
    }

    return "{\"ok\":false,\"error\":\"Unknown command: " + escapeJson(cmd) + "\"}";
}

void Game::runApiMode() {
    std::string line;
    while (std::getline(std::cin, line)) {
        std::string trimmed = trimAndClean(line);
        if (trimmed.empty()) continue;
        if (trimmed == "quit" || trimmed == "exit" || trimmed == "{\"cmd\":\"quit\"}") {
            std::cout << "{\"ok\":true,\"message\":\"bye\"}\n" << std::flush;
            break;
        }
        std::string resp = processApiCommand(line);
        std::cout << resp << "\n" << std::flush;
    }
}