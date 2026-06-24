# Hot-Seat Chess

A complete chess game in a **single, self-contained HTML file** — HTML, CSS, and
vanilla JavaScript, no build step and no external libraries. Just open it in a
browser and play.

Play a friend on the same screen (hot-seat) or take on a built-in computer
opponent, with full legal-move enforcement and all the standard draw rules.

## Features

### Game modes
- **Two-player hot-seat** — both players share one screen
- **vs Computer** — choose your side (White/Black) and a difficulty:
  - **Easy** — greedy: plays a random legal move but always grabs the
    highest-value capture available
  - **Hard** — minimax search with alpha-beta pruning (depth 3), evaluating
    material, central control, and king safety

### Full rules engine
- All piece movement, plus **castling**, **en passant**, and **pawn promotion**
  (pick your piece, defaults to queen)
- Strict legality: you can't move into check, can't leave your king in check,
  and can't move your opponent's pieces
- **Check**, **checkmate**, and **stalemate** detection
- All standard **draws**:
  - Threefold repetition
  - 50-move rule
  - Insufficient material (K vs K, K+B vs K, K+N vs K, and same-colored-bishop endings)

### Interface
- Click to select a piece; legal destinations are highlighted
- Status bar announcing whose turn it is and check / checkmate / stalemate / draw
- Captured pieces shown for each side
- **Settings panel** (gear button) with live updates:
  - Board theme — Classic, Blue, Wood, or Gray
  - Toggle legal-move highlights
  - Toggle coordinates (rank/file labels)
  - Toggle last-move highlight
  - AI move delay — Instant / Fast / Normal / Slow
  - Flip board (play from Black's side)

## How to run

No installation, no server. Just:

```
Double-click index.html
```

…or open it in any modern browser. That's it.

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

- Single file: `index.html`
- No dependencies, no build tooling
- Pure standard-library JavaScript

## License

Free to use and modify.
