import { useMemo } from "react";
import {
  buildBoardGrid,
  MAIN_TRACK,
  RED_HOME_COL,
  BLUE_HOME_COL,
  RED_BASE_CELLS,
  BLUE_BASE_CELLS,
  STAR_POSITIONS,
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
  validMoves: number[]; // indices of movable tokens
  onTokenClick: (tokenIndex: number) => void;
  disabled?: boolean;
}

const CELL_COLORS: Record<CellType, string> = {
  empty: "#1a1a2e",
  track: "#FFFFFF",
  safe: "#FFFFFF",
  star: "#FFFFFF",
  "red-home": "#e53e3e",
  "green-home": "#38a169",
  "yellow-home": "#d69e2e",
  "blue-home": "#3182ce",
  "red-home-col": "#FC8181",
  "blue-home-col": "#90CDF4",
  center: "#2d3748",
};

function DiceFace({ value, size = 28 }: { value: number; size?: number }) {
  const s = size;
  const dotPositions: Record<number, [number, number][]> = {
    1: [[0.5, 0.5]],
    2: [[0.25, 0.25], [0.75, 0.75]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.25, 0.2], [0.75, 0.2], [0.25, 0.5], [0.75, 0.5], [0.25, 0.8], [0.75, 0.8]],
  };
  const dots = dotPositions[value] || [];
  const r = s * 0.08;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <rect x={1} y={1} width={s-2} height={s-2} rx={s*0.15} fill="white" stroke="#ccc" strokeWidth={1} />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx*s} cy={cy*s} r={r} fill="#1a1a2e" />
      ))}
    </svg>
  );
}

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
  const BOARD_SIZE = Math.min(window.innerWidth - 16, 360);
  const CS = Math.floor(BOARD_SIZE / CELLS); // cell size in px
  const BS = CS * CELLS;

  // Build token position map: key = "col,row" -> list of {color, tokenIdx, canMove}
  type TokenInfo = { color: Color; tokenIdx: number; canMove: boolean };
  const tokenMap = useMemo(() => {
    const map = new Map<string, TokenInfo[]>();
    const addToken = (steps: number, color: Color, idx: number) => {
      if (steps === -1) return; // in base, rendered separately
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

  // Count tokens in base
  const redInBase = redTokens.filter(t => t === -1).length;
  const blueInBase = blueTokens.filter(t => t === -1).length;
  const redBaseIndices = redTokens.map((t, i) => t === -1 ? i : -1).filter(i => i >= 0);
  const blueBaseIndices = blueTokens.map((t, i) => t === -1 ? i : -1).filter(i => i >= 0);

  const TOKEN_COLORS = {
    red: { fill: "#E53E3E", stroke: "#9B2C2C", glow: "rgba(229,62,62,0.8)" },
    blue: { fill: "#3182CE", stroke: "#2C5282", glow: "rgba(49,130,206,0.8)" },
  };

  function Token({ color, tokenIdx, canMove, cx, cy, r }: {
    color: Color; tokenIdx: number; canMove: boolean; cx: number; cy: number; r: number;
  }) {
    const tc = TOKEN_COLORS[color];
    return (
      <g
        onClick={() => canMove && onTokenClick(tokenIdx)}
        style={{ cursor: canMove ? "pointer" : "default" }}
      >
        {canMove && (
          <circle cx={cx} cy={cy} r={r + 3} fill="rgba(255,215,0,0.4)" className="animate-pulse" />
        )}
        <circle cx={cx} cy={cy} r={r} fill={tc.fill} stroke={tc.stroke} strokeWidth={1.5}
          style={canMove ? { filter: `drop-shadow(0 0 4px ${tc.glow})` } : {}} />
        <circle cx={cx} cy={cy - r * 0.2} r={r * 0.4} fill="rgba(255,255,255,0.4)" />
      </g>
    );
  }

  function renderTokensInCell(col: number, row: number, tokens: TokenInfo[]) {
    const baseCx = col * CS + CS / 2;
    const baseCy = row * CS + CS / 2;
    const r = CS * 0.28;

    if (tokens.length === 1) {
      const t = tokens[0];
      return <Token key={`${t.color}${t.tokenIdx}`} color={t.color} tokenIdx={t.tokenIdx} canMove={t.canMove} cx={baseCx} cy={baseCy} r={r} />;
    }

    const offsets = [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]];
    return tokens.slice(0, 4).map((t, i) => {
      const [ox, oy] = offsets[i] || [0, 0];
      return <Token key={`${t.color}${t.tokenIdx}`} color={t.color} tokenIdx={t.tokenIdx} canMove={t.canMove}
        cx={baseCx + ox * CS} cy={baseCy + oy * CS} r={r * 0.75} />;
    });
  }

  // Base token positions
  const BASE_OFFSETS: [number, number][] = [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]];

  return (
    <div className="flex items-center justify-center">
      <svg
        width={BS}
        height={BS}
        viewBox={`0 0 ${BS} ${BS}`}
        style={{ border: "3px solid #8B6914", borderRadius: 12, background: "#fffdf0" }}
      >
        {/* Draw board cells */}
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const x = c * CS;
            const y = r * CS;
            const color = CELL_COLORS[cell];
            return (
              <g key={`${r}-${c}`}>
                <rect x={x} y={y} width={CS} height={CS} fill={color}
                  stroke={cell === "track" || cell === "safe" || cell === "star" ? "#ddd" : color === "#FFFFFF" ? "#ddd" : "rgba(0,0,0,0.1)"}
                  strokeWidth={0.5} />
                {cell === "star" && (
                  <text x={x + CS/2} y={y + CS/2 + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={CS * 0.55} fill="#888" style={{ userSelect: "none" }}>★</text>
                )}
                {/* Safe start squares */}
                {(c === 1 && r === 6) && <circle cx={x+CS/2} cy={y+CS/2} r={CS*0.3} fill="none" stroke="#e53e3e" strokeWidth={1.5} />}
                {(c === 13 && r === 8) && <circle cx={x+CS/2} cy={y+CS/2} r={CS*0.3} fill="none" stroke="#3182ce" strokeWidth={1.5} />}
              </g>
            );
          })
        )}

        {/* Home base inner areas */}
        {/* Red home (top-left): cols 0-5, rows 0-5 → inner white area */}
        <rect x={CS*0.5} y={CS*0.5} width={CS*4} height={CS*4} rx={CS*0.5} fill="white" stroke="#c53030" strokeWidth={1.5} />
        {/* Green home (top-right) */}
        <rect x={CS*9.5} y={CS*0.5} width={CS*4} height={CS*4} rx={CS*0.5} fill="white" stroke="#276749" strokeWidth={1.5} />
        {/* Yellow home (bottom-left) */}
        <rect x={CS*0.5} y={CS*9.5} width={CS*4} height={CS*4} rx={CS*0.5} fill="white" stroke="#975a16" strokeWidth={1.5} />
        {/* Blue home (bottom-right) */}
        <rect x={CS*9.5} y={CS*9.5} width={CS*4} height={CS*4} rx={CS*0.5} fill="white" stroke="#2b4c8c" strokeWidth={1.5} />

        {/* Center home triangles */}
        {/* Red triangle (left) */}
        <polygon points={`${CS*6},${CS*6} ${CS*7.5},${CS*7.5} ${CS*6},${CS*9}`} fill="#FC8181" />
        {/* Blue triangle (right) */}
        <polygon points={`${CS*9},${CS*6} ${CS*7.5},${CS*7.5} ${CS*9},${CS*9}`} fill="#90CDF4" />
        {/* Green triangle (top) */}
        <polygon points={`${CS*6},${CS*6} ${CS*7.5},${CS*7.5} ${CS*9},${CS*6}`} fill="#9AE6B4" />
        {/* Yellow triangle (bottom) */}
        <polygon points={`${CS*6},${CS*9} ${CS*7.5},${CS*7.5} ${CS*9},${CS*9}`} fill="#FAF089" />
        {/* Center circle */}
        <circle cx={CS*7.5} cy={CS*7.5} r={CS*0.6} fill="#2d3748" stroke="#4a5568" strokeWidth={1} />
        <circle cx={CS*7.5} cy={CS*7.5} r={CS*0.35} fill="#FFD700" />

        {/* Render Red base tokens */}
        {redBaseIndices.map((tokenIdx, i) => {
          const positions: [number, number][] = [[1.5,1.5],[3.5,1.5],[1.5,3.5],[3.5,3.5]];
          const [bc, br] = positions[i] || [2.5, 2.5];
          const cx = bc * CS;
          const cy = br * CS;
          const canMove = myColor === "red" && validMoves.includes(tokenIdx) && !disabled;
          return (
            <g key={`red-base-${tokenIdx}`} onClick={() => canMove && onTokenClick(tokenIdx)}
              style={{ cursor: canMove ? "pointer" : "default" }}>
              {canMove && <circle cx={cx} cy={cy} r={CS*0.35} fill="rgba(255,215,0,0.4)" className="animate-pulse" />}
              <circle cx={cx} cy={cy} r={CS*0.28} fill="#E53E3E" stroke="#9B2C2C" strokeWidth={1.5}
                style={canMove ? { filter: "drop-shadow(0 0 4px rgba(229,62,62,0.8))" } : {}} />
              <circle cx={cx} cy={cy - CS*0.08} r={CS*0.11} fill="rgba(255,255,255,0.4)" />
            </g>
          );
        })}

        {/* Render Blue base tokens */}
        {blueBaseIndices.map((tokenIdx, i) => {
          const positions: [number, number][] = [[10.5,10.5],[12.5,10.5],[10.5,12.5],[12.5,12.5]];
          const [bc, br] = positions[i] || [11.5, 11.5];
          const cx = bc * CS;
          const cy = br * CS;
          const canMove = myColor === "blue" && validMoves.includes(tokenIdx) && !disabled;
          return (
            <g key={`blue-base-${tokenIdx}`} onClick={() => canMove && onTokenClick(tokenIdx)}
              style={{ cursor: canMove ? "pointer" : "default" }}>
              {canMove && <circle cx={cx} cy={cy} r={CS*0.35} fill="rgba(255,215,0,0.4)" className="animate-pulse" />}
              <circle cx={cx} cy={cy} r={CS*0.28} fill="#3182CE" stroke="#2C5282" strokeWidth={1.5}
                style={canMove ? { filter: "drop-shadow(0 0 4px rgba(49,130,206,0.8))" } : {}} />
              <circle cx={cx} cy={cy - CS*0.08} r={CS*0.11} fill="rgba(255,255,255,0.4)" />
            </g>
          );
        })}

        {/* Render track tokens */}
        {Array.from(tokenMap.entries()).map(([key, tokens]) => {
          const [c, r] = key.split(",").map(Number);
          return (
            <g key={key}>
              {renderTokensInCell(c, r, tokens)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
