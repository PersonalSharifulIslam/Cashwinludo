import { useAuth } from "@/lib/auth-context";
import { GlassCard } from "@/components/ui/glass-card";
import { useGetMatchHistory } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Trophy, Target, History } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const { user, logout } = useAuth();
  const { data: matchHistory, isLoading } = useGetMatchHistory();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const totalMatches = (user?.wins || 0) + (user?.losses || 0);
  const winRate = totalMatches > 0 ? Math.round(((user?.wins || 0) / totalMatches) * 100) : 0;

  return (
    <div className="pb-24 space-y-6">
      {/* Profile Header */}
      <GlassCard className="p-6 text-center border-t-4 border-t-primary relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent"></div>
        <div className="relative z-10 flex flex-col items-center">
          <Avatar className="w-24 h-24 border-4 border-card shadow-xl mb-4">
            <AvatarFallback className="bg-primary text-black font-black text-3xl">
              {user?.name?.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold text-white mb-1">{user?.name}</h1>
          <p className="text-muted-foreground text-sm font-mono bg-black/30 px-3 py-1 rounded-full">{user?.phone}</p>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard className="p-4 text-center">
          <Trophy className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{user?.wins}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Wins</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <Target className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{user?.losses}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Losses</div>
        </GlassCard>
        <GlassCard className="p-4 text-center bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
          <div className="w-6 h-6 text-primary mx-auto mb-2 font-black">%</div>
          <div className="text-2xl font-bold text-primary">{winRate}%</div>
          <div className="text-[10px] text-primary/70 uppercase tracking-wider mt-1">Win Rate</div>
        </GlassCard>
      </div>

      {/* Match History */}
      <div>
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Recent Matches
        </h2>
        <div className="space-y-3">
          {isLoading ? (
            <div className="h-24 bg-card/40 rounded-xl animate-pulse"></div>
          ) : matchHistory?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-card/20 rounded-xl">No matches played yet.</div>
          ) : (
            matchHistory?.map(match => {
              const isWinner = match.winnerName === user?.name;
              return (
                <GlassCard key={match.id} className={`p-4 border-l-4 ${isWinner ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-muted-foreground bg-black/30 px-2 py-0.5 rounded">{match.roomName}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(match.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{match.player1Name}</span>
                      <span className="text-xs text-accent italic">VS</span>
                      <span className="font-bold text-white">{match.player2Name || '?'}</span>
                    </div>
                    <div className={`font-bold ${isWinner ? 'text-green-400' : 'text-red-400'}`}>
                      {isWinner ? `+ ৳${match.prize}` : `- ৳${match.entryFee}`}
                    </div>
                  </div>
                </GlassCard>
              );
            })
          )}
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full py-4 flex items-center justify-center gap-2 text-red-500 font-bold bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Log Out
      </button>
    </div>
  );
}