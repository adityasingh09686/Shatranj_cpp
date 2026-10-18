import assert from 'assert';
import { CppChessEngine } from '../src/cppEngine';
import { StockfishUCI } from '../src/stockfish';
import { GameAnalysisPipeline } from '../src/analysis';

async function runTests() {
  console.log('=== Running Backend & Engine Integration Tests ===\n');

  // Test 1: C++ Engine Initialization & Starting Position
  console.log('[1/4] Testing C++ Engine new game & state...');
  const cppEngine = new CppChessEngine();
  const state = await cppEngine.newGame();
  assert.strictEqual(state.ok, true);
  assert.strictEqual(state.sideToMove, 'white');
  assert.strictEqual(state.fen, 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  assert.strictEqual(state.legalMoves.length, 20);
  console.log('  -> PASS: C++ engine initialized startpos with 20 legal moves');

  // Test 2: Move execution and custom AI move
  console.log('[2/4] Testing move submission and custom C++ AI reply...');
  const moveRes = await cppEngine.makeMove('e2e4');
  assert.strictEqual(moveRes.ok, true);
  assert.strictEqual(moveRes.sideToMove, 'black');
  assert.strictEqual(moveRes.lastMoveSAN, 'e4');

  const aiRes = await cppEngine.makeAIMove(2);
  assert.strictEqual(aiRes.ok, true);
  assert.strictEqual(aiRes.sideToMove, 'white');
  assert.ok(aiRes.aiMove, 'AI returned a valid move');
  assert.ok(aiRes.nodesEvaluated && aiRes.nodesEvaluated > 0, 'AI evaluated nodes');
  console.log(`  -> PASS: Custom AI played ${aiRes.aiMove} (${aiRes.aiMoveSAN}) [${aiRes.nodesEvaluated} nodes]`);

  // Test 3: Stockfish UCI Integration & Real-time Evaluation
  console.log('[3/4] Testing Stockfish UCI real-time position evaluation...');
  const stockfish = new StockfishUCI();
  // Wait a moment for readyok
  await new Promise(r => setTimeout(r, 600));

  const sfAnalysis = await stockfish.analyzePosition(moveRes.fen, 10);
  assert.ok(sfAnalysis.score, 'Stockfish returned score');
  assert.ok(sfAnalysis.bestMove, 'Stockfish returned bestMove');
  console.log(`  -> PASS: Stockfish eval for e4: score=${sfAnalysis.score.formatted}, bestmove=${sfAnalysis.bestMove}, depth=${sfAnalysis.depth}`);
  if (sfAnalysis.wdl) {
    console.log(`  -> PASS: WDL estimates: White=${sfAnalysis.wdl.whiteWin}%, Draw=${sfAnalysis.wdl.draw}%, Black=${sfAnalysis.wdl.blackWin}%`);
  }

  // Test 4: Post-game analysis pipeline
  console.log('[4/4] Testing Post-Game Analysis Pipeline...');
  const pipeline = new GameAnalysisPipeline(cppEngine, stockfish);
  const testUCI = ['e2e4', 'e7e5', 'g1f3', 'b8c6'];
  const testSAN = ['e4', 'e5', 'Nf3', 'Nc6'];
  const report = await pipeline.analyzeGame('test_run_1', testUCI, testSAN, 8);

  assert.strictEqual(report.totalPlies, 4);
  assert.strictEqual(report.moves.length, 4);
  assert.ok(report.whiteAccuracy >= 0 && report.whiteAccuracy <= 100);
  assert.ok(report.blackAccuracy >= 0 && report.blackAccuracy <= 100);
  console.log(`  -> PASS: Analysis completed with White Acc: ${report.whiteAccuracy}%, Black Acc: ${report.blackAccuracy}%`);
  for (const m of report.moves) {
    console.log(`     Ply ${m.ply} (${m.side} ${m.san}): [${m.classification}] loss=${m.scoreLoss}cp, best=${m.bestEngineMove}`);
  }

  // Cleanup
  cppEngine.kill();
  stockfish.kill();
  console.log('\n=== All Backend Integration Tests Passed Successfully! ===\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
