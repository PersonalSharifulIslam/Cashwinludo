// ============================================================
// Ludo Engine - Pure game logic, no side effects
// ============================================================

// 15x15 grid positions for main track (52 cells, clockwise from Red entry)
export const MAIN_TRACK: [number, number][] = [
  [1,6],[2,6],[3,6],[4,6],[5,6],            // 0-4: Red side going right
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],       // 5-10: Up left column
  [7,0],[8,0],                               // 11-12: Top middle
  [8,1],[8,2],[8,3],[8,4],[8,5],             // 13-17: Down right of top
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],  // 18-23: Right side going right
  [14,7],[14,8],                             // 24-25: Right middle
  [13,8],[12,8],[11,8],[10,8],[9,8],         // 26-30: Blue entry going left
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],  // 31-36: Down right column
  [7,14],[6,14],                             // 37-38: Bottom middle
  [6,13],[6,12],[6,11],[6,10],[6,9],         // 39-43: Yellow side
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],       // 44-49: Bottom left going left
  [0,7],[0,6],                               // 50-51: Left middle
];

// Home columns for each color (5 cells leading to center, steps 52-56)
export const RED_HOME_COL: [number, number][] = [[1,7],[2,7],[3,7],[4,7],[5,7]];
export const BLUE_HOME_COL: [number, number][] = [[13,7],[12,7],[11,7],[10,7],[9,7]];

// Center (step 57 = done)
export const CENTER_CELL: [number, number] = [7, 7];

// Red token starting positions in home base
export const RED_BASE_CELLS: [number, number][] = [[1,1],[4,1],[1,4],[4,4]];
// Blue token starting positions in home base
export const BLUE_BASE_CELLS: [number, number][] = [[10,10],[13,10],[10,13],[13,13]];

// Safe squares (absolute track positions)
export const SAFE_POSITIONS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);

// Star squares to display (absolute track positions)
export const STAR_POSITIONS = new Set([8, 13, 21, 34, 39, 47]);

export type Color = "red" | "blue";

export interface LudoGameState {
  redTokens: number[];   // steps: -1=home, 0-51=track, 52-56=home col, 57=done
  blueTokens: number[];
  currentTurn: Color;
  diceValue: number | null;
  turnStartedAt: string;
  redSkips: number;
  blueSkips: number;
  status: "playing" | "finished";
  winnerId: number | null;
}

// Get absolute track position from steps (for rendering)
export function getAbsolutePos(steps: number, color: Color): number {
  if (steps < 0 || steps > 56) return steps;
  if (steps > 51) return steps; // in home column
  if (color === "red") return steps;
  return (steps + 26) % 52;
}

// Get cell [col, row] for a token at given steps
export function getCellForToken(steps: number, color: Color): [number, number] | null {
  if (steps === -1) return null; // in home base, rendered separately
  if (steps === 57) return CENTER_CELL;
  if (steps >= 52) {
    const homeCol = color === "red" ? RED_HOME_COL : BLUE_HOME_COL;
    return homeCol[steps - 52] ?? CENTER_CELL;
  }
  const absPos = getAbsolutePos(steps, color);
  return MAIN_TRACK[absPos] ?? null;
}

// Get valid moves for a color given dice value
export function getValidMoves(
  tokens: number[],
  opponentTokens: number[],
  diceValue: number,
  color: Color
): number[] {
  const validIndices: number[] = [];

  for (let i = 0; i < 4; i++) {
    const steps = tokens[i];

    if (steps === 57) continue; // already done

    if (steps === -1) {
      // Can exit home base with a 6
      if (diceValue === 6) validIndices.push(i);
      continue;
    }

    const newSteps = steps + diceValue;
    if (newSteps > 57) continue; // overshoot, invalid

    validIndices.push(i);
  }

  return validIndices;
}

// Apply a move and return new state
export function applyMove(
  state: LudoGameState,
  tokenIndex: number,
  color: Color,
  nextTurn: Color
): LudoGameState {
  const tokens = color === "red" ? [...state.redTokens] : [...state.blueTokens];
  const opponentTokens = color === "red" ? [...state.blueTokens] : [...state.redTokens];
  const diceValue = state.diceValue!;

  const oldSteps = tokens[tokenIndex];
  let newSteps: number;

  if (oldSteps === -1) {
    newSteps = 0; // Exit home base
  } else {
    newSteps = oldSteps + diceValue;
  }

  tokens[tokenIndex] = newSteps;

  // Check for capture (only on main track, not safe squares)
  if (newSteps < 52 && newSteps >= 0) {
    const myAbsPos = getAbsolutePos(newSteps, color);
    if (!SAFE_POSITIONS.has(myAbsPos)) {
      for (let j = 0; j < 4; j++) {
        const oppSteps = opponentTokens[j];
        if (oppSteps < 0 || oppSteps >= 52) continue; // not on main track
        const oppAbsPos = getAbsolutePos(oppSteps, color === "red" ? "blue" : "red");
        if (oppAbsPos === myAbsPos) {
          opponentTokens[j] = -1; // Send back to home
        }
      }
    }
  }

  // Check win condition
  const allDone = tokens.every(t => t === 57);
  const newStatus = allDone ? "finished" : "playing";

  // Roll 6 = get another turn
  const turn = diceValue === 6 ? color : nextTurn;

  const newState: LudoGameState = {
    ...state,
    redTokens: color === "red" ? tokens : opponentTokens,
    blueTokens: color === "red" ? opponentTokens : tokens,
    currentTurn: newStatus === "finished" ? state.currentTurn : turn,
    diceValue: null,
    turnStartedAt: new Date().toISOString(),
    redSkips: color === "red" ? 0 : state.redSkips,
    blueSkips: color === "blue" ? 0 : state.blueSkips,
    status: newStatus,
  };

  return newState;
}

// Check if a token has any valid moves
export function hasAnyValidMove(tokens: number[], diceValue: number, color: Color): boolean {
  return getValidMoves(tokens, [], diceValue, color).length > 0;
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Board cell type for rendering
export type CellType =
  | "empty"
  | "red-home"
  | "blue-home"
  | "green-home"
  | "yellow-home"
  | "red-home-col"
  | "blue-home-col"
  | "center"
  | "track"
  | "safe"
  | "star";

// Build a 15x15 grid of cell types
export function buildBoardGrid(): CellType[][] {
  const grid: CellType[][] = Array.from({ length: 15 }, () =>
    Array(15).fill("empty")
  );

  // Home bases
  for (let r = 0; r <= 5; r++) for (let c = 0; c <= 5; c++) grid[r][c] = "red-home";
  for (let r = 0; r <= 5; r++) for (let c = 9; c <= 14; c++) grid[r][c] = "green-home";
  for (let r = 9; r <= 14; r++) for (let c = 0; c <= 5; c++) grid[r][c] = "yellow-home";
  for (let r = 9; r <= 14; r++) for (let c = 9; c <= 14; c++) grid[r][c] = "blue-home";

  // Main track cells
  MAIN_TRACK.forEach(([c, r], idx) => {
    if (STAR_POSITIONS.has(idx)) {
      grid[r][c] = "star";
    } else if (SAFE_POSITIONS.has(idx)) {
      grid[r][c] = "safe";
    } else {
      grid[r][c] = "track";
    }
  });

  // Red home column
  RED_HOME_COL.forEach(([c, r]) => { grid[r][c] = "red-home-col"; });

  // Blue home column
  BLUE_HOME_COL.forEach(([c, r]) => { grid[r][c] = "blue-home-col"; });

  // Center
  for (let r = 6; r <= 8; r++) for (let c = 6; c <= 8; c++) grid[r][c] = "center";

  return grid;
}
