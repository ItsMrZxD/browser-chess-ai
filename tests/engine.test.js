// Unit tests for the chess engine inside index.html.
//
// Zero dependencies: the inline <script> is extracted from the page and
// evaluated in a Node `vm` sandbox with just enough fake DOM for the
// top-level code to run. The rule functions are pure (they take the board
// and state as arguments), so they can then be exercised directly.
//
// Run with: node tests/engine.test.js
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

// --- load the engine --------------------------------------------------------
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) {
  console.error("FAIL: could not find the inline <script> in index.html");
  process.exit(1);
}

const noop = () => {};
function fakeElement() {
  return {
    addEventListener: noop, removeEventListener: noop, appendChild: noop,
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    style: {}, dataset: {}, innerHTML: "", textContent: "", value: "",
    checked: false, disabled: false, setAttribute: noop, focus: noop,
    querySelector: () => null, querySelectorAll: () => [],
  };
}
const sandbox = {
  console,
  localStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  document: {
    addEventListener: noop,
    getElementById: () => fakeElement(),
    querySelector: () => fakeElement(),
    querySelectorAll: () => [],
    createElement: () => fakeElement(),
    body: fakeElement(),
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

let initError = null;
try {
  vm.runInContext(match[1], sandbox, { filename: "index.html <script>" });
} catch (err) {
  // The UI wiring may hit something the fake DOM doesn't cover. Function
  // declarations are hoisted before any of that runs, so the engine is
  // still available; keep the error around for the diagnostics below.
  initError = err;
}
if (initError) {
  console.log(`note: page script threw during UI init (harmless outside a browser): ${initError.message}`);
}

const ENGINE_FNS = ["initialBoard", "legalMovesAt", "boardAfter", "computeStatus",
                    "positionKey", "isInsufficientMaterial"];
for (const name of ENGINE_FNS) {
  if (typeof sandbox[name] !== "function") {
    console.error(`FAIL: engine function ${name}() not found after evaluating the page script`);
    process.exit(1);
  }
}
const { initialBoard, legalMovesAt, boardAfter, computeStatus,
        positionKey, isInsufficientMaterial } = sandbox;

// --- tiny harness ------------------------------------------------------------
let checks = 0, failures = 0;
function check(desc, cond) {
  checks++;
  if (!cond) { failures++; console.error("FAIL: " + desc); }
}

// --- board helpers -----------------------------------------------------------
// Rows: 0 = rank 8 (Black's home), 7 = rank 1 (White's home). Cols: 0 = a file.
const CR = () => ({ w: { k: true, q: true }, b: { k: true, q: true } });
const NO_CR = () => ({ w: { k: false, q: false }, b: { k: false, q: false } });
function emptyBoard() { return Array.from({ length: 8 }, () => Array(8).fill(null)); }
function put(board, r, c, type, color) { board[r][c] = { type, color }; return board; }
function movesTo(moves, r, c) { return moves.filter(m => m.to.r === r && m.to.c === c); }
function allMoves(board, color, castling, enPassant) {
  const out = [];
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.color === color) out.push(...legalMovesAt(board, r, c, castling, enPassant));
    }
  return out;
}

// --- starting position ---------------------------------------------------------
{
  const b = initialBoard();
  check("initial position has 20 legal moves for White", allMoves(b, "w", CR(), null).length === 20);
  check("initial position has 20 legal moves for Black", allMoves(b, "b", CR(), null).length === 20);
  check("initial position is 'playing'", computeStatus(b, "w", CR(), null) === "playing");
  check("initial position fingerprint matches", positionKey(b, "w", CR(), null) ===
    "rnbqkbnr/pppppppp/......../......../......../......../PPPPPPPP/RNBQKBNR/ w KQkq -");
  check("knight on b1 has 2 moves", legalMovesAt(b, 7, 1, CR(), null).length === 2);
  check("pawn on e2 has 2 moves", legalMovesAt(b, 6, 4, CR(), null).length === 2);
  check("rook on a1 has no moves yet", legalMovesAt(b, 7, 0, CR(), null).length === 0);
}

// --- en passant ----------------------------------------------------------------
{
  const b = emptyBoard();
  put(b, 7, 4, "k", "w"); put(b, 0, 4, "k", "b");
  put(b, 3, 4, "p", "w");          // white pawn on e5
  put(b, 3, 3, "p", "b");          // black pawn on d5, just double-pushed
  const ep = { r: 2, c: 3 };       // the d6 square it passed over
  const cap = movesTo(legalMovesAt(b, 3, 4, NO_CR(), ep), 2, 3);
  check("en passant capture is offered", cap.length === 1 && !!cap[0].flags.enPassant);
  if (cap.length === 1) {
    const after = boardAfter(b, cap[0]);
    check("en passant removes the passed pawn",
      after[3][3] === null && after[2][3] && after[2][3].color === "w");
  }
}

// --- castling --------------------------------------------------------------------
{
  const b = emptyBoard();
  put(b, 7, 4, "k", "w"); put(b, 7, 7, "r", "w"); put(b, 0, 4, "k", "b");
  const oo = movesTo(legalMovesAt(b, 7, 4, CR(), null), 7, 6).filter(m => m.flags.castle === "k");
  check("kingside castling is offered", oo.length === 1);
  if (oo.length === 1) {
    const after = boardAfter(b, oo[0]);
    check("castling brings the rook to f1",
      after[7][5] && after[7][5].type === "r" && after[7][7] === null);
  }
  put(b, 0, 5, "r", "b");          // black rook eyeing f1
  check("castling through an attacked square is forbidden",
    movesTo(legalMovesAt(b, 7, 4, CR(), null), 7, 6).length === 0);
}

// --- game endings ------------------------------------------------------------------
{
  const mate = emptyBoard();       // classic back-rank mate
  put(mate, 0, 7, "k", "b"); put(mate, 1, 6, "p", "b"); put(mate, 1, 7, "p", "b");
  put(mate, 0, 0, "r", "w"); put(mate, 7, 4, "k", "w");
  check("back-rank mate is 'checkmate'", computeStatus(mate, "b", NO_CR(), null) === "checkmate");

  const stale = emptyBoard();      // cornered king, not in check, nowhere to go
  put(stale, 0, 0, "k", "b"); put(stale, 1, 2, "q", "w"); put(stale, 7, 7, "k", "w");
  check("trapped but unchecked king is 'stalemate'", computeStatus(stale, "b", NO_CR(), null) === "stalemate");

  const checkPos = emptyBoard();   // rook gives check, king can step aside
  put(checkPos, 0, 4, "k", "b"); put(checkPos, 7, 4, "k", "w"); put(checkPos, 4, 4, "r", "w");
  check("attacked king with escapes is 'check'", computeStatus(checkPos, "b", NO_CR(), null) === "check");
}

// --- promotion --------------------------------------------------------------------
{
  const b = emptyBoard();
  put(b, 1, 0, "p", "w"); put(b, 7, 4, "k", "w"); put(b, 0, 4, "k", "b");
  const promo = movesTo(legalMovesAt(b, 1, 0, NO_CR(), null), 0, 0);
  check("pawn reaching the last rank is flagged as promotion",
    promo.length === 1 && !!promo[0].flags.promotion);
  if (promo.length === 1) {
    check("promotion defaults to a queen",
      boardAfter(b, promo[0])[0][0].type === "q");
    const knight = Object.assign({}, promo[0], { promoteTo: "n" });
    check("underpromotion to a knight works",
      boardAfter(b, knight)[0][0].type === "n");
  }
}

// --- insufficient material -----------------------------------------------------------
{
  const kk = put(put(emptyBoard(), 0, 4, "k", "b"), 7, 4, "k", "w");
  check("K vs K is insufficient material", isInsufficientMaterial(kk) === true);

  const kbk = put(put(put(emptyBoard(), 0, 4, "k", "b"), 7, 4, "k", "w"), 4, 4, "b", "w");
  check("K+B vs K is insufficient material", isInsufficientMaterial(kbk) === true);

  const kqk = put(put(put(emptyBoard(), 0, 4, "k", "b"), 7, 4, "k", "w"), 4, 4, "q", "w");
  check("K+Q vs K is sufficient material", isInsufficientMaterial(kqk) === false);
}

// --- summary -----------------------------------------------------------------------
console.log(`${checks} checks, ${failures} failure(s)`);
process.exit(failures === 0 ? 0 : 1);
