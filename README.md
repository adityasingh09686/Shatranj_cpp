# Shatranj++ (शतरंज++) 

A clean, object-oriented C++14 Chess Engine and Console Game.

---

## Features

- **Full Chess Rules Implementation**:
  - All piece moves (Pawn, Knight, Bishop, Rook, Queen, King).
  - **Pawn Rules**: Single push, double push from starting rank, diagonal captures, En Passant captures, and pawn promotions (Queen, Rook, Bishop, Knight).
  - **Castling**: Kingside ($O\text{-}O$) and Queenside ($O\text{-}O\text{-}O$) with full safety verification (cannot castle out of check, through check, or into check).
  - **Check, Checkmate, and Stalemate Detection**: Real-time evaluation of board state.
  - **50-Move Draw Rule**: Monitored by a dedicated half-move clock.
- **Intuitive Move Input**:
  - **Standard Algebraic Notation (SAN)**: e.g., `Nf3`, `Nc3`, `e4`, `d5`, `exd5`, `e8=Q`, `O-O`.
  - **Coordinate Notation**: e.g., `g1f3`, `e2e4`, `e7e8q`, `e2-e4`.
  - Case-insensitive and forgiving with spaces/hyphens.
- **Interactive Console Renderer**:
  - Clean 8x8 ASCII board with rank & file labels.
  - Active turn indicator, move numbers, check indicators, and legal move assistance (`moves` command).

---

##  Building & Running

### Prerequisites
- A C++14 compliant compiler (GCC / Clang / MSVC)
- *(Optional)* CMake 3.10+

### Option A: Using g++ directly
```bash
g++ -std=c++14 -Iinclude main.cpp src/*.cpp src/UI/*.cpp -o chess
./chess
```

### Option B: Using CMake
```bash
mkdir build
cd build
cmake ..
cmake --build .
./chess
```

---

## 🎮 How to Play

Run the executable and type your moves when prompted:

```text
White to move > Nf3
Black to move > d5
White to move > g3
```

### Useful In-Game Commands:
- `moves` — View all currently legal moves for your turn.
- `resign` — Concede the game.
- `quit` / `exit` — Exit the program.

---

## 📁 Project Architecture

```
Chess Project/
├── include/
│   ├── Types.h          # Core types: Color, Position, Move, PieceType, MoveFlag
│   ├── Piece.h          # Abstract base piece class
│   ├── Board.h          # 8x8 Board representation, move executor, legal move generator
│   ├── Game.h           # Game loop, input parser, game state manager
│   ├── Pawn.h, Knight.h, Bishop.h, Rook.h, Queen.h, King.h
│   └── UI/
│       └── ConsoleRenderer.h # Board visualization
├── src/
│   ├── Board.cpp
│   ├── Game.cpp
│   ├── Pawn.cpp, Knight.cpp, Bishop.cpp, Rook.cpp, Queen.cpp, King.cpp
│   └── UI/
│       └── ConsoleRenderer.cpp
├── main.cpp
└── CMakeLists.txt
```

---

## 📜 License
MIT License.
