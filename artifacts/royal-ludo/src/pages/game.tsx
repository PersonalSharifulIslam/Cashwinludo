import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LudoBoard } from "@/components/game/ludo-board";
import { getValidMoves, type Color, type LudoGameState } from "@/lib/ludo-engine";
import { Crown, LogOut, Timer } from "lucide-react";

const API_BASE = "/api";
const TURN_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 600;

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

function DiceFace({ value, size = 36 }: { value: number | null; size?: number }) {
  if (value === null) return (
    <div className="flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="text-white/30 text-xs">?</div>
    </div>
  );
  const dots: Record<number, [number, number][]> = {
    1: [[50, 50]],
    2: [[25, 25], [75, 75]],
    3: [[25, 25], [50, 50], [75, 75]],
    4: [[25, 25], [75, 25], [25, 75], [75, 75]],
    5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
    6: [[25, 22], [75, 22], [25, 50], [75, 50], [25, 78], [75, 78]],
  };
  const d = dots[value] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <rect x={2} y={2} width={96} height={96} rx={16} fill="white" stroke="#ddd" strokeWidth={2} />
      {d.map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r={8} fill="#1a1a2e" />)}
    </svg>
  );
}

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
  const secs = Math.ceil(remaining / 1000);

  return (
    <div className="flex items-center gap-2">
      <Timer className="w-3.5 h-3.5" style={{ color }} />
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-100"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-bold font-mono w-5 text-right" style={{ color }}>
        {secs}s
      </span>
    </div>
  );
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
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const skipPendingRef = useRef(false);
  const didStart = useRef(false);

  const startGame = useCallback(async () => {
    if (!matchId || didStart.current) return;
    try {
      await gameAPI(`/game/${matchId}/start`, "POST");
      didStart.current = true;
    } catch {
      // Already started or error, continue
      didStart.current = true;
    }
  }, [matchId]);

  const fetchState = useCallback(async () => {
    if (!matchId) return;
    try {
      const data = await gameAPI(`/game/${matchId}/state`);
      setGameData(data);
      setLoading(false);
      if (data.game?.diceValue !== null) {
        setLocalDice(data.game.diceValue);
      } else {
        setLocalDice(null);
      }
      if (data.game?.status === "finished") {
        const won = data.game.winnerId === user?.id;
        setGameOver({ won, prize: data.prize });
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch (e: any) {
      if (e.message?.includes("Game not started")) {
        await startGame();
      }
    }
  }, [matchId, user?.id, startGame]);

  useEffect(() => {
    if (!matchId) return;
    startGame().then(() => fetchState());
    pollRef.current = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [matchId, fetchState, startGame]);

  // Auto-skip on timer expiry
  useEffect(() => {
    if (!gameData || gameData.game.status !== "playing") return;
    if (!gameData.isMyTurn) return;

    const elapsed = Date.now() - new Date(gameData.game.turnStartedAt).getTime();
    const remaining = TURN_TIMEOUT_MS - elapsed;
    if (remaining <= 0) {
      // Timer already expired
      if (!skipPendingRef.current) {
        skipPendingRef.current = true;
        gameAPI(`/game/${matchId}/skip`, "POST")
          .finally(() => { skipPendingRef.current = false; fetchState(); });
      }
      return;
    }

    const timer = setTimeout(() => {
      if (!skipPendingRef.current) {
        skipPendingRef.current = true;
        gameAPI(`/game/${matchId}/skip`, "POST")
          .finally(() => { skipPendingRef.current = false; fetchState(); });
      }
    }, remaining);

    return () => clearTimeout(timer);
  }, [gameData?.game.turnStartedAt, gameData?.isMyTurn]);

  // Forfeit on page leave
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameData && gameData.game.status === "playing") {
        const token = localStorage.getItem("royal_ludo_token");
        navigator.sendBeacon(`${API_BASE}/game/${matchId}/forfeit`, JSON.stringify({}));
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [matchId, gameData]);

  const handleRoll = async () => {
    if (!gameData?.isMyTurn || gameData.game.diceValue !== null || rolling) return;
    setRolling(true);
    try {
      const result = await gameAPI(`/game/${matchId}/roll`, "POST");
      setLocalDice(result.diceValue);
      if (result.autoSkip) {
        toast({
          title: result.gameOver ? "Game Over" : "Auto Skip",
          description: result.gameOver
            ? "You lost - no valid moves 3 times!"
            : `No valid moves (skip ${result.skipCount}/${3})`,
          variant: result.gameOver ? "destructive" : "default",
        });
      }
      await fetchState();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRolling(false);
    }
  };

  const handleTokenClick = async (tokenIdx: number) => {
    if (!gameData?.isMyTurn || gameData.game.diceValue === null || moving) return;
    setMoving(true);
    try {
      const result = await gameAPI(`/game/${matchId}/move`, "POST", { tokenIndex: tokenIdx });
      if (result.gameOver) {
        setGameOver({ won: true, prize: gameData.prize });
        if (pollRef.current) clearInterval(pollRef.current);
      }
      await fetchState();
    } catch (e: any) {
      toast({ title: "Invalid Move", description: e.message, variant: "destructive" });
    } finally {
      setMoving(false);
    }
  };

  const handleForfeit = async () => {
    try {
      await gameAPI(`/game/${matchId}/forfeit`, "POST");
      setLocation("/");
    } catch {
      setLocation("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground text-sm">Loading game...</p>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[360px] text-center space-y-6">
          <div className={`text-8xl ${gameOver.won ? "animate-bounce" : ""}`}>
            {gameOver.won ? "🏆" : "😞"}
          </div>
          <div>
            <h1 className={`text-3xl font-black mb-2 ${gameOver.won ? "text-yellow-400" : "text-red-400"}`}>
              {gameOver.won ? "আপনি জিতেছেন!" : "হেরে গেছেন!"}
            </h1>
            {gameOver.won && (
              <p className="text-green-400 font-bold text-xl">৳{gameOver.prize.toFixed(2)} পেয়েছেন</p>
            )}
            {!gameOver.won && (
              <p className="text-muted-foreground text-sm mt-1">আরও ভালো লাগবে পরের বার!</p>
            )}
          </div>
          <button
            onClick={() => setLocation("/")}
            className="w-full py-4 bg-primary text-black font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.4)] hover:bg-primary/90 active:scale-95 transition-all"
          >
            হোমে যান
          </button>
        </div>
      </div>
    );
  }

  if (!gameData) return null;

  const { game, myColor, isMyTurn, player1, player2 } = gameData;
  const myName = myColor === "red" ? player1.name : player2?.name || "You";
  const oppName = myColor === "red" ? player2?.name || "Opponent" : player1.name;
  const opponentColor = myColor === "red" ? "blue" : "red";
  const opponentSkips = opponentColor === "red" ? game.redSkips : game.blueSkips;
  const mySkips = myColor === "red" ? game.redSkips : game.blueSkips;

  const myTokens = myColor === "red" ? game.redTokens as number[] : game.blueTokens as number[];
  const oppTokens = myColor === "red" ? game.blueTokens as number[] : game.redTokens as number[];
  const diceForMoves = localDice ?? game.diceValue;
  const validMoves = isMyTurn && diceForMoves !== null
    ? getValidMoves(myTokens, oppTokens, diceForMoves, myColor)
    : [];

  const canRoll = isMyTurn && game.diceValue === null && !rolling;
  const waitingForMove = isMyTurn && game.diceValue !== null;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden" style={{ maxWidth: 430, margin: "0 auto" }}>
      {/* Opponent Header */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="w-10 h-10 border-2" style={{ borderColor: opponentColor === "red" ? "#E53E3E" : "#3182CE" }}>
            <AvatarFallback className="bg-card font-bold text-sm"
              style={{ color: opponentColor === "red" ? "#E53E3E" : "#3182CE" }}>
              {oppName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-white text-sm">{oppName}</div>
            <div className="flex gap-1 items-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i < (3 - opponentSkips) ? (opponentColor === "red" ? "bg-red-400" : "bg-blue-400") : "bg-white/20"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] text-muted-foreground">Prize</div>
            <div className="text-sm font-bold text-primary">৳{gameData.prize}</div>
          </div>
          {!game.currentTurn || game.currentTurn !== myColor ? (
            <div className="px-2 py-1 rounded-full text-[10px] font-bold" style={{
              backgroundColor: opponentColor === "red" ? "rgba(229,62,62,0.2)" : "rgba(49,130,206,0.2)",
              color: opponentColor === "red" ? "#FC8181" : "#90CDF4",
              border: `1px solid ${opponentColor === "red" ? "#E53E3E44" : "#3182CE44"}`,
            }}>
              ▶ চালু
            </div>
          ) : null}
        </div>
      </div>

      {/* Turn Timer - only shows when it's your turn */}
      {isMyTurn && game.status === "playing" && (
        <div className="px-4 pb-1">
          <TimerBar startedAt={game.turnStartedAt} timeoutMs={TURN_TIMEOUT_MS} />
        </div>
      )}

      {/* Status bar */}
      <div className="px-4 pb-2">
        <div className={`text-center text-xs font-medium py-1.5 rounded-lg border ${isMyTurn
          ? "bg-primary/10 border-primary/30 text-primary animate-pulse"
          : "bg-white/5 border-white/10 text-muted-foreground"
        }`}>
          {isMyTurn
            ? waitingForMove
              ? "✨ গুটি বেছে নিন"
              : "🎲 ডাইস রোল করুন"
            : `⏳ ${oppName}-এর পালা`}
        </div>
      </div>

      {/* Ludo Board */}
      <div className="px-2 flex-1 flex items-center">
        <LudoBoard
          redTokens={game.redTokens as number[]}
          blueTokens={game.blueTokens as number[]}
          myColor={myColor}
          currentTurn={game.currentTurn as Color}
          diceValue={localDice ?? game.diceValue}
          validMoves={validMoves}
          onTokenClick={handleTokenClick}
          disabled={!isMyTurn || game.diceValue === null || moving}
        />
      </div>

      {/* My Bottom Controls */}
      <div className="px-4 pt-2 pb-4 space-y-2">
        {/* Player info + dice + roll */}
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border-2 shrink-0" style={{ borderColor: myColor === "red" ? "#E53E3E" : "#3182CE" }}>
            <AvatarFallback className="bg-card font-bold text-sm"
              style={{ color: myColor === "red" ? "#E53E3E" : "#3182CE" }}>
              {myName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{myName} <span className="text-[10px] text-muted-foreground">(আপনি)</span></div>
            <div className="flex gap-1 items-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < (3 - mySkips) ? (myColor === "red" ? "bg-red-400" : "bg-blue-400") : "bg-white/20"}`} />
              ))}
            </div>
          </div>

          {/* Dice display */}
          <div className="shrink-0">
            <DiceFace value={localDice ?? game.diceValue} size={44} />
          </div>

          {/* Roll button */}
          <button
            onClick={handleRoll}
            disabled={!canRoll}
            className={`shrink-0 font-black text-sm px-4 py-2.5 rounded-xl border-2 transition-all active:scale-95 ${canRoll
              ? "bg-white text-black border-gray-300 shadow-[0_0_12px_rgba(255,255,255,0.3)] hover:bg-gray-100"
              : "bg-white/10 text-white/30 border-white/10 cursor-not-allowed"
            }`}
          >
            {rolling ? "..." : "GO"}
          </button>
        </div>

        {/* Skip/Wait indicator */}
        {mySkips > 0 && (
          <div className="text-center text-[10px] text-orange-400">
            ⚠️ আপনি {mySkips} বার মিস করেছেন (৩ বারে হার)
          </div>
        )}

        {/* Forfeit button */}
        {!showForfeitConfirm ? (
          <button
            onClick={() => setShowForfeitConfirm(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> খেলা ছেড়ে দিন (হার গণ্য হবে)
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowForfeitConfirm(false)}
              className="py-2 text-xs font-bold bg-white/10 text-white rounded-xl hover:bg-white/20">
              বাতিল
            </button>
            <button onClick={handleForfeit}
              className="py-2 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700">
              হ্যাঁ, ছেড়ে দিন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
