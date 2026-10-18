import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import fs from 'fs';
import readline from 'readline';
import { EvaluationScore, PositionAnalysis, SideColor, WDLEstimate } from './types';

export class StockfishUCI {
  private process: ChildProcessWithoutNullStreams | null = null;
  private isReady = false;
  private supportsWDL = false;
  private engineVersion = 'Stockfish';
  private currentRequestId = 0;
  private activeSearchResolve: ((res: PositionAnalysis) => void) | null = null;
  private activeSearchReject: ((err: Error) => void) | null = null;
  private currentAnalysis: Partial<PositionAnalysis> = {};
  private currentSideToMove: SideColor = 'white';

  constructor() {
    this.initProcess();
  }

  private resolveEngineBinary(): { command: string; args: string[] } {
    const envPath = process.env.STOCKFISH_PATH;
    if (envPath && fs.existsSync(envPath)) {
      console.log(`[Stockfish] Using configured STOCKFISH_PATH: ${envPath}`);
      return { command: envPath, args: [] };
    }

    const defaultExe = path.resolve(__dirname, '../../engines/stockfish.exe');
    if (fs.existsSync(defaultExe)) {
      console.log(`[Stockfish] Using local executable: ${defaultExe}`);
      return { command: defaultExe, args: [] };
    }

    const bridgeScript = path.resolve(__dirname, '../../engines/stockfish_cli.js');
    if (fs.existsSync(bridgeScript)) {
      console.log(`[Stockfish] Using bundled Stockfish WASM bridge: ${bridgeScript}`);
      return { command: process.execPath, args: [bridgeScript] };
    }

    throw new Error('Stockfish engine not found. Please set STOCKFISH_PATH or place stockfish.exe in engines/.');
  }

  private initProcess() {
    try {
      const { command, args } = this.resolveEngineBinary();
      this.process = spawn(command, args, {
        cwd: path.resolve(__dirname, '../../engines')
      });

      const rl = readline.createInterface({
        input: this.process.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        this.parseLine(line.trim());
      });

      this.process.stderr.on('data', (data) => {
        console.error('[Stockfish Stderr]:', data.toString());
      });

      this.process.on('close', (code) => {
        console.warn(`[Stockfish] Engine process exited with code ${code}`);
        this.isReady = false;
        this.process = null;
      });

      // Send initial UCI handshake
      this.send('uci');
    } catch (err) {
      console.error('[Stockfish] Initialization error:', err);
    }
  }

  private send(cmd: string) {
    if (this.process && !this.process.killed) {
      this.process.stdin.write(cmd + '\n');
    }
  }

  private parseLine(line: string) {
    if (!line) return;

    if (line.startsWith('id name ')) {
      this.engineVersion = line.substring(8);
    }

    if (line.includes('UCI_ShowWDL')) {
      this.supportsWDL = true;
    }

    if (line === 'uciok') {
      if (this.supportsWDL) {
        this.send('setoption name UCI_ShowWDL value true');
      }
      this.send('isready');
    }

    if (line === 'readyok') {
      this.isReady = true;
      console.log(`[Stockfish] Engine ready: ${this.engineVersion}`);
    }

    // Parse info lines: e.g.
    // info depth 12 seldepth 18 multipv 1 score cp 35 wdl 450 320 230 nodes 54120 nps 120500 time 449 pv e2e4 e7e5 ...
    if (line.startsWith('info ') && line.includes('score ')) {
      this.parseInfoLine(line);
    }

    // Parse bestmove line: e.g. bestmove e2e4 ponder e7e5
    if (line.startsWith('bestmove ')) {
      const parts = line.split(' ');
      const bestMove = parts[1];
      if (this.currentAnalysis) {
        this.currentAnalysis.bestMove = bestMove;
      }
      if (this.activeSearchResolve && this.currentAnalysis) {
        const fullAnalysis: PositionAnalysis = {
          depth: this.currentAnalysis.depth || 0,
          seldepth: this.currentAnalysis.seldepth || 0,
          score: this.currentAnalysis.score || { type: 'cp', value: 0, formatted: '0.00' },
          wdl: this.currentAnalysis.wdl,
          nodes: this.currentAnalysis.nodes || 0,
          nps: this.currentAnalysis.nps || 0,
          time: this.currentAnalysis.time || 0,
          bestMove: bestMove || '0000',
          pv: this.currentAnalysis.pv || []
        };
        const resolve = this.activeSearchResolve;
        this.activeSearchResolve = null;
        this.activeSearchReject = null;
        resolve(fullAnalysis);
      }
    }
  }

  private parseInfoLine(line: string) {
    const tokens = line.split(/\s+/);
    let depth = 0;
    let seldepth = 0;
    let scoreType: 'cp' | 'mate' = 'cp';
    let rawScore = 0;
    let nodes = 0;
    let nps = 0;
    let time = 0;
    let pvIndex = -1;
    let wdl: WDLEstimate | undefined;

    for (let i = 0; i < tokens.length; ++i) {
      if (tokens[i] === 'depth' && i + 1 < tokens.length) {
        depth = parseInt(tokens[i + 1], 10);
      } else if (tokens[i] === 'seldepth' && i + 1 < tokens.length) {
        seldepth = parseInt(tokens[i + 1], 10);
      } else if (tokens[i] === 'score' && i + 2 < tokens.length) {
        const type = tokens[i + 1];
        const val = parseInt(tokens[i + 2], 10);
        if (type === 'cp') {
          scoreType = 'cp';
          rawScore = val;
        } else if (type === 'mate') {
          scoreType = 'mate';
          rawScore = val;
        }
      } else if (tokens[i] === 'nodes' && i + 1 < tokens.length) {
        nodes = parseInt(tokens[i + 1], 10);
      } else if (tokens[i] === 'nps' && i + 1 < tokens.length) {
        nps = parseInt(tokens[i + 1], 10);
      } else if (tokens[i] === 'time' && i + 1 < tokens.length) {
        time = parseInt(tokens[i + 1], 10);
      } else if (tokens[i] === 'wdl' && i + 3 < tokens.length) {
        const w = parseInt(tokens[i + 1], 10);
        const d = parseInt(tokens[i + 2], 10);
        const l = parseInt(tokens[i + 3], 10);
        const total = (w + d + l) || 1000;
        const pWin = Math.round((w / total) * 100);
        const pDraw = Math.round((d / total) * 100);
        const pLoss = Math.max(0, 100 - pWin - pDraw);

        // Normalize WDL to White perspective
        if (this.currentSideToMove === 'white') {
          wdl = { whiteWin: pWin, draw: pDraw, blackWin: pLoss };
        } else {
          wdl = { whiteWin: pLoss, draw: pDraw, blackWin: pWin };
        }
      } else if (tokens[i] === 'pv') {
        pvIndex = i + 1;
        break;
      }
    }

    // Normalize score to White perspective (positive = White better, negative = Black better)
    const normalizedScoreValue = (this.currentSideToMove === 'white') ? rawScore : -rawScore;
    let formatted = '0.00';

    if (scoreType === 'cp') {
      const pawns = normalizedScoreValue / 100;
      formatted = (pawns > 0 ? '+' : '') + pawns.toFixed(2);
    } else {
      formatted = (normalizedScoreValue > 0 ? '+' : '-') + 'M' + Math.abs(normalizedScoreValue);
    }

    const pv = pvIndex !== -1 ? tokens.slice(pvIndex) : [];

    // Synthesize WDL estimate from centipawns if engine doesn't report WDL
    if (!wdl && scoreType === 'cp') {
      // Standard Lichess / Chess.com win probability sigmoid:
      // winChance = 1 / (1 + 10^(-score / 400))
      const winProb = 1 / (1 + Math.pow(10, -normalizedScoreValue / 400));
      // Draw probability peaks at score 0
      const drawProb = 0.35 * Math.exp(-Math.pow(normalizedScoreValue / 300, 2));
      const effectiveWhiteWin = Math.max(0, Math.min(100, Math.round((winProb - drawProb / 2) * 100)));
      const effectiveDraw = Math.max(0, Math.min(100 - effectiveWhiteWin, Math.round(drawProb * 100)));
      const effectiveBlackWin = Math.max(0, 100 - effectiveWhiteWin - effectiveDraw);
      wdl = {
        whiteWin: effectiveWhiteWin,
        draw: effectiveDraw,
        blackWin: effectiveBlackWin
      };
    } else if (!wdl && scoreType === 'mate') {
      if (normalizedScoreValue > 0) {
        wdl = { whiteWin: 100, draw: 0, blackWin: 0 };
      } else {
        wdl = { whiteWin: 0, draw: 0, blackWin: 100 };
      }
    }

    this.currentAnalysis = {
      depth,
      seldepth,
      score: {
        type: scoreType,
        value: normalizedScoreValue,
        formatted
      },
      wdl,
      nodes,
      nps,
      time,
      pv
    };
  }

  public getStatus() {
    return {
      ready: this.isReady,
      version: this.engineVersion,
      supportsWDL: this.supportsWDL
    };
  }

  public stopSearch() {
    if (this.activeSearchReject) {
      const reject = this.activeSearchReject;
      this.activeSearchReject = null;
      this.activeSearchResolve = null;
      reject(new Error('Search cancelled'));
    }
    this.send('stop');
  }

  public analyzePosition(
    fen: string,
    depth = 12,
    movetime?: number
  ): Promise<PositionAnalysis> {
    return new Promise((resolve, reject) => {
      if (!this.process || this.process.killed) {
        return reject(new Error('Stockfish process is not running'));
      }

      // Determine side to move from FEN
      const parts = fen.trim().split(/\s+/);
      this.currentSideToMove = (parts[1] === 'b' || parts[1] === 'B') ? 'black' : 'white';

      // Cancel any ongoing search
      this.stopSearch();

      const requestId = ++this.currentRequestId;
      this.activeSearchResolve = (res: PositionAnalysis) => {
        if (requestId === this.currentRequestId) {
          resolve(res);
        }
      };
      this.activeSearchReject = reject;
      this.currentAnalysis = {};

      this.send(`position fen ${fen}`);
      if (movetime) {
        this.send(`go movetime ${movetime}`);
      } else {
        this.send(`go depth ${depth}`);
      }
    });
  }

  public kill() {
    if (this.process && !this.process.killed) {
      this.send('quit');
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill();
        }
      }, 500);
    }
  }
}
