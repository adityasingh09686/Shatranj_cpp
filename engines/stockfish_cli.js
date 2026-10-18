#!/usr/bin/env node
const readline = require('readline');
const path = require('path');

process.chdir(__dirname);
delete global.fetch;

global.postMessage = (msg) => {
  process.stdout.write(msg + '\n');
};

require('./stockfish.wasm.js');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (trimmed === 'quit') {
    process.exit(0);
  }
  if (global.onmessage) {
    global.onmessage({ data: trimmed });
  }
});

process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
