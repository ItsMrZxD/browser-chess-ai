# Browser Chess AI

[![CI](https://github.com/ItsMrZxD/browser-chess-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsMrZxD/browser-chess-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**A complete browser chess game in a single self-contained HTML file — two-player
hot-seat plus a minimax AI opponent with alpha-beta pruning. Vanilla JavaScript,
no build step, no libraries, no server.**

Download `index.html`, double-click it, and play. The whole game — board
rendering, the rules engine, and the computer opponent — lives in that one file,
so there is nothing to install and nothing to configure. Useful if you want a
chess game you can drop onto any static host, or a compact, readable reference
implementation of legal-move generation and a minimax chess AI in plain
JavaScript.

## Features

**Game modes**

- **Two-player hot-seat** — both players share one screen and one keyboard
- **vs Computer** — choose your colour and difficulty before the game starts

**Complete rule enforcement**

- Castling (kingside and queenside, including through-check denial)
- En passant
- Pawn promotion, with a piece picker that defaults to queen
- Check, checkmate, and stalemate detection
- Threefold repetition, the 50-move rule, and insufficient material
  (K vs K, K+B vs K, K+N vs K, and same-coloured-bishop endings)
- Strict legality — you cannot move into check, leave your king in check, or
  move your opponent's pieces

**Interface**

- Click a piece to light up its legal destinations
- Captured pieces shown per side
- Settings panel that works mid-game without interrupting play

## Requirements

Any modern browser. That is the entire list — there is no build step, no
package manager, and no network access needed at runtime.

Running the test suite additionally needs [Node.js](https://nodejs.org).

## Running the game

```
Double-click index.html
```

Or open it from a browser's File → Open dialog, or serve the directory with any
static file server. Cloning is optional — a direct download of `index.html`
works just as well:

```bash
git clone https://github.com/ItsMrZxD/browser-chess-ai
cd browser-chess-ai
```

## How to play

1. Click **New Game** and pick a mode — Two Player or vs Computer.
2. In vs Computer mode, choose your colour and difficulty (Easy or Hard).
3. Click one of your pieces — its legal moves light up.
4. Click a highlighted square to move.
5. Use **⚙ Settings** at any time to change the board theme, flip the board, or
   adjust the AI's thinking delay, without interrupting the game.

## Settings

All settings apply immediately and can be changed mid-game.

| Setting | Options | Default |
|---|---|---|
| Board theme | Classic (green), Blue, Wood, Gray | Classic |
| Legal-move highlights | on / off | on |
| Coordinates | on / off | on |
| Last-move highlight | on / off | on |
| AI delay | Instant (0 ms), Fast (150 ms), Normal (400 ms), Slow (900 ms) | Normal |
| Flip board | on / off | off |

## How the AI works

The computer opponent has two difficulty levels, both driven by the same
legal-move generator the UI uses — so the AI can only ever play legal moves.

**Easy** is greedy. It takes the highest-value capture available, picking at
random between equally valuable ones, and otherwise plays a random legal move.

**Hard** is a depth-3 [minimax](https://en.wikipedia.org/wiki/Minimax) search
with [alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning).
Three details make that search practical in a browser:

- **Move ordering.** Captures (scored by victim value), en passant, and
  promotions are searched first. Alpha-beta prunes far more of the tree when
  good moves come first, so ordering is what keeps depth 3 responsive.
- **Root shuffling.** Legal moves are shuffled before ordering, so the engine
  varies between equally-scored moves instead of replaying the same game.
- **Depth-adjusted mate scores.** Checkmate is scored ±100000 offset by the
  remaining depth, so the engine prefers mate in one over mate in two.

Static evaluation is in centipawns from White's perspective and sums three
terms: **material** (P1 N3 B3 R5 Q9), **central control** from a weighted
centre table (applied to every piece except kings and rooks), and **king
safety** (a bonus per friendly pawn shielding the king, plus a preference for
a king tucked toward a corner over one sitting in the centre).

## Architecture

The code keeps game-state logic separate from rendering. One legal-move
generator powers three consumers — the UI's move highlighting, the rules layer
(check, checkmate, and every draw condition), and the AI search. Because the
rules engine is pure logic with no DOM dependencies, it can be tested outside a
browser entirely.

## Tests

```bash
node tests/engine.test.js
```

The suite extracts the inline `<script>` from `index.html`, evaluates it in a
Node sandbox, and exercises the rules directly: legal-move counts, en passant,
castling (including through-check denial), checkmate, stalemate, promotion, and
insufficient material. It runs on every push via GitHub Actions.

The game itself remains a single file — the tests sit alongside it and are not
needed to play.

## Limitations

- **Settings are not persisted.** Theme, highlights, AI delay, and board flip
  reset to defaults when the page reloads.
- **Search depth is fixed at 3.** Hard plays a reasonable club-level game but
  has no opening book, no endgame tablebase, and no quiescence search, so it is
  vulnerable to tactics that resolve deeper than three plies.
- **No move list, PGN export, FEN import, or undo.**
- **No clock.** Games are untimed.

## License

MIT — see [LICENSE](LICENSE).
