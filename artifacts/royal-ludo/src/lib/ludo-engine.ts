// Ludo Engine — Red at bottom-left, Blue at top-right (2-player)
// Steps: -1=home base, 0-51=main track, 52-56=home column, 57=done

// 15x15 grid. Main track 52 cells (clockwise starting at Red's entry)
export const MAIN_TRACK: [number, number][] = [
  // 0-4: Red entry going UP left column (col 6)
  [6,13],[6,12],[6,11],[6,10],[6,9],
  // 5-10: Going LEFT along row 8
  [5,8],[4,8],[3,8],[2,8],[1,8],[0,8],
  // 11-12: Going UP left edge
  [0,7],[0,6],
  // 13-17: Going RIGHT along row 6
  [1,6],[2,6],[3,6],[4,6],[5,6],
  // 18-23: Going UP col 6
  [6,5],[6,4],[6,3],[6,2],[6,1],[6,0],
  // 24-25: Going RIGHT along top row
  [7,0],[8,0],
  // 26-30: Blue entry going DOWN col 8
  [8,1],[8,2],[8,3],[8,4],[8,5],
  // 31-36: Going RIGHT along row 6
  [9,6],[10,6],[11,6],[12,6],[13,6],[14,6],
  // 37-38: Going DOWN right edge
  [14,7],[14,8],
  // 39-43: Going LEFT along row 8
  [13,8],[12,8],[11,8],[10,8],[9,8],
  // 44-49: Going DOWN col 8
  [8,9],[8,10],[8,11],[8,12],[8,13],[8,14],
  // 50-51: Going LEFT along bottom row
  [7,14],[6,14],
];

// Home columns leading to center (steps 52-56)
export const RED_HOME_COL: [number, number][] = [
  [7,12],[7,11],[7,10],[7,9],[7,8],  // going up toward center
];
export const BLUE_HOME_COL: [number, number][] = [
  [7,2],[7,3],[7,4],[7,5],[7,6],     // going down toward center
];

export const CENTER_CELL: [number, number] = [7, 7];

// Base positions inside home quadrant
export const RED_BASE_CELLS: [number, number][] = [[1,10],[4,10],[1,13],[4,13]];
export const BLUE_BASE_CELLS: [number, number][] = [[10,1],[13,1],[10,4],[13,4]];

// Safe squares (no captures) — absolute track positions
export const SAFE_POSITIONS = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
// Star squares to show star icon
export const STAR_POSITIONS = new Set([8, 13, 21, 34, 39, 47]);

export type Color = "red" | "blue";

export interface LudoGameState {
  redTokens: number[];
  blueTokens: number[];
  currentTurn: Color;
  diceValue: number | null;
  turnStartedAt: string;
  redSkips: number;
  blueSkips: number;
  status: "playing" | "finished";
  winnerId: number | null;
}

// Get absolute board position (0-51) from steps for a given color
export function getAbsolutePos(steps: number, color: Color): number {
  if (steps < 0 || steps > 51) return steps;
  if (color === "red") return steps;
  return (steps + 26) % 52;
}

// Get [col, row] cell for rendering a token
export function getCellForToken(steps: number, color: Color): [number, number] | null {
  if (steps === -1) return null;
  if (steps === 57) return CENTER_CELL;
  if (steps >= 52 && steps <= 56) {
    const homeCol = color === "red" ? RED_HOME_COL : BLUE_HOME_COL;
    return homeCol[steps - 52] ?? CENTER_CELL;
  }
  const absPos = getAbsolutePos(steps, color);
  return MAIN_TRACK[absPos] ?? null;
}

// Return indices of tokens that can legally move
export function getValidMoves(
  tokens: number[],
  _oppTokens: number[],
  diceValue: number,
  _color: Color
): number[] {
  const valid: number[] = [];
  for (let i = 0; i < 4; i++) {
    const s = tokens[i];
    if (s === 57) continue;
    if (s === -1) {
      if (diceValue === 6) valid.push(i);
      continue;
    }
    if (s + diceValue <= 57) valid.push(i);
  }
  return valid;
}

export function hasAnyValidMove(tokens: number[], diceValue: number): boolean {
  return getValidMoves(tokens, [], diceValue, "red").length > 0;
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Board cell types for rendering
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

// Build 15×15 grid of cell types
export function buildBoardGrid(): CellType[][] {
  const grid: CellType[][] = Array.from({ length: 15 }, () =>
    Array(15).fill("empty") as CellType[]
  );

  // Home quadrants
  for (let r = 9; r <= 14; r++) for (let c = 0; c <= 5; c++) grid[r][c] = "red-home";
  for (let r = 0; r <= 5; r++) for (let c = 0; c <= 5; c++) grid[r][c] = "green-home";
  for (let r = 0; r <= 5; r++) for (let c = 9; c <= 14; c++) grid[r][c] = "yellow-home";
  for (let r = 9; r <= 14; r++) for (let c = 9; c <= 14; c++) grid[r][c] = "blue-home";

  // Main track cells
  MAIN_TRACK.forEach(([c, r], idx) => {
    if (STAR_POSITIONS.has(idx)) grid[r][c] = "star";
    else if (SAFE_POSITIONS.has(idx)) grid[r][c] = "safe";
    else grid[r][c] = "track";
  });

  // Red safe start cell (position 0 = [6,13])
  grid[13][6] = "safe";

  // Home columns
  RED_HOME_COL.forEach(([c, r]) => { grid[r][c] = "red-home-col"; });
  BLUE_HOME_COL.forEach(([c, r]) => { grid[r][c] = "blue-home-col"; });

  // Center 3×3
  for (let r = 6; r <= 8; r++) for (let c = 6; c <= 8; c++) grid[r][c] = "center";

  return grid;
}
