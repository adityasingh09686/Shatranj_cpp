import { Router, Request, Response } from 'express';
import { CppChessEngine } from './cppEngine';
import { StockfishUCI } from './stockfish';
import { GameAnalysisPipeline } from './analysis';
import { PostGameAnalysisReport } from './types';

export function createRouter(
  cppEngine: CppChessEngine,
  stockfish: StockfishUCI,
  pipeline: GameAnalysisPipeline
): Router {
  const router = Router();
  const analysisStore = new Map<string, {
    status: 'running' | 'completed' | 'error' | 'cancelled';
    progress?: { current: number; total: number };
    report?: PostGameAnalysisReport;
    error?: string;
  }>();

  // 1. Initialize new game
  router.post('/game/new', async (req: Request, res: Response) => {
    try {
      const { fen } = req.body || {};
      const state = await cppEngine.newGame(fen);
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || 'Failed to start new game' });
    }
  });

  // 2. Retrieve authoritative game state
  router.get('/game/state', async (_req: Request, res: Response) => {
    try {
      const state = await cppEngine.getState();
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || 'Failed to retrieve game state' });
    }
  });

  // 3. Make human move
  router.post('/game/move', async (req: Request, res: Response) => {
    try {
      const { move } = req.body || {};
      if (!move || typeof move !== 'string') {
        return res.status(400).json({ ok: false, error: 'Missing move parameter' });
      }
      const state = await cppEngine.makeMove(move);
      if (!state.ok) {
        return res.status(400).json(state);
      }
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || 'Failed to process move' });
    }
  });

  // 4. Request custom C++ Minimax AI move
  router.post('/game/ai-move', async (req: Request, res: Response) => {
    try {
      const { depth } = req.body || {};
      const searchDepth = Math.max(1, Math.min(6, parseInt(depth, 10) || 3));
      const state = await cppEngine.makeAIMove(searchDepth);
      if (!state.ok) {
        return res.status(400).json(state);
      }
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || 'Failed to make AI move' });
    }
  });

  // 5. Undo move
  router.post('/game/undo', async (_req: Request, res: Response) => {
    try {
      const state = await cppEngine.undo();
      res.json(state);
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || 'Failed to undo move' });
    }
  });

  // 6. Stockfish real-time evaluation
  router.post('/stockfish/eval', async (req: Request, res: Response) => {
    try {
      const { fen, depth } = req.body || {};
      if (!fen) {
        return res.status(400).json({ ok: false, error: 'Missing fen parameter' });
      }
      const searchDepth = Math.max(1, Math.min(20, parseInt(depth, 10) || 12));
      const analysis = await stockfish.analyzePosition(fen, searchDepth);
      res.json({ ok: true, analysis });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || 'Stockfish evaluation failed' });
    }
  });

  // 7. Stockfish engine status
  router.get('/stockfish/status', (_req: Request, res: Response) => {
    try {
      const status = stockfish.getStatus();
      res.json({ ok: true, status });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // 8. Start post-game analysis
  router.post('/stockfish/analyze-game', async (req: Request, res: Response) => {
    try {
      const { historyUCI, historySAN, depth } = req.body || {};
      let uciList: string[] = historyUCI;
      let sanList: string[] = historySAN;

      if (!Array.isArray(uciList) || uciList.length === 0) {
        // Fall back to current game history from C++ engine
        const currState = await cppEngine.getState();
        uciList = currState.historyUCI || [];
        sanList = currState.historySAN || [];
      }

      if (uciList.length === 0) {
        return res.status(400).json({ ok: false, error: 'No moves to analyze' });
      }

      const analysisId = 'analysis_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const searchDepth = Math.max(6, Math.min(16, parseInt(depth, 10) || 10));

      analysisStore.set(analysisId, {
        status: 'running',
        progress: { current: 0, total: uciList.length }
      });

      // Run pipeline asynchronously in background
      pipeline.analyzeGame(
        analysisId,
        uciList,
        sanList,
        searchDepth,
        (current, total) => {
          const entry = analysisStore.get(analysisId);
          if (entry && entry.status === 'running') {
            entry.progress = { current, total };
          }
        }
      ).then((report) => {
        analysisStore.set(analysisId, {
          status: 'completed',
          report
        });
      }).catch((err) => {
        analysisStore.set(analysisId, {
          status: 'error',
          error: err.message || 'Analysis failed'
        });
      });

      res.json({ ok: true, analysisId, totalPlies: uciList.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message || 'Failed to start game analysis' });
    }
  });

  // 9. Check post-game analysis status
  router.get('/stockfish/analysis-status/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const entry = analysisStore.get(id);
    if (!entry) {
      return res.status(404).json({ ok: false, error: 'Analysis ID not found' });
    }
    res.json({ ok: true, ...entry });
  });

  // 10. Cancel post-game analysis
  router.post('/stockfish/cancel-analysis/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    pipeline.cancel(id);
    const entry = analysisStore.get(id);
    if (entry) {
      entry.status = 'cancelled';
    }
    res.json({ ok: true, message: 'Analysis cancellation requested' });
  });

  return router;
}
