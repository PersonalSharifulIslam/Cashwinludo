import { useMemo } from "react";
import {
  buildBoardGrid,
  MAIN_TRACK,
  RED_HOME_COL,
  BLUE_HOME_COL,
  RED_BASE_CELLS,
  BLUE_BASE_CELLS,
  STAR_POSITIONS,
  SAFE_POSITIONS,
  getCellForToken,
  type CellType,
  type Color,
} from "@/lib/ludo-engine";

interface LudoBoardProps {
  redTokens: number[];
  blueTokens: number[];
  myColor: Color;
  currentTurn: Color;
  diceValue: number | null;
  validMoves: number[];
  onTokenClick: (tokenIndex: number) => void;
  disabled?: boolean;
}

// Color palette matching screenshot
const CORNER_COLORS = {
  "red-home":    "#C53030",  // bottom-left RED
  "green-home":  "#276749",  // top-left GREEN
  "yellow-home": "#B7791F",  // top-right YELLOW (Blue player's corner)
  "blue-home":   "#2B4C8C",  // bottom-right BLUE decorative
};

const TOKEN_COLORS = {
  red:  { fill: "#E53E3E", stroke: "#9B2C2C", glow: "rgba(229,62,62,0.9)",  inner: "rgba(255,160,160,0.5)" },
  blue: { fill: "#F6AD55", stroke: "#C05621", glow: "rgba(246,173,85,0.9)", inner: "rgba(255,230,180,0.5)" },
};

export function LudoBoard({
  redTokens,
  blueTokens,
  myColor,
  currentTurn,
  diceValue,
  validMoves,
  onTokenClick,
  disabled,
}: LudoBoardProps) {
  const grid = useMemo(() => buildBoardGrid(), []);

  const CELLS = 15;
  const BOARD_SIZE = Math.min(window.innerWidth - 8, 390);
  const CS = Math.floor(BOARD_SIZE / CELLS);
  const BS = CS * CELLS;

  type TokenInfo = { color: Color; tokenIdx: number; canMove: boolean };

  const tokenMap = useMemo(() => {
    const map = new Map<string, TokenInfo[]>();
    const addToken = (steps: number, color: Color, idx: number) => {
      if (steps === -1) return;
      const cell = getCellForToken(steps, color);
      if (!cell) return;
      const key = `${cell[0]},${cell[1]}`;
      const canMove = color === myColor && validMoves.includes(idx) && !disabled;
      const existing = map.get(key) || [];
      existing.push({ color, tokenIdx: idx, canMove });
      map.set(key, existing);
    };
    redTokens.forEach((s, i) => addToken(s, "red", i));
    blueTokens.forEach((s, i) => addToken(s, "blue", i));
    return map;
  }, [redTokens, blueTokens, myColor, validMoves, disabled]);

  const redBaseIndices = redTokens.map((t, i) => t === -1 ? i : -1).filter(i => i >= 0);
  const blueBaseIndices = blueTokens.map((t, i) => t === -1 ? i : -1).filter(i => i >= 0);

  function Token({ color, tokenIdx, canMove, cx, cy, r }: {
    color: Color; tokenIdx: number; canMove: boolean; cx: number; cy: number; r: number;
  }) {
    const tc = TOKEN_COLORS[color];
    return (
      <g onClick={() => canMove && onTokenClick(tokenIdx)} style={{ cursor: canMove ? "pointer" : "default" }}>
        {canMove && (
          <circle cx={cx} cy={cy} r={r + 4} fill="rgba(255,215,0,0.35)" className="animate-pulse" />
        )}
        {/* Shadow */}
        <circle cx={cx + 1} cy={cy + 1} r={r} fill="rgba(0,0,0,0.3)" />
        {/* Main body */}
        <circle cx={cx} cy={cy} r={r} fill={tc.fill} stroke={tc.stroke} strokeWidth={1.5}
          style={canMove ? { filter: `drop-shadow(0 0 5px ${tc.glow})` } : {}} />
        {/* Inner ring */}
        <circle cx={cx} cy={cy} r={r * 0.65} fill="none" stroke={tc.stroke} strokeWidth={0.8} opacity={0.5} />
        {/* Shine */}
        <circle cx={cx - r * 0.25} cy={cy - r * 0.3} r={r * 0.3} fill={tc.inner} />
        {/* Center dot */}
        <circle cx={cx} cy={cy} r={r * 0.18} fill={tc.stroke} opacity={0.7} />
      </g>
    );
  }

  function renderTokensInCell(col: number, row: number, tokens: TokenInfo[]) {
    const baseCx = col * CS + CS / 2;
    const baseCy = row * CS + CS / 2;
    const r = CS * 0.29;

    if (tokens.length === 1) {
      const t = tokens[0];
      return <Token key={`${t.color}${t.tokenIdx}`} color={t.color} tokenIdx={t.tokenIdx} canMove={t.canMove} cx={baseCx} cy={baseCy} r={r} />;
    }

    const offsets: [number, number][] = [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]];
    return tokens.slice(0, 4).map((t, i) => {
      const [ox, oy] = offsets[i] || [0, 0];
      return <Token key={`${t.color}${t.tokenIdx}`} color={t.color} tokenIdx={t.tokenIdx} canMove={t.canMove}
        cx={baseCx + ox * CS} cy={baseCy + oy * CS} r={r * 0.72} />;
    });
  }

  function getCellFill(cell: CellType, col: number, row: number): string {
    switch (cell) {
      case "red-home":    return CORNER_COLORS["red-home"];
      case "green-home":  return CORNER_COLORS["green-home"];
      case "yellow-home": return CORNER_COLORS["yellow-home"];
      case "blue-home":   return CORNER_COLORS["blue-home"];
      case "red-home-col": return "#FC8181";
      case "blue-home-col": return "#F6AD55";
      case "track": case "safe": case "star": return "#FFFFFF";
      case "center": return "#2d3748";
      case "empty": return "#e8e0d0";
      default: return "#FFFFFF";
    }
  }

  // Colored entry strips for track cells adjacent to home areas
  function getTrackStripColor(col: number, row: number): string | null {
    // Red's home column (col 7, rows 8-12) — red strip
    if (col === 7 && row >= 8 && row <= 12) return null; // handled by cell type
    return null;
  }

  return (
    <div className="flex items-center justify-center">
      <svg
        width={BS}
        height={BS}
        viewBox={`0 0 ${BS} ${BS}`}
        style={{
          border: "3px solid #6B4C11",
          borderRadius: 10,
          background: "#e8e0d0",
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}
      >
        {/* Draw all board cells */}
        {grid.map((rowArr, r) =>
          rowArr.map((cell, c) => {
            const x = c * CS;
            const y = r * CS;
            const fill = getCellFill(cell, c, r);
            const isTrack = cell === "track" || cell === "safe" || cell === "star";
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={x} y={y} width={CS} height={CS}
                  fill={fill}
                  stroke={isTrack ? "#ccc" : cell === "empty" ? "#d4c9b0" : "rgba(0,0,0,0.15)"}
                  strokeWidth={0.5}
                />
                {cell === "star" && (
                  <text x={x + CS/2} y={y + CS/2 + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={CS * 0.5} fill="#999" style={{ userSelect: "none" }}>★</text>
                )}
              </g>
            );
          })
        )}

        {/* Inner white boxes in each corner */}
        {/* Red (bottom-left): rows 9-14, cols 0-5 → inner at col 0.5, row 9.5 */}
        <rect x={CS*0.4} y={CS*9.4} width={CS*4.2} height={CS*4.2} rx={CS*0.4}
          fill="white" stroke="#9B2C2C" strokeWidth={1.5} opacity={0.85} />
        {/* Green (top-left): rows 0-5 */}
        <rect x={CS*0.4} y={CS*0.4} width={CS*4.2} height={CS*4.2} rx={CS*0.4}
          fill="white" stroke="#276749" strokeWidth={1.5} opacity={0.85} />
        {/* Yellow (top-right) = Blue player corner */}
        <rect x={CS*9.4} y={CS*0.4} width={CS*4.2} height={CS*4.2} rx={CS*0.4}
          fill="white" stroke="#B7791F" strokeWidth={1.5} opacity={0.85} />
        {/* Blue (bottom-right) */}
        <rect x={CS*9.4} y={CS*9.4} width={CS*4.2} height={CS*4.2} rx={CS*0.4}
          fill="white" stroke="#2B4C8C" strokeWidth={1.5} opacity={0.85} />

        {/* Circle outlines inside corner boxes to show "holes" */}
        {([
          [1.9, 10.9], [3.6, 10.9], [1.9, 12.6], [3.6, 12.6],  // Red
          [1.9,  1.9], [3.6,  1.9], [1.9,  3.6], [3.6,  3.6],  // Green
          [10.9, 1.9], [12.6, 1.9], [10.9, 3.6], [12.6, 3.6],  // Yellow
          [10.9,10.9], [12.6,10.9], [10.9,12.6], [12.6,12.6],  // Blue
        ] as [number,number][]).map(([cx, cy], i) => {
          const colors = ["#C53030","#C53030","#C53030","#C53030","#276749","#276749","#276749","#276749","#B7791F","#B7791F","#B7791F","#B7791F","#2B4C8C","#2B4C8C","#2B4C8C","#2B4C8C"];
          return (
            <circle key={i} cx={cx*CS} cy={cy*CS} r={CS*0.55}
              fill={colors[i]} opacity={0.35} />
          );
        })}

        {/* Center area X triangles */}
        {/* Red triangle (from left) */}
        <polygon points={`${CS*6},${CS*6} ${CS*7.5},${CS*7.5} ${CS*6},${CS*9}`} fill="#FC8181" opacity={0.9} />
        {/* Blue/Yellow triangle (from right) */}
        <polygon points={`${CS*9},${CS*6} ${CS*7.5},${CS*7.5} ${CS*9},${CS*9}`} fill="#F6AD55" opacity={0.9} />
        {/* Green triangle (from top) */}
        <polygon points={`${CS*6},${CS*6} ${CS*7.5},${CS*7.5} ${CS*9},${CS*6}`} fill="#9AE6B4" opacity={0.9} />
        {/* Yellow triangle (from bottom) */}
        <polygon points={`${CS*6},${CS*9} ${CS*7.5},${CS*7.5} ${CS*9},${CS*9}`} fill="#FAF089" opacity={0.9} />
        {/* Center star */}
        <circle cx={CS*7.5} cy={CS*7.5} r={CS*0.65} fill="#2d3748" stroke="#4a5568" strokeWidth={1} />
        <text x={CS*7.5} y={CS*7.5} textAnchor="middle" dominantBaseline="middle"
          fontSize={CS * 0.7} fill="#FFD700">★</text>

        {/* Colored entry strips for home columns */}
        {/* Red home column highlighted with red */}
        {RED_HOME_COL.map(([c, r], i) => (
          <rect key={`rhc-${i}`} x={c*CS} y={r*CS} width={CS} height={CS}
            fill="#FC8181" stroke="#ccc" strokeWidth={0.5} />
        ))}
        {/* Blue home column highlighted with yellow/orange */}
        {BLUE_HOME_COL.map(([c, r], i) => (
          <rect key={`bhc-${i}`} x={c*CS} y={r*CS} width={CS} height={CS}
            fill="#F6AD55" stroke="#ccc" strokeWidth={0.5} />
        ))}

        {/* Safe start squares (circles on safe positions) */}
        {MAIN_TRACK.map(([c, r], idx) => {
          if (!SAFE_POSITIONS.has(idx) || STAR_POSITIONS.has(idx)) return null;
          // Color based on position
          const safeColor = [0].includes(idx) ? "#FC8181"
            : [26].includes(idx) ? "#F6AD55"
            : "#aaa";
          return (
            <circle key={`safe-${idx}`} cx={c*CS+CS/2} cy={r*CS+CS/2} r={CS*0.28}
              fill="none" stroke={safeColor} strokeWidth={1.5} />
          );
        })}

        {/* Red base tokens */}
        {RED_BASE_CELLS.map(([bc, br], i) => {
          const tokenIdx = redBaseIndices[i];
          if (tokenIdx === undefined) return null;
          const cx = bc * CS;
          const cy = br * CS;
          const canMove = myColor === "red" && validMoves.includes(tokenIdx) && !disabled;
          return (
            <Token key={`red-base-${i}`} color="red" tokenIdx={tokenIdx} canMove={canMove}
              cx={cx} cy={cy} r={CS * 0.38} />
          );
        })}

        {/* Blue base tokens (in yellow/top-right corner) */}
        {BLUE_BASE_CELLS.map(([bc, br], i) => {
          const tokenIdx = blueBaseIndices[i];
          if (tokenIdx === undefined) return null;
          const cx = bc * CS;
          const cy = br * CS;
          const canMove = myColor === "blue" && validMoves.includes(tokenIdx) && !disabled;
          return (
            <Token key={`blue-base-${i}`} color="blue" tokenIdx={tokenIdx} canMove={canMove}
              cx={cx} cy={cy} r={CS * 0.38} />
          );
        })}

        {/* Track tokens */}
        {Array.from(tokenMap.entries()).map(([key, tokens]) => {
          const [c, r] = key.split(",").map(Number);
          return <g key={key}>{renderTokensInCell(c, r, tokens)}</g>;
        })}

        {/* Board border */}
        <rect x={0} y={0} width={BS} height={BS} fill="none"
          stroke="#6B4C11" strokeWidth={3} />
      </svg>
    </div>
  );
}
