# Hot-Seat Chess

[![CI](https://github.com/ItsMrZxD/hotseat-chess/actions/workflows/ci.yml/badge.svg)](https://github.com/ItsMrZxD/hotseat-chess/actions/workflows/ci.yml)

A complete chess game in a **single, self-contained HTML file** — HTML, CSS, and
vanilla JavaScript, no build step and no external libraries. Just open it in a
browser and play.

Play a friend on the same screen (hot-seat) or take on a built-in computer
opponent, with full legal-move enforcement and all the standard draw rules.

## Features

- **Two-player hot-seat** — both players share one screen
- **vs Computer** — pick your side and difficulty. Easy plays a random
  legal move but always takes the highest-value capture; Hard is minimax with
  alpha-beta pruning (depth 3), scoring material, central control, and king
  safety
- Castling, en passant, and pawn promotion (pick your piece, defaults to queen)
- Check, checkmate, and stalemate detection
- All standard draws — threefold repetition, 50-move rule, and insufficient
  material (K vs K, K+B vs K, K+N vs K, same-colored-bishop endings)
- Strict legality: you can't move into check, leave your king in check, or move
  your opponent's pieces
- Click a piece to highlight its legal destinations; captured pieces shown per side
- Settings panel (gear button), live mid-game — board theme, legal-move and
  last-move highlights, coordinates, AI delay, and board flip

## How to run

No installation, no server. Just:

```
Double-click index.html
```

…or open it in any modern browser.

## How to play

1. Click **New Game** and pick a mode (Two Player or vs Computer).
2. Click one of your pieces — its legal moves light up.
3. Click a highlighted square to move.
4. Use the **⚙ Settings** button anytime to change the theme, flip the board,
   adjust AI speed, and more — without interrupting your game.

## Design notes

The code keeps the **game-state logic separate from rendering**. The same
legal-move generator powers the UI, the rules (check/checkmate/draws), and the
AI search — so the computer can only ever play legal moves and always responds
correctly to check.

## Tests

Because the rules engine is pure logic, it can be tested outside a browser.
The suite extracts the inline `<script>` from `index.html`, evaluates it in a
Node sandbox, and checks the rules directly — legal-move counts, en passant,
castling (including through-check denial), checkmate, stalemate, promotion,
and insufficient material:

```
node tests/engine.test.js
```

The game itself is still a single file — the tests live alongside it and
are not needed to play.

## License

MIT — see [LICENSE](LICENSE).
