import React, { useState, useMemo } from 'react';
import { ChessPiece } from '../utils/chessPieces';
import { SideColor } from '../types';

interface ChessboardProps {
  fen: string;
  orientation: SideColor;
  legalMoves: string[]; // e.g. ["e2e4", "g1f3", "e7e8q"]
  lastMove?: { from: string; to: string };
  inCheck: boolean;
  sideToMove: SideColor;
  disabled?: boolean;
  onMove: (moveUCI: string) => void;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  orientation,
  legalMoves,
  lastMove,
  inCheck,
  sideToMove,
  disabled = false,
  onMove
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
    <div className="chessboard-container relative select-none">
      <div className="chessboard-wrapper grid grid-cols-8 shadow-2xl rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900/90 aspect-square w-full max-w-[560px]">
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
                className={`square relative flex items-center justify-center transition-colors duration-150 cursor-pointer ${
                  isDark ? 'bg-[#769656]' : 'bg-[#eeeed2]'
                } ${isSelected ? '!bg-amber-400/80 shadow-inner' : ''} ${
                  isLastMoveFrom || isLastMoveTo ? '!bg-emerald-400/50' : ''
                } ${isKingInCheck ? '!bg-red-500/80 animate-pulse' : ''}`}
                data-square={squareName}
              >
                {/* Coordinate labels */}
                {fileIdx === (orientation === 'white' ? 0 : 7) && (
                  <span
                    className={`coordinate-rank absolute top-1 left-1.5 text-[10px] font-bold pointer-events-none select-none ${
                      isDark ? 'text-[#eeeed2]/80' : 'text-[#769656]/90'
                    }`}
                  >
                    {rankIdx + 1}
                  </span>
                )}
                {rankIdx === (orientation === 'white' ? 0 : 7) && (
                  <span
                    className={`coordinate-file absolute bottom-0.5 right-1.5 text-[10px] font-bold pointer-events-none select-none ${
                      isDark ? 'text-[#eeeed2]/80' : 'text-[#769656]/90'
                    }`}
                  >
                    {String.fromCharCode(97 + fileIdx)}
                  </span>
                )}

                {/* Piece representation with drag-and-drop */}
                {piece && (
                  <div
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, squareName)}
                    className="piece-wrapper w-[82%] h-[82%] flex items-center justify-center transition-transform hover:scale-105 active:scale-95 drop-shadow-md z-10"
                  >
                    <ChessPiece type={piece as any} />
                  </div>
                )}

                {/* Legal move destination indicator */}
                {isLegalDest && !piece && (
                  <div className="legal-dot absolute w-3.5 h-3.5 rounded-full bg-slate-900/35 pointer-events-none" />
                )}
                {isLegalDest && piece && (
                  <div className="legal-capture absolute inset-0 rounded-none border-4 border-slate-900/30 pointer-events-none" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pawn Promotion Dialog Modal */}
      {pendingPromotion && (
        <div className="promotion-overlay absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl p-4 animate-fade-in">
          <div className="promotion-dialog bg-slate-800 border border-slate-700/80 rounded-2xl p-5 shadow-2xl max-w-xs w-full text-center">
            <h3 className="text-lg font-bold text-slate-100 mb-1">Pawn Promotion</h3>
            <p className="text-xs text-slate-400 mb-4">Choose promotion piece</p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {(['q', 'r', 'b', 'n'] as const).map((pType) => {
                const promoChar = sideToMove === 'white' ? pType.toUpperCase() : pType;
                return (
                  <button
                    key={pType}
                    onClick={() => completePromotion(pType)}
                    className="promo-btn bg-slate-700 hover:bg-emerald-600/80 border border-slate-600 rounded-xl p-2.5 transition flex items-center justify-center aspect-square shadow"
                  >
                    <div className="w-10 h-10">
                      <ChessPiece type={promoChar as any} />
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPendingPromotion(null)}
              className="text-xs text-slate-400 hover:text-rose-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
