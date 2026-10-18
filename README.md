# Shatranj++ (शतरंज++) — C++ Chess Engine + React UI + Stockfish Analysis

A high-performance, object-oriented C++14 Chess Engine integrated with a modern React/TypeScript dashboard, custom Minimax + Alpha-Beta Pruning AI opponent, and real-time Stockfish UCI evaluation & post-game analysis.

---

## 🌟 Key Features

### 1. Authoritative C++14 Chess Engine
- **Full Chess Rules Implementation**:
  - Legal move generation with King check and pin restrictions.
  - Special moves: Kingside ($O\text{-}O$) and Queenside ($O\text{-}O\text{-}O$) Castling, En Passant captures, and Pawn Promotion (Queen, Rook, Bishop, Knight).
  - Check, Checkmate, and Stalemate detection.
  - 50-Move Draw rule and half-move clock tracking.
  - Standard FEN serialization (`toFEN()`) and parsing (`loadFEN()`).
  - Standard PGN generation (`exportPGN()`) with SAN moves.
  - Complete history tracking and state restoration (`undo()`).
  - Structured JSON API mode (`--api`) for backend communication.

### 2. Custom Minimax AI Opponent
- **Negamax Search with Alpha-Beta Pruning**:
  - Independent positional evaluation using Piece-Square Tables (PST) and material valuation.
  - MVV-LVA (Most Valuable Victim - Least Valuable Attacker) move ordering for deep pruning.
  - Configurable search depth (Difficulty 1 to 5).
  - **Strictly separated from Stockfish**: The custom C++ AI never delegates moves to Stockfish.

### 3. Stockfish Real-Time Position Evaluation & WDL Estimates
- **Independent UCI Process Integration**:
  - Communicates with Stockfish through the Universal Chess Interface (UCI) protocol.
  - Normalized evaluation scores: positive for White advantage, negative for Black advantage.
  - Forced mate formatting (`M3`, `-M2`).
  - Win/Draw/Loss (WDL) percentage estimates normalized to player perspective.
  - Principal Variation (PV), search depth, and node counts.

### 4. Post-Game Analysis Pipeline
- **Sequential Position Reconstruction & Move Classification**:
  - Analyzes each position before and after every played move.
  - Calculates centipawn loss ($cpLoss$) in consistent perspective.
  - Documented classification thresholds:
    - **Best**: Top engine recommendation or score loss $\le 10$ cp.
    - **Excellent**: Score loss $\le 30$ cp.
    - **Good**: Score loss $\le 65$ cp.
    - **Inaccuracy**: Score loss $65 - 150$ cp.
    - **Mistake**: Score loss $150 - 300$ cp.
    - **Blunder**: Score loss $> 300$ cp or blundering into forced mate.
    - **Missed Win**: Had decisive advantage ($\ge 500$ cp or mate) and forfeited it.
  - Player Accuracy calculation: $100 \times e^{-0.004 \times \text{avgLoss}}$ (0% to 100%).
  - Identifies critical tactical turning points.
  - Interactive SVG Evaluation Trajectory Graph with clickable move navigation.

### 5. Modern React + TypeScript Dashboard
- Responsive dark-theme dashboard with glassmorphism styling.
- Interactive 8×8 board supporting **Drag-and-Drop** and **Click-to-Move**.
- Square highlights: selected square halo, legal destination dots, capture rings, checked King alert, last-move accents.
- Pawn promotion dialog modal.
- Vertical live evaluation bar with smooth height transition.
- Move history table with Standard Algebraic Notation (SAN) and historical position review.
- Sound effects via Web Audio API synthesizer (moves, captures, checks, game over).

---

## 📁 System Architecture

```
Chess Project/
├── include/                     # C++ Engine Headers
│   ├── Types.h                  # Position, Move, Color, PieceType, MoveFlag
│   ├── Piece.h                  # Abstract base piece class
│   ├── Board.h                  # 8x8 Board, FEN import/export, legal move generator
│   ├── Game.h                   # Game state manager, SAN parser, JSON API mode
│   ├── Pawn.h, Knight.h, etc.   # Specific piece logic
│   ├── AI/
│   │   ├── Evaluator.h          # Material & Piece-Square Table evaluator
│   │   └── MinimaxAI.h          # Negamax + Alpha-Beta search
│   └── UI/
│       └── ConsoleRenderer.h    # Terminal Unicode chess renderer
├── src/                         # C++ Engine Implementations
│   ├── Board.cpp
│   ├── Game.cpp
│   ├── Pawn.cpp, Knight.cpp, Bishop.cpp, Rook.cpp, Queen.cpp, King.cpp
│   ├── AI/
│   │   ├── Evaluator.cpp
│   │   └── MinimaxAI.cpp
│   └── UI/
│       └── ConsoleRenderer.cpp
├── tests/                       # C++ Test Suite
│   ├── test_moves.cpp           # Legal moves & FEN roundtrip
│   ├── test_check.cpp           # Checkmate, pin restrictions, stalemate
│   └── test_special_rules.cpp   # Castling, en passant, promotion
├── engines/                     # Stockfish UCI engine assets
│   ├── stockfish_cli.js         # Bundled Stockfish WASM/UCI runner
│   ├── stockfish.wasm           # Stockfish WASM binary
│   └── stockfish.wasm.js
├── server/                      # Node.js + TypeScript Backend Service
│   ├── src/
│   │   ├── types.ts             # Shared data contracts
│   │   ├── cppEngine.ts         # C++ child process manager
│   │   ├── stockfish.ts         # Stockfish UCI manager & WDL normalizer
│   │   ├── analysis.ts          # Post-game analysis pipeline & accuracy
│   │   ├── routes.ts            # REST API endpoints
│   │   └── server.ts            # Express server
│   └── test/
│       └── backend.test.ts      # Automated backend integration tests
├── client/                      # React + TypeScript + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chessboard.tsx   # Interactive board with drag & drop
│   │   │   ├── EvaluationBar.tsx# Live evaluation bar & WDL
│   │   │   ├── MoveHistory.tsx  # Move list & review navigation
│   │   │   ├── Controls.tsx     # Game options & new game modal
│   │   │   └── PostGameAnalysisModal.tsx # Report & evaluation graph
│   │   ├── utils/
│   │   │   ├── chessPieces.tsx  # SVG piece components
│   │   │   └── sound.ts         # Audio synthesizer
│   │   ├── App.tsx
│   │   └── index.css
│   └── vite.config.ts
├── chess.exe                    # Compiled C++ Engine binary
└── main.cpp                     # C++ Entry point (--api flag support)
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **C++ Compiler**: GCC (MinGW for Windows) 6.0+ / Clang / MSVC supporting C++14.
- **Node.js**: v18+ (tested on Node.js v24).
- **npm**: v9+.

---

### Step 1: Compile the C++ Engine

```bash
# Compile the main engine executable
g++ -std=c++14 -O2 -Iinclude main.cpp src/*.cpp src/AI/*.cpp src/UI/*.cpp -o chess.exe
```

---

### Step 2: Start the Backend Service

```bash
cd server
npm install
npm run build
npm start
```
The backend starts on `http://localhost:3001` with endpoints under `/api`.

#### Stockfish Configuration
The server automatically detects Stockfish using:
1. `process.env.STOCKFISH_PATH` (if you have an official Stockfish binary installed).
2. `engines/stockfish.exe` (if placed in the engines directory).
3. **Bundled fallback**: The repository includes `engines/stockfish_cli.js` (Stockfish WASM), which works out-of-the-box on all platforms without any external downloads!

---

### Step 3: Start the Frontend Application

In a new terminal:
```bash
cd client
npm install
npm run dev
```
Open your browser at `http://localhost:5173/`.

---

## 🧪 Running Automated Tests

### 1. C++ Engine Tests
```bash
# Test Legal Move Generation & FEN Roundtrip
g++ -std=c++14 -O2 -Iinclude tests/test_moves.cpp src/Board.cpp src/Piece.cpp src/Pawn.cpp src/Knight.cpp src/Bishop.cpp src/Rook.cpp src/Queen.cpp src/King.cpp -o test_moves.exe
./test_moves.exe

# Test Checkmate, Pin Restrictions & Stalemate
g++ -std=c++14 -O2 -Iinclude tests/test_check.cpp src/Game.cpp src/Board.cpp src/Piece.cpp src/Pawn.cpp src/Knight.cpp src/Bishop.cpp src/Rook.cpp src/Queen.cpp src/King.cpp src/UI/ConsoleRenderer.cpp src/AI/Evaluator.cpp src/AI/MinimaxAI.cpp -o test_check.exe
./test_check.exe

# Test Castling, En Passant & Pawn Promotion
g++ -std=c++14 -O2 -Iinclude tests/test_special_rules.cpp src/Game.cpp src/Board.cpp src/Piece.cpp src/Pawn.cpp src/Knight.cpp src/Bishop.cpp src/Rook.cpp src/Queen.cpp src/King.cpp src/UI/ConsoleRenderer.cpp src/AI/Evaluator.cpp src/AI/MinimaxAI.cpp -o test_special_rules.exe
./test_special_rules.exe
```

### 2. Backend & Engine Integration Tests
```bash
cd server
npx tsx test/backend.test.ts
```
Verifies:
- C++ Engine starting position & legal move generation.
- Human move execution & custom C++ Minimax AI response.
- Stockfish UCI handshake, live evaluation score & WDL estimates.
- Post-game analysis pipeline, accuracy calculation, and move classifications.

### 3. Frontend Production Build
```bash
cd client
npm run build
```

---

## 🎮 Game Modes

1. **Play as White vs Custom C++ AI**:
   - Human plays White; custom C++ Minimax AI plays Black.
   - Configurable search depth (Novice to Expert).
2. **Play as Black vs Custom C++ AI**:
   - Custom C++ AI opens as White; Human responds as Black.
3. **Local Two-Player (Human vs Human)**:
   - Play locally on the same screen with move validation and SAN recording.
4. **Play vs Stockfish (Grandmaster Mode)**:
   - Challenge the official Stockfish UCI engine.

---

## 📜 API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/game/new` | Initialize standard starting position or custom FEN |
| `GET` | `/api/game/state` | Retrieve authoritative position, legal moves, and FEN |
| `POST` | `/api/game/move` | Submit move in coordinate notation (`e2e4`, `e7e8q`) |
| `POST` | `/api/game/ai-move` | Request move from custom C++ Minimax AI |
| `POST` | `/api/game/undo` | Undo previous move |
| `POST` | `/api/stockfish/eval` | Retrieve real-time Stockfish evaluation and WDL |
| `POST` | `/api/stockfish/analyze-game` | Start post-game analysis on game history |
| `GET` | `/api/stockfish/analysis-status/:id` | Poll analysis progress and retrieve report |
| `POST` | `/api/stockfish/cancel-analysis/:id` | Cancel active analysis |
| `GET` | `/api/stockfish/status` | Check Stockfish UCI engine status |

---

## ⚖️ License
Engine and Application code released under the MIT License.
Stockfish is licensed under the GNU General Public License v3 (GPL-3.0).
