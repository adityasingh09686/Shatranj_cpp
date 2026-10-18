#include "Game.h"
#include <cstring>

int main(int argc, char* argv[]) {
    Game game;
    for (int i = 1; i < argc; ++i) {
        if (std::strcmp(argv[i], "--api") == 0) {
            game.runApiMode();
            return 0;
        }
    }
    game.start();
    return 0;
}