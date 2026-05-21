import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { LudoBoard } from "@/components/game/ludo-board";
import { getValidMoves, type Color, type LudoGameState } from "@/lib/ludo-engine";
import { Volume2, VolumeX, LogOut } from "lucide-react";

const API_BASE = "/api";
const TURN_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 700;

async function gameAPI(path: string, method = "GET", body?: object) {
  const token = localStorage.getItem("royal_ludo_token");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// --- Sound Effects via Web Audio API ---
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playDiceSound() {
  try {
    const ctx = getAudioCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.25, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch { /* ignore */ }
}

function playMoveSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.07);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.18);
  } catch { /* ignore */ }
}

function playCaptureSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch { /* ignore */ }
}

function playWinSound() {
  try {
    const ctx = getAudioCtx();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.25);
    });
  } catch { /* ignore */ }
}

// --- Dice Face Component ---
function DiceFace({ value, size = 44, rolling }: { value: number | null; size?: number; rolling?: boolean }) {
  const s = size;
  const dotPositions: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[27, 27], [73, 73]],
    3: [[27, 27], [50, 50], [73, 73]],
    4: [[27, 27], [73, 27], [27, 73], [73, 73]],
    5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
    6: [[27, 22], [73, 22], [27, 50], [73, 50], [27, 78], [73, 78]],
  };

  if (value === null) {
    return (
      <div style={{ width: s, height: s }}
        className="flex items-center justify-center bg-white/10 rounded-xl border-2 border-white/20">
        <span className="text-white/30 text-2xl font-black">?</span>
      </div>
    );
  }

  const dots = dotPositions[value] || [];
  return (
    <svg width={s} height={s} viewBox="0 0 100 100"
      className={rolling ? "animate-spin" : ""}>
      <rect x={3} y={3} width={94} height={94} rx={18}
        fill="white" stroke="#ddd" strokeWidth={2} />
      <rect x={4} y={4} width={92} height={40} rx={14}
        fill="rgba(255,255,255,0.6)" />
      {dots.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={9} fill="#1a1a2e" />
      ))}
    </svg>
  );
}

// --- Timer Bar ---
function TimerBar({ startedAt, timeoutMs }: { startedAt: string; timeoutMs: number }) {
  const [remaining, setRemaining] = useState(timeoutMs);
  useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      setRemaining(Math.max(0, timeoutMs - elapsed));
    };
    update();
    const id = setInterval(update, 100);
    return () => clearInterval(id);
  }, [startedAt, timeoutMs]);
  const pct = (remaining / timeoutMs) * 100;
  const color = pct > 60 ? "#22c55e" : pct > 30 ? "#eab308" : "#ef4444";
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-100"
        style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

// --- Player Avatar ---
function PlayerAvatar({ name, color, lives, isActive, isMe }: {
  name: string; color: Color; lives: number; isActive: boolean; isMe: boolean;
}) {
  const tc = color === "red"
    ? { bg: "#E53E3E", border: "#9B2C2C", text: "#FFE4E4" }
    : { bg: "#F6AD55", border: "#C05621", text: "#3D1F00" };

  return (
    <div className={`flex flex-col items-center gap-1 transition-all ${isActive ? "scale-105" : "opacity-70"}`}>
      <div className="relative">
        <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-base border-2 shadow-lg"
          style={{ backgroundColor: tc.bg, borderColor: tc.border, color: tc.text }}>
          {name.substring(0, 2).toUpperCase()}
        </div>
        {isActive && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-background animate-pulse" />
        )}
      </div>
      <div className="text-[10px] font-bold text-white/70 max-w-[60px] truncate text-center">
        {isMe ? "আপনি" : name}
      </div>
      {/* Lives (hearts) */}
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <span key={i} className="text-[11px]" style={{ opacity: i < lives ? 1 : 0.2 }}>
            ❤️
          </span>
        ))}
      </div>
    </div>
  );
}

interface GameData {
  game: LudoGameState & {
    id: number;
    matchId: string;
    turnStartedAt: string;
    redSkips: number;
    blueSkips: number;
  };
  myColor: Color;
  isMyTurn: boolean;
  player1: { id: number; name: string };
  player2: { id: number; name: string } | null;
  entryFee: number;
  prize: number;
  turnTimeoutMs: number;
}

export default function Game() {
  const [, params] = useRoute("/game/:matchId");
  const matchId = params?.matchId;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolling, setRolling] = useState(false);
  const [moving, setMoving] = useState(false);
  const [localDice, setLocalDice] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState<{ won: boolean; prize: number } | null>(null);
  const [showForfeit, setShowForfeit] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [diceRolling, setDiceRolling] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipPendingRef = useRef(false);
  const didStart = useRef(false);
  const prevDiceRef = useRef<number | null>(null);

  const sound = (fn: () => void) => { if (soundOn) fn(); };

  const startGame = useCallback(async () => {
    if (!matchId || didStart.current) return;
    try {
      await gameAPI(`/game/${matchId}/start`, "POST");
      didStart.current = true;
    } catch {
      didStart.current = true;
    }
  }, [matchId]);

  const fetchState = useCallback(async () => {
    if (!matchId) return;
    try {
      const data: GameData = await gameAPI(`/game/${matchId}/state`);
      setGameData(data);
      setLoading(false);

      const newDice = data.game?.diceValue ?? null;
      if (newDice !== null && newDice !== prevDiceRef.current) {
        setLocalDice(newDice);
        prevDiceRef.current = newDice;
      } else if (newDice === null) {
        setLocalDice(null);
        prevDiceRef.current = null;
      }

      if (data.game?.status === "finished") {
        const won = data.game.winnerId === user?.id;
        setGameOver({ won, prize: data.prize });
        if (pollRef.current) clearInterval(pollRef.current);
        if (won) sound(playWinSound);
      }
    } catch (e: any) {
      if (e.message?.includes("Game not started") || e.message?.includes("Match not found")) {
        await startGame();
      }
    }
  }, [matchId, user?.id, startGame, soundOn]);

  useEffect(() => {
    if (!matchId) return;
    startGame().then(() => fetchState());
    pollRef.current = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [matchId, fetchState, startGame]);

  // Auto-skip when timer expires
  useEffect(() => {
    if (!gameData || gameData.game.status !== "playing") return;
    if (!gameData.isMyTurn) return;

    const elapsed = Date.now() - new Date(gameData.game.turnStartedAt).getTime();
    const remaining = TURN_TIMEOUT_MS - elapsed;

    const doSkip = () => {
      if (skipPendingRef.current) return;
      skipPendingRef.current = true;
      gameAPI(`/game/${matchId}/skip`, "POST")
        .catch(() => {})
        .finally(() => { skipPendingRef.current = false; fetchState(); });
    };

    if (remaining <= 0) { doSkip(); return; }
    const t = setTimeout(doSkip, remaining);
    return () => clearTimeout(t);
  }, [gameData?.game.turnStartedAt, gameData?.isMyTurn]);

  // Forfeit on page unload
  useEffect(() => {
    const onUnload = () => {
      if (gameData?.game.status === "playing") {
        navigator.sendBeacon(`${API_BASE}/game/${matchId}/forfeit`, "{}");
      }
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [matchId, gameData?.game.status]);

  const handleRoll = async () => {
    if (!gameData?.isMyTurn || gameData.game.diceValue !== null || rolling) return;
    setRolling(true);
    setDiceRolling(true);
    sound(playDiceSound);
    try {
      const result = await gameAPI(`/game/${matchId}/roll`, "POST");
      setLocalDice(result.diceValue);
      prevDiceRef.current = result.diceValue;
      setTimeout(() => setDiceRolling(false), 300);
      if (result.autoSkip) {
        toast({
          title: result.gameOver ? "খেলা শেষ" : "অটো স্কিপ",
          description: result.gameOver ? "কোনো চাল নেই — হেরে গেছেন!" : `কোনো চাল নেই (${result.skipCount}/3)`,
          variant: result.gameOver ? "destructive" : "default",
        });
      }
      await fetchState();
    } catch (e: any) {
      setDiceRolling(false);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRolling(false);
    }
  };

  const handleTokenClick = async (tokenIdx: number) => {
    if (!gameData?.isMyTurn || gameData.game.diceValue === null || moving) return;
    setMoving(true);
    sound(playMoveSound);
    try {
      const result = await gameAPI(`/game/${matchId}/move`, "POST", { tokenIndex: tokenIdx });
      if (result.captured) sound(playCaptureSound);
      if (result.gameOver) {
        setGameOver({ won: true, prize: gameData.prize });
        sound(playWinSound);
        if (pollRef.current) clearInterval(pollRef.current);
      }
      await fetchState();
    } catch (e: any) {
      toast({ title: "অবৈধ চাল", description: e.message, variant: "destructive" });
    } finally {
      setMoving(false);
    }
  };

  const handleForfeit = async () => {
    try {
      await gameAPI(`/game/${matchId}/forfeit`, "POST");
    } catch { /* ignore */ }
    setLocation("/");
  };

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">গেম লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // --- Game Over Screen ---
  if (gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[380px] text-center space-y-6">
          <div className={`text-8xl ${gameOver.won ? "animate-bounce" : ""}`}>
            {gameOver.won ? "🏆" : "😞"}
          </div>
          <div>
            <h1 className={`text-4xl font-black mb-2 ${gameOver.won ? "text-yellow-400" : "text-red-400"}`}>
              {gameOver.won ? "আপনি জিতেছেন!" : "হেরে গেছেন!"}
            </h1>
            {gameOver.won && (
              <p className="text-green-400 font-bold text-2xl mt-2">
                ৳{gameOver.prize.toFixed(0)} পেয়েছেন 🎉
              </p>
            )}
            {!gameOver.won && (
              <p className="text-muted-foreground text-sm mt-2">পরের বার আরও ভালো করবেন!</p>
            )}
          </div>
          <button
            onClick={() => setLocation("/")}
            className="w-full py-4 bg-primary text-black font-black text-xl rounded-2xl shadow-[0_0_24px_rgba(255,215,0,0.5)] hover:bg-primary/90 active:scale-95 transition-all"
          >
            🏠 হোমে যান
          </button>
        </div>
      </div>
    );
  }

  if (!gameData) return null;

  const { game, myColor, isMyTurn, player1, player2 } = gameData;
  const oppColor: Color = myColor === "red" ? "blue" : "red";
  const myName = myColor === "red" ? player1.name : (player2?.name || "Player 2");
  const oppName = myColor === "red" ? (player2?.name || "প্রতিপক্ষ") : player1.name;

  const mySkips   = myColor === "red" ? game.redSkips   : game.blueSkips;
  const oppSkips  = myColor === "red" ? game.blueSkips  : game.redSkips;
  const myLives   = Math.max(0, 3 - mySkips);
  const oppLives  = Math.max(0, 3 - oppSkips);

  const myTokens  = (myColor === "red" ? game.redTokens  : game.blueTokens)  as number[];
  const oppTokens = (myColor === "red" ? game.blueTokens : game.redTokens)   as number[];
  const diceForMoves = localDice ?? game.diceValue;

  const validMoves = isMyTurn && diceForMoves !== null
    ? getValidMoves(myTokens, oppTokens, diceForMoves, myColor)
    : [];

  const canRoll = isMyTurn && game.diceValue === null && !rolling;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden"
      style={{ maxWidth: 430, margin: "0 auto" }}>

      {/* Top bar: hearts + prize + sound toggle */}
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        {/* Opponent info */}
        <PlayerAvatar
          name={oppName}
          color={oppColor}
          lives={oppLives}
          isActive={!isMyTurn && game.status === "playing"}
          isMe={false}
        />

        {/* Center: prize + sound */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Prize</div>
          <div className="text-lg font-black text-primary">৳{gameData.prize}</div>
          <button
            onClick={() => setSoundOn(v => !v)}
            className="text-white/40 hover:text-white transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* My info */}
        <PlayerAvatar
          name={myName}
          color={myColor}
          lives={myLives}
          isActive={isMyTurn && game.status === "playing"}
          isMe={true}
        />
      </div>

      {/* Turn timer */}
      {isMyTurn && game.status === "playing" && (
        <div className="px-4 pb-1">
          <TimerBar startedAt={game.turnStartedAt} timeoutMs={TURN_TIMEOUT_MS} />
        </div>
      )}

      {/* Status label */}
      <div className="px-4 pb-2">
        <div className={`text-center text-xs font-bold py-1.5 rounded-xl border ${
          isMyTurn
            ? "bg-primary/15 border-primary/40 text-primary animate-pulse"
            : "bg-white/5 border-white/10 text-muted-foreground"
        }`}>
          {isMyTurn
            ? (game.diceValue !== null ? "✨ গুটি বেছে চাপুন" : "🎲 GO চাপুন — ডাইস ফেলুন!")
            : `⏳ ${oppName}-এর পালা চলছে...`}
        </div>
      </div>

      {/* Ludo Board */}
      <div className="px-1 flex items-center justify-center">
        <LudoBoard
          redTokens={game.redTokens as number[]}
          blueTokens={game.blueTokens as number[]}
          myColor={myColor}
          currentTurn={game.currentTurn as Color}
          diceValue={diceForMoves}
          validMoves={validMoves}
          onTokenClick={handleTokenClick}
          disabled={!isMyTurn || game.diceValue === null || moving}
        />
      </div>

      {/* Bottom controls */}
      <div className="px-4 pt-3 pb-4 space-y-2">
        {/* Dice + GO button row */}
        <div className="flex items-center gap-3 bg-card/40 rounded-2xl px-4 py-3 border border-white/10">
          {/* Dice icon */}
          <div className="shrink-0">
            <DiceFace value={localDice ?? game.diceValue} size={52} rolling={diceRolling} />
          </div>

          <div className="flex-1">
            {mySkips > 0 && (
              <div className="text-[10px] text-orange-400 mb-1">
                ⚠️ {mySkips} বার মিস (আরও {3 - mySkips} বার মিস = হার)
              </div>
            )}
            <div className="text-xs text-white/50">
              {canRoll
                ? "ডাইস ফেলুন →"
                : (game.diceValue !== null && isMyTurn)
                  ? "গুটি বেছে নিন ↑"
                  : "অপেক্ষা করুন..."}
            </div>
          </div>

          {/* GO button */}
          <button
            onClick={handleRoll}
            disabled={!canRoll}
            className={`shrink-0 w-16 h-14 rounded-2xl font-black text-lg border-2 transition-all active:scale-90 shadow-lg ${
              canRoll
                ? "bg-white text-gray-900 border-gray-300 shadow-[0_0_16px_rgba(255,255,255,0.4)] hover:bg-gray-100"
                : "bg-white/10 text-white/25 border-white/10 cursor-not-allowed"
            }`}
          >
            {rolling ? "⏳" : "GO"}
          </button>
        </div>

        {/* Forfeit */}
        {!showForfeit ? (
          <button
            onClick={() => setShowForfeit(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> খেলা ছেড়ে দিন (হার গণ্য)
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowForfeit(false)}
              className="py-2.5 text-sm font-bold bg-white/10 text-white rounded-xl hover:bg-white/20">
              বাতিল
            </button>
            <button onClick={handleForfeit}
              className="py-2.5 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700">
              হ্যাঁ, ছেড়ে দিন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
