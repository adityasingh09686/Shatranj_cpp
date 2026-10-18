#pragma once
#include "Board.h"
#include "UI/ConsoleRenderer.h"
#include <string>

enum class GameState {
    Ongoing,
    Checkmate,
    Stalemate,
    Resigned,
    DrawFiftyMoves
};

class Game {
private:
    Board board;
    GameState state;

public:
    Game();

    void start();
    bool processMove(const std::string& moveStr);

    const Board& getBoard() const { return board; }
    GameState getState() const { return state; }
    bool isGameOver() const { return state != GameState::Ongoing; }

    static bool parseMove(const std::string& input, Position& from, Position& to, PieceType& promo);
};