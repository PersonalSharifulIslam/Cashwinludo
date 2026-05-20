import { useAuth } from "@/lib/auth-context";
import { useGetTelegramLink, useGetRooms, getGetRoomsQueryKey, getGetWalletQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Send, RefreshCcw, Gamepad2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const GAME_TYPES = [
  {
    id: "ludo",
    name: "LUDO",
    subtitle: "Classic Battle",
    gradient: "from-purple-700 via-indigo-700 to-blue-800",
    glow: "rgba(139,92,246,0.6)",
    accent: "#a78bfa",
    dots: ["#7c3aed", "#4f46e5", "#1d4ed8"],
    icon: (
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-xl grid grid-cols-2 gap-0.5 p-1 bg-white/10 rotate-6">
          <div className="rounded-sm bg-red-500/80"></div>
          <div className="rounded-sm bg-green-500/80"></div>
          <div className="rounded-sm bg-yellow-500/80"></div>
          <div className="rounded-sm bg-blue-500/80"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/70"></div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "speed-ludo",
    name: "SPEED LUDO",
    subtitle: "Fast & Furious",
    gradient: "from-blue-700 via-cyan-700 to-teal-700",
    glow: "rgba(6,182,212,0.6)",
    accent: "#22d3ee",
    dots: ["#0369a1", "#0891b2", "#0f766e"],
    icon: (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="w-12 h-12 rounded-lg bg-white/15 flex items-center justify-center shadow-inner rotate-12">
          <div className="text-2xl font-black text-white" style={{ textShadow: "0 0 10px rgba(255,255,255,0.8)" }}>
            ⚡
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-md bg-white/10 flex items-center justify-center rotate-6">
          <div className="grid grid-cols-3 gap-0.5 p-1">
            {[1,0,1,0,1,0,1,0,1].map((v,i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${v ? 'bg-white/80' : 'bg-white/20'}`}></div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tezz-ludo",
    name: "TEZZ LEEDO",
    subtitle: "Ultimate Stakes",
    gradient: "from-orange-700 via-red-700 to-rose-800",
    glow: "rgba(251,146,60,0.6)",
    accent: "#fb923c",
    dots: ["#c2410c", "#b91c1c", "#9f1239"],
    icon: (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="text-3xl" style={{ filter: "drop-shadow(0 0 8px rgba(251,146,60,0.9))" }}>🔥</div>
        <div className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-md bg-white/10 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-0.5 p-1">
            {[1,1,0,0,1,0,1,1,1].map((v,i) => (
              <div key={i} className={`w-1 h-1 rounded-full ${v ? 'bg-white/80' : 'bg-white/20'}`}></div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

export default function Home() {
  const { data: telegramData } = useGetTelegramLink();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="pb-24 space-y-5">

      {/* All Games Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            All Games
          </h2>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors bg-card/50 px-3 py-1.5 rounded-full border border-white/5"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {GAME_TYPES.map((game) => (
            <Link key={game.id} href="/rooms">
              <div
                className={`relative rounded-2xl overflow-hidden cursor-pointer active:scale-95 transition-all duration-200`}
                style={{
                  background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  boxShadow: `0 4px 20px ${game.glow}`,
                  aspectRatio: "1",
                }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`}></div>

                {/* Decorative circles */}
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full opacity-20"
                  style={{ backgroundColor: game.accent }}
                ></div>
                <div
                  className="absolute -bottom-3 -left-3 w-12 h-12 rounded-full opacity-15"
                  style={{ backgroundColor: game.accent }}
                ></div>

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 9px)`
                  }}
                ></div>

                <div className="relative z-10 flex flex-col items-center justify-center h-full p-2 gap-1">
                  <div className="scale-75">{game.icon}</div>
                  <div className="text-center">
                    <div
                      className="text-[11px] font-black text-white leading-tight tracking-wide"
                      style={{ textShadow: `0 0 8px ${game.glow}` }}
                    >
                      {game.name}
                    </div>
                    <div className="text-[8px] text-white/60 font-medium mt-0.5">{game.subtitle}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Telegram Banner */}
      {telegramData?.telegramLink && (
        <a
          href={telegramData.telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #1a6fa8, #2196f3, #42a5f5)" }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)"
              }}
            ></div>
            <div className="relative flex items-center gap-4 p-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 shadow-lg">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">Join Telegram</div>
                <div className="text-white/80 text-xs mt-0.5">To get all the latest news</div>
              </div>
              <div className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                Join now
              </div>
            </div>
          </div>
        </a>
      )}

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/rooms" className="block">
          <div className="rounded-xl p-4 border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
            <div className="text-xs text-muted-foreground mb-1">Play Now</div>
            <div className="text-base font-bold text-primary">Ludo Rooms</div>
            <div className="text-[10px] text-muted-foreground mt-1">6 rooms available</div>
          </div>
        </Link>
        <Link href="/referrals" className="block">
          <div className="rounded-xl p-4 border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer">
            <div className="text-xs text-muted-foreground mb-1">Refer & Earn</div>
            <div className="text-base font-bold text-accent">Invite Friends</div>
            <div className="text-[10px] text-muted-foreground mt-1">Get bonus per referral</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
