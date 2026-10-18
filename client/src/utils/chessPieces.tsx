import React from 'react';

export interface PieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k' | 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
  className?: string;
}

export const ChessPiece: React.FC<PieceProps> = ({ type, className = '' }) => {
  const isWhite = type === type.toUpperCase();
  const piece = type.toLowerCase();

  const whiteFill = '#f8fafc';
  const whiteStroke = '#334155';
  const blackFill = '#1e293b';
  const blackStroke = '#94a3b8';

  const fill = isWhite ? whiteFill : blackFill;
  const stroke = isWhite ? whiteStroke : blackStroke;
  const secondary = isWhite ? '#e2e8f0' : '#0f172a';

  switch (piece) {
    case 'p': // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'n': // Knight
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <path
            d="m 22,10 c 10.5,1 16.5,8 16,29 l -23,0 c 0,-9 10,-6.5 8,-21"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <path
            d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.042,-0.94 1.41,-3.04 0,-3 -1,0 0.19,1.23 -1,2 -1,0 -4.003,1 -4,-4 0,-2 6,-12 6,-12 0,0 1.89,-1.9 2,-3.5 -0.73,-0.994 -0.5,-2 -0.5,-3 1,-1 3,2.5 3,2.5 z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.5"
          />
          <circle cx="15" cy="14" r="1.5" fill={isWhite ? '#475569' : '#cbd5e1'} />
        </svg>
      );

    case 'b': // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 9,36 c 3.39,-0.97 10.11,0.43 13.5,-2 3.39,2.43 10.11,1.03 13.5,2 0,0 1.65,0.54 3,2 -0.68,0.97 -1.65,0.99 -3,1 -3.39,-0.21 -10.11,1.72 -13.5,-1 -3.39,2.72 -10.11,0.79 -13.5,1 -1.35,-0.01 -2.32,-0.03 -3,-1 1.35,-1.46 3,-2 3,-2 z" />
            <path d="m 15,32 c 2.5,2.5 12.5,2.5 15,0 0.5,-1.5 0,-2 0,-2 0,-2.5 -2.5,-4 -2.5,-4 5.5,-1.5 6,-11.5 -5,-15.5 -11,4 -10.5,14 -5,15.5 0,0 -2.5,1.5 -2.5,4 0,0 -0.5,0.5 0,2 z" />
            <path d="m 25,8 a 2.5,2.5 0 1 1 -5,0 2.5,2.5 0 1 1 5,0 z" />
            <path d="m 17.5,26 h 10" stroke={secondary} strokeWidth="1.2" />
            <path d="m 22.5,21 v 10" stroke={secondary} strokeWidth="1.2" />
          </g>
        </svg>
      );

    case 'r': // Rook
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 9,39 h 27 v -3 H 9 z" />
            <path d="m 12,36 v -4 h 21 v 4 z" />
            <path d="m 11,14 h 23 v 4 H 11 z" />
            <path d="m 12,18 2,14 h 17 l 2,-14 z" />
            <path d="m 9,9 v 5 h 5 V 9 h 4 v 3 h 5 V 9 h 4 v 3 h 5 V 9 z" />
          </g>
        </svg>
      );

    case 'q': // Queen
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 9,26 c 8.5,-1.5 21,-1.5 27,0 l 2,-12 -7,11 -4,-15 -4.5,15 -4.5,-15 -4,15 -7,-11 2,12 z" />
            <path d="m 9,26 c 0,2 1.5,2 2.5,4 1,1.5 1,1 0.5,3.5 -1.5,1 -1.5,2.5 -1.5,2.5 -1.5,1.5 0.5,2.5 0.5,2.5 6.5,1 16.5,1 23,0 0,0 1.5,-1 0.5,-2.5 0,0 0,-1.5 -1.5,-2.5 -0.5,-2.5 -0.5,-2 0.5,-3.5 1,-2 2.5,-2 2.5,-4 -8.5,-1.5 -18.5,-1.5 -27,0 z" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
          </g>
        </svg>
      );

    case 'k': // King
      return (
        <svg viewBox="0 0 45 45" className={className} width="100%" height="100%">
          <g fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinecap="round">
            <path d="m 22.5,11.63 v 6 M 20,13.5 h 5" stroke={stroke} strokeWidth="1.5" />
            <path d="m 22.5,25 c 0,0 4.5,-7.5 3,-10.5 0,0 -1,-2.5 -3,-2.5 -2,0 -3,2.5 -3,2.5 -1.5,3 3,10.5 3,10.5" />
            <path d="m 11.5,37 c 5.5,3.5 15.5,3.5 21,0 v -7 c 0,0 9,-4.5 6,-10.5 -4,-1 -6,2 -6,2 0,0 -2,-3 -6,-3 -4,0 -6,3 -6,3 0,0 -2,-3 -6,-2 -3,6 6,10.5 6,10.5 v 7 z" />
            <path d="m 11.5,30 c 5.5,-2 15.5,-2 21,0 m -21,3.5 c 5.5,-2 15.5,-2 21,0 m -21,3.5 c 5.5,-2 15.5,-2 21,0" stroke={secondary} strokeWidth="1.2" />
          </g>
        </svg>
      );

    default:
      return null;
  }
};
