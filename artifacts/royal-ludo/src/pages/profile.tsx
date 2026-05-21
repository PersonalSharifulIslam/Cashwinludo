import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import { useGetMatchHistory } from "@workspace/api-client-react";
import { LogOut, Trophy, Target, History, Camera, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

const AVATAR_KEY = "royal_ludo_avatar";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: matchHistory, isLoading } = useGetMatchHistory();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "ছবি বড়", description: "সর্বোচ্চ ২MB ছবি দিন", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      localStorage.setItem(AVATAR_KEY, data);
      setAvatar(data);
      toast({ title: "ছবি আপডেট হয়েছে ✓" });
    };
    reader.readAsDataURL(file);
  };

  const totalMatches = (user?.wins || 0) + (user?.losses || 0);
  const winRate = totalMatches > 0 ? Math.round(((user?.wins || 0) / totalMatches) * 100) : 0;

  return (
    <div className="pb-28 space-y-5">
      {/* Back button */}
      <button
        onClick={() => setLocation("/")}
        className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> হোমে ফিরুন
      </button>

      {/* Profile Header */}
      <GlassCard className="p-6 text-center border-t-4 border-t-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent" />
        <div className="relative z-10 flex flex-col items-center">
          {/* Avatar with upload */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full border-4 border-primary shadow-xl overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-primary flex items-center justify-center">
                  <span className="text-black font-black text-3xl">
                    {user?.name?.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background shadow-lg hover:bg-primary/80 active:scale-90 transition-all"
            >
              <Camera className="w-4 h-4 text-black" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">{user?.name}</h1>
          <p className="text-muted-foreground text-sm font-mono bg-black/30 px-3 py-1 rounded-full">
            {user?.phone}
          </p>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center">
          <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{user?.wins ?? 0}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">জিত</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Target className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{user?.losses ?? 0}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">হার</div>
        </GlassCard>
        <GlassCard className="p-4 text-center bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="text-2xl font-bold text-primary">{winRate}%</div>
          <div className="text-[10px] text-primary/70 uppercase tracking-wider mt-3">Win Rate</div>
        </GlassCard>
      </div>

      {/* Logout Button — prominently placed */}
      <button
        onClick={handleLogout}
        className="w-full py-4 flex items-center justify-center gap-2 text-red-400 font-bold bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-colors text-base"
      >
        <LogOut className="w-5 h-5" /> লগ আউট
      </button>

      {/* Match History */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          সাম্প্রতিক ম্যাচ
        </h2>
        <div className="space-y-3">
          {isLoading ? (
            <div className="h-24 bg-card/40 rounded-xl animate-pulse" />
          ) : !matchHistory?.length ? (
            <div className="text-center py-8 text-muted-foreground bg-card/20 rounded-xl">
              এখনো কোনো ম্যাচ খেলেননি।
            </div>
          ) : (
            matchHistory.map(match => {
              const isWinner = match.winnerName === user?.name;
              const isLoss = match.winnerName !== null && match.winnerName !== undefined && !isWinner;
              const borderColor = isWinner ? "border-l-green-500" : isLoss ? "border-l-red-500" : "border-l-yellow-500";
              return (
                <GlassCard key={match.id} className={`p-4 border-l-4 ${borderColor}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(match.createdAt).toLocaleDateString("bn-BD")}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWinner ? "bg-green-500/20 text-green-400" : isLoss ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {isWinner ? "জিত ✓" : isLoss ? "হার ✗" : "অমীমাংসিত"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-white">
                      <span className="font-bold">{match.player1Name}</span>
                      <span className="text-muted-foreground mx-2">vs</span>
                      <span className="font-bold">{match.player2Name || "?"}</span>
                    </div>
                    <div className={`font-bold ${isWinner ? "text-green-400" : "text-red-400"}`}>
                      {isWinner ? `+৳${match.prize}` : isLoss ? `-৳${match.entryFee}` : ""}
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
