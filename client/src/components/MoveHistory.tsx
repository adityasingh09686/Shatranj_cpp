import React, { useEffect, useRef } from 'react';
import { ChevronFirst, ChevronLeft, ChevronRight, ChevronLast, Play } from 'lucide-react';

interface MoveHistoryProps {
  historySAN: string[];
  currentPly: number; // 0 = startpos, 1 = after 1st move, etc.
  onSelectPly: (ply: number) => void;
  isReviewing: boolean;
  onResumeLive: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  historySAN,
  currentPly,
  onSelectPly,
  isReviewing,
  onResumeLive
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Group plies into moves { moveNumber, white, black, whitePly, blackPly }
  const movePairs = React.useMemo(() => {
    const pairs: { moveNum: number; white: string; black?: string; whitePly: number; blackPly?: number }[] = [];
    for (let i = 0; i < historySAN.length; i += 2) {
      pairs.push({
        moveNum: Math.floor(i / 2) + 1,
        white: historySAN[i],
        whitePly: i + 1,
        black: historySAN[i + 1],
        blackPly: i + 1 < historySAN.length ? i + 2 : undefined
      });
    }
    return pairs;
  }, [historySAN]);

  // Auto-scroll to current move
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [historySAN.length]);

  return (
    <div className="move-history-card">
      <div className="history-header">
        <h3>Move History</h3>
        <span>
          {historySAN.length} {historySAN.length === 1 ? 'ply' : 'plies'}
        </span>
      </div>

      {/* Historical Review Warning Banner */}
      {isReviewing && (
        <div className="review-banner">
          <span>
            Reviewing Move {currentPly}
          </span>
          <button
            onClick={onResumeLive}
            className="btn-live-resume"
          >
            <Play size={12} fill="currentColor" /> Live Game
          </button>
        </div>
      )}

      {/* Move List Table */}
      <div
        ref={scrollRef}
        className="move-list-scroll"
      >
        {movePairs.length === 0 ? (
          <div className="empty-moves">
            No moves yet. Start playing!
          </div>
        ) : (
          movePairs.map((pair) => {
            const isWhiteActive = currentPly === pair.whitePly;
            const isBlackActive = currentPly === pair.blackPly;

            return (
              <div
                key={pair.moveNum}
                className="move-row"
              >
                <span className="move-num">
                  {pair.moveNum}.
                </span>

                <button
                  onClick={() => onSelectPly(pair.whitePly)}
                  className={`move-btn ${isWhiteActive ? 'active' : ''}`}
                >
                  {pair.white}
                </button>

                {pair.black ? (
                  <button
                    onClick={() => onSelectPly(pair.blackPly!)}
                    className={`move-btn ${isBlackActive ? 'active' : ''}`}
                  >
                    {pair.black}
                  </button>
                ) : (
                  <span />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="history-stepper">
        <button
          onClick={() => onSelectPly(0)}
          disabled={currentPly === 0}
          title="Beginning"
          className="btn-stepper"
        >
          <ChevronFirst size={16} />
        </button>
        <button
          onClick={() => onSelectPly(Math.max(0, currentPly - 1))}
          disabled={currentPly === 0}
          title="Previous move"
          className="btn-stepper"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onSelectPly(Math.min(historySAN.length, currentPly + 1))}
          disabled={currentPly === historySAN.length}
          title="Next move"
          className="btn-stepper"
        >
          <ChevronRight size={16} />
        </button>
        <button
          onClick={() => onSelectPly(historySAN.length)}
          disabled={currentPly === historySAN.length}
          title="Latest move"
          className="btn-stepper"
        >
          <ChevronLast size={16} />
        </button>
      </div>
    </div>
  );
};
