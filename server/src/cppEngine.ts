import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import readline from 'readline';
import { GameStateResponse } from './types';

interface PendingCommand {
  cmd: string;
  resolve: (res: GameStateResponse) => void;
  reject: (err: Error) => void;
  timeout: NodeJS.Timeout;
}

export class CppChessEngine {
  private process: ChildProcessWithoutNullStreams | null = null;
  private queue: PendingCommand[] = [];
  private isProcessing = false;
  private binaryPath: string;

  constructor() {
    this.binaryPath = path.resolve(__dirname, '../../chess.exe');
    this.spawnProcess();
  }

  private spawnProcess() {
    try {
      this.process = spawn(this.binaryPath, ['--api'], {
        cwd: path.resolve(__dirname, '../..')
      });

      const rl = readline.createInterface({
        input: this.process.stdout,
        terminal: false
      });

      rl.on('line', (line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        this.handleResponseLine(trimmed);
      });

      this.process.stderr.on('data', (errData) => {
        console.error('[C++ Engine Stderr]:', errData.toString());
      });

      this.process.on('close', (code) => {
        console.warn(`[C++ Engine] Process closed with code ${code}`);
        this.process = null;
        // Reject any in-flight commands
        while (this.queue.length > 0) {
          const item = this.queue.shift();
          if (item) {
            clearTimeout(item.timeout);
            item.reject(new Error(`C++ Engine terminated with code ${code}`));
          }
        }
      });

      this.process.on('error', (err) => {
        console.error('[C++ Engine] Spawn error:', err);
      });
    } catch (e) {
      console.error('[C++ Engine] Exception during spawn:', e);
    }
  }

  private ensureProcess(): boolean {
    if (!this.process || this.process.killed) {
      this.spawnProcess();
    }
    return !!this.process;
  }

  private handleResponseLine(line: string) {
    if (this.queue.length === 0) return;

    try {
      const parsed = JSON.parse(line) as GameStateResponse;
      const current = this.queue.shift();
      if (current) {
        clearTimeout(current.timeout);
        current.resolve(parsed);
      }
    } catch (err) {
      console.error('[C++ Engine] Failed to parse engine JSON:', line, err);
      const current = this.queue.shift();
      if (current) {
        clearTimeout(current.timeout);
        current.reject(new Error(`Invalid JSON response: ${line}`));
      }
    }

    this.processNextInQueue();
  }

  private processNextInQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const current = this.queue[0];
    if (!this.ensureProcess()) {
      clearTimeout(current.timeout);
      this.queue.shift();
      current.reject(new Error('C++ engine is not running'));
      this.processNextInQueue();
      return;
    }

    this.process!.stdin.write(current.cmd + '\n');
  }

  public sendCommand(cmdObj: object, timeoutMs = 8000): Promise<GameStateResponse> {
    return new Promise((resolve, reject) => {
      const jsonStr = JSON.stringify(cmdObj);
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex(item => item.timeout === timer);
        if (idx !== -1) {
          const [removed] = this.queue.splice(idx, 1);
          removed.reject(new Error(`Command timed out after ${timeoutMs}ms: ${jsonStr}`));
          this.processNextInQueue();
        }
      }, timeoutMs);

      this.queue.push({
        cmd: jsonStr,
        resolve,
        reject,
        timeout: timer
      });

      if (!this.isProcessing) {
        this.processNextInQueue();
      }
    });
  }

  public async newGame(fen?: string): Promise<GameStateResponse> {
    if (fen) {
      return this.sendCommand({ cmd: 'load_fen', fen });
    }
    return this.sendCommand({ cmd: 'new' });
  }

  public async getState(): Promise<GameStateResponse> {
    return this.sendCommand({ cmd: 'state' });
  }

  public async makeMove(move: string): Promise<GameStateResponse> {
    return this.sendCommand({ cmd: 'move', move });
  }

  public async makeAIMove(depth: number): Promise<GameStateResponse> {
    // Custom C++ Minimax + Alpha-Beta AI
    return this.sendCommand({ cmd: 'ai_move', depth }, 15000);
  }

  public async undo(): Promise<GameStateResponse> {
    return this.sendCommand({ cmd: 'undo' });
  }

  public async getLegalMoves(): Promise<string[]> {
    const res = await this.sendCommand({ cmd: 'moves' });
    return (res as unknown as { ok: boolean; moves: string[] }).moves || [];
  }

  public async getEval(): Promise<number> {
    const res = await this.sendCommand({ cmd: 'eval' });
    return (res as unknown as { ok: boolean; score: number }).score || 0;
  }

  public async getPGN(): Promise<string> {
    const res = await this.sendCommand({ cmd: 'pgn' });
    return (res as unknown as { ok: boolean; pgn: string }).pgn || '';
  }

  public kill() {
    if (this.process && !this.process.killed) {
      this.process.stdin.write('quit\n');
      setTimeout(() => {
        if (this.process && !this.process.killed) {
          this.process.kill();
        }
      }, 500);
    }
  }
}
