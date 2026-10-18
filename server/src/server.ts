import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { CppChessEngine } from './cppEngine';
import { StockfishUCI } from './stockfish';
import { GameAnalysisPipeline } from './analysis';
import { createRouter } from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Initialize engine processes
console.log('[Server] Starting C++ Chess Engine...');
const cppEngine = new CppChessEngine();

console.log('[Server] Starting Stockfish UCI Service...');
const stockfish = new StockfishUCI();

const pipeline = new GameAnalysisPipeline(cppEngine, stockfish);

// Mount API routes
app.use('/api', createRouter(cppEngine, stockfish, pipeline));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    stockfish: stockfish.getStatus(),
    timestamp: new Date().toISOString()
  });
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Shatranj Chess Backend API running on port ${PORT}`);
  console.log(`  API base URL: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});

// Process cleanup
function shutdown() {
  console.log('\n[Server] Shutting down cleanly...');
  server.close(() => {
    cppEngine.kill();
    stockfish.kill();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
