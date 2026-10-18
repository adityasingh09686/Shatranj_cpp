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
    <div className="move-history-card bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col h-full max-h-[460px]">
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-700/60">
        <h3 className="font-bold text-sm tracking-wide text-slate-200">Move History</h3>
        <span className="text-xs font-mono text-slate-400">
          {historySAN.length} {historySAN.length === 1 ? 'ply' : 'plies'}
        </span>
      </div>

      {/* Historical Review Warning Banner */}
      {isReviewing && (
        <div className="mb-3 px-3 py-2 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-center justify-between animate-fade-in">
          <span className="text-xs font-medium text-amber-300">
            Reviewing Move {currentPly}
          </span>
          <button
            onClick={onResumeLive}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition"
          >
            <Play className="w-3 h-3 fill-current" /> Live Game
          </button>
        </div>
      )}

      {/* Move List Table */}
      <div
        ref={scrollRef}
        className="move-list flex-1 overflow-y-auto space-y-0.5 pr-1 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-700"
      >
        {movePairs.length === 0 ? (
          <div className="text-slate-500 text-center py-8 italic text-xs">
            No moves yet. Start playing!
          </div>
        ) : (
          movePairs.map((pair) => {
            const isWhiteActive = currentPly === pair.whitePly;
            const isBlackActive = currentPly === pair.blackPly;

            return (
              <div
                key={pair.moveNum}
                className="grid grid-cols-[38px_1fr_1fr] items-center rounded-lg hover:bg-slate-700/30 transition-colors"
              >
                <span className="text-slate-500 pl-2 font-medium">
                  {pair.moveNum}.
                </span>

                <button
                  onClick={() => onSelectPly(pair.whitePly)}
                  className={`text-left px-2 py-1.5 rounded font-semibold transition ${
                    isWhiteActive
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-200 hover:text-white'
                  }`}
                >
                  {pair.white}
                </button>

                {pair.black ? (
                  <button
                    onClick={() => onSelectPly(pair.blackPly!)}
                    className={`text-left px-2 py-1.5 rounded font-semibold transition ${
                      isBlackActive
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-200 hover:text-white'
                    }`}
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
      <div className="flex items-center justify-center gap-1 pt-3 mt-2 border-t border-slate-700/60">
        <button
          onClick={() => onSelectPly(0)}
          disabled={currentPly === 0}
          title="Beginning"
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-700/50 text-slate-300 transition"
        >
          <ChevronFirst className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectPly(Math.max(0, currentPly - 1))}
          disabled={currentPly === 0}
          title="Previous move"
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-700/50 text-slate-300 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectPly(Math.min(historySAN.length, currentPly + 1))}
          disabled={currentPly === historySAN.length}
          title="Next move"
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-700/50 text-slate-300 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onSelectPly(historySAN.length)}
          disabled={currentPly === historySAN.length}
          title="Latest move"
          className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-700/50 text-slate-300 transition"
        >
          <ChevronLast className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
