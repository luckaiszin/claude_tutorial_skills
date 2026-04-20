# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-file Tic-Tac-Toe web game: `tic-tac-toe.html`. No build system, dependencies, or package manager — open the file directly in a browser to run it.

## Architecture

Everything lives in `tic-tac-toe.html`: inline CSS, HTML markup, and a `<script>` block.

**Game state** (module-level vars): `board` (9-element array, `null`/`'X'`/`'O'`), `current`, `gameOver`, `vsAI`, `scores`.

**Key functions:**
- `makeMove(i)` — central move handler; updates board, checks winner, triggers AI turn
- `checkWinner()` — checks `WINS` (8 hardcoded win lines) against `board`; returns `{winner, line}` or `{draw: true}` or `null`
- `bestMove(b)` / `minimax(b, depth, isMax)` — unbeatable minimax AI playing as `'O'`
- `render()` — syncs DOM cells to `board` state; preserves `.win` class via `cell.dataset.win`
- `init()` — full reset including scores; `reset` button resets board only (scores persist)

**Bug to be aware of:** `minimax()` calls `checkWinner()` without passing `b`, so it reads the outer `board` variable instead of the recursive copy. This works only because `bestMove` mutates `board` in place during search (not a local copy).
