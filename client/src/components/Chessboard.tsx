import React, { useState, useMemo } from 'react';
import { ChessPiece } from '../utils/chessPieces';
import { SideColor } from '../types';
import { BoardArrows } from './BoardArrows';

interface ChessboardProps {
  fen: string;
  orientation: SideColor;
  legalMoves: string[]; // e.g. ["e2e4", "g1f3", "e7e8q"]
  lastMove?: { from: string; to: string };
  inCheck: boolean;
  sideToMove: SideColor;
  disabled?: boolean;
  onMove: (moveUCI: string) => void;
  bestMove?: string;
  threatMove?: string;
  showArrows?: boolean;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  orientation,
  legalMoves,
  lastMove,
  inCheck,
  sideToMove,
  disabled = false,
  onMove,
  bestMove,
  threatMove,
  showArrows = true
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<string | null>(null);

  // Parse FEN into 8x8 grid (rank 7 down to 0, file 0 to 7)
  const boardGrid = useMemo(() => {
    const grid: (string | null)[][] = Array(8).fill(null).map(() => Array(8).fill(null));
    const piecePart = fen.trim().split(' ')[0] || '';
    const ranks = piecePart.split('/');

    ranks.forEach((rankStr, rankIdx) => {
      const r = 7 - rankIdx;
      let f = 0;
      for (const ch of rankStr) {
        if (ch >= '1' && ch <= '8') {
          f += parseInt(ch, 10);
        } else {
          grid[f][r] = ch;
          f++;
        }
      }
    });
    return grid;
  }, [fen]);

  // Find King square currently in check
  const checkedKingSquare = useMemo(() => {
    if (!inCheck) return null;
    const kingChar = sideToMove === 'white' ? 'K' : 'k';
    for (let f = 0; f < 8; ++f) {
      for (let r = 0; r < 8; ++r) {
        if (boardGrid[f][r] === kingChar) {
          return `${String.fromCharCode(97 + f)}${r + 1}`;
        }
      }
    }
    return null;
  }, [inCheck, sideToMove, boardGrid]);

  // Get legal destination squares for currently selected square
  const legalDestinations = useMemo(() => {
    if (!selectedSquare) return new Set<string>();
    const dests = new Set<string>();
    legalMoves.forEach((m) => {
      if (m.startsWith(selectedSquare)) {
        dests.add(m.substring(2, 4));
      }
    });
    return dests;
  }, [selectedSquare, legalMoves]);

  // Coordinate arrays based on orientation
  const fileIndices = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const rankIndices = orientation === 'white' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  const handleSquareClick = (square: string) => {
    if (disabled || pendingPromotion) return;

    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10) - 1;
    const piece = boardGrid[file][rank];

    // If already selected, check if clicking a valid destination
    if (selectedSquare) {
      if (selectedSquare === square) {
        // Deselect
        setSelectedSquare(null);
        return;
      }

      // Check if clicking another piece of the same color
      const isSameColor = piece && (
        (sideToMove === 'white' && piece === piece.toUpperCase()) ||
        (sideToMove === 'black' && piece === piece.toLowerCase())
      );

      if (isSameColor) {
        setSelectedSquare(square);
        return;
      }

      // Attempt move
      if (legalDestinations.has(square)) {
        attemptMove(selectedSquare, square);
        setSelectedSquare(null);
        return;
      }

      setSelectedSquare(null);
      return;
    }

    // Select piece if it belongs to player's turn
    if (piece) {
      const isPlayerTurnPiece = (sideToMove === 'white' && piece === piece.toUpperCase()) ||
                                (sideToMove === 'black' && piece === piece.toLowerCase());
      if (isPlayerTurnPiece) {
        setSelectedSquare(square);
      }
    }
  };

  const attemptMove = (from: string, to: string) => {
    // Check if move is a pawn promotion
    const fromRank = from[1];
    const toRank = to[1];
    const fromFile = from.charCodeAt(0) - 97;
    const piece = boardGrid[fromFile][parseInt(fromRank, 10) - 1];

    const isWhitePawnPromo = piece === 'P' && fromRank === '7' && toRank === '8';
    const isBlackPawnPromo = piece === 'p' && fromRank === '2' && toRank === '1';

    if (isWhitePawnPromo || isBlackPawnPromo) {
      // Trigger promotion dialog
      setPendingPromotion({ from, to });
      return;
    }

    onMove(`${from}${to}`);
  };

  const completePromotion = (promoPiece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    onMove(`${pendingPromotion.from}${pendingPromotion.to}${promoPiece}`);
    setPendingPromotion(null);
  };

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, square: string) => {
    if (disabled || pendingPromotion) {
      e.preventDefault();
      return;
    }
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10) - 1;
    const piece = boardGrid[file][rank];

    const isPlayerTurnPiece = piece && (
      (sideToMove === 'white' && piece === piece.toUpperCase()) ||
      (sideToMove === 'black' && piece === piece.toLowerCase())
    );

    if (!isPlayerTurnPiece) {
      e.preventDefault();
      return;
    }

    setDraggedSquare(square);
    setSelectedSquare(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toSquare: string) => {
    e.preventDefault();
    const fromSquare = draggedSquare || e.dataTransfer.getData('text/plain');
    setDraggedSquare(null);

    if (!fromSquare || fromSquare === toSquare) return;

    // Check if legal move
    const isLegal = legalMoves.some((m) => m.startsWith(`${fromSquare}${toSquare}`));
    if (isLegal) {
      attemptMove(fromSquare, toSquare);
      setSelectedSquare(null);
    }
  };

  return (
    <div className="chessboard-container">
      <div className="chessboard-grid">
        {rankIndices.map((rankIdx) =>
          fileIndices.map((fileIdx) => {
            const squareName = `${String.fromCharCode(97 + fileIdx)}${rankIdx + 1}`;
            const piece = boardGrid[fileIdx][rankIdx];
            const isDark = (fileIdx + rankIdx) % 2 === 0;

            const isSelected = selectedSquare === squareName;
            const isLegalDest = legalDestinations.has(squareName);
            const isLastMoveFrom = lastMove?.from === squareName;
            const isLastMoveTo = lastMove?.to === squareName;
            const isKingInCheck = checkedKingSquare === squareName;

            return (
              <div
                key={squareName}
                onClick={() => handleSquareClick(squareName)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, squareName)}
                className={`square ${isDark ? 'dark' : 'light'} ${
                  isSelected ? 'selected' : ''
                } ${isLastMoveFrom || isLastMoveTo ? 'last-move' : ''} ${
                  isKingInCheck ? 'in-check' : ''
                }`}
                data-square={squareName}
              >
                {/* Coordinate labels */}
                {fileIdx === (orientation === 'white' ? 0 : 7) && (
                  <span className="coord-rank">{rankIdx + 1}</span>
                )}
                {rankIdx === (orientation === 'white' ? 0 : 7) && (
                  <span className="coord-file">{String.fromCharCode(97 + fileIdx)}</span>
                )}

                {/* Piece representation with drag-and-drop */}
                {piece && (
                  <div
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, squareName)}
                    className="piece-box"
                  >
                    <ChessPiece type={piece as any} />
                  </div>
                )}

                {/* Legal move destination indicator */}
                {isLegalDest && !piece && (
                  <div className="legal-dot-marker" />
                )}
                {isLegalDest && piece && (
                  <div className="legal-capture-marker" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Move & Threat Arrows */}
      {showArrows && (
        <BoardArrows
          bestMove={bestMove}
          lastMove={lastMove}
          threatMove={threatMove}
          orientation={orientation}
        />
      )}

      {/* Pawn Promotion Dialog Modal */}
      {pendingPromotion && (
        <div className="promotion-backdrop">
          <div className="promotion-card">
            <h3>Pawn Promotion</h3>
            <p>Choose promotion piece</p>

            <div className="promotion-grid">
              {(['q', 'r', 'b', 'n'] as const).map((pType) => {
                const promoChar = sideToMove === 'white' ? pType.toUpperCase() : pType;
                return (
                  <button
                    key={pType}
                    onClick={() => completePromotion(pType)}
                    className="promo-piece-btn"
                  >
                    <ChessPiece type={promoChar as any} />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPendingPromotion(null)}
              className="promo-cancel-btn"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
