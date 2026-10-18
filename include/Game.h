#pragma once
#include "Board.h"
#include "UI/ConsoleRenderer.h"
#include "AI/MinimaxAI.h"
#include <string>

enum class GameState {
    Ongoing,
    Checkmate,
    Stalemate,
    Resigned,
    DrawFiftyMoves
};

enum class GameMode {
    TwoPlayer,         // Human vs Human
    PlayerVsAI_White,  // Human is White, AI is Black
    PlayerVsAI_Black,  // Human is Black, AI is White
    AIVsAI             // Computer vs Computer
};

class Game {
private:
    Board board;
    GameState state;
    GameMode mode;
    MinimaxAI ai;
    int aiDepth;

public:
    Game();

    void start();
    bool processMove(const std::string& moveStr);
    void makeAIMove();

    void setGameMode(GameMode m) { mode = m; }
    void setAIDepth(int depth) { aiDepth = depth; }

    const Board& getBoard() const { return board; }
    GameState getState() const { return state; }
    bool isGameOver() const { return state != GameState::Ongoing; }

    static bool parseMove(const std::string& input, Position& from, Position& to, PieceType& promo);
};