import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetMatchStatus, useCancelMatchmaking } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function Searching() {
  const [, params] = useRoute("/searching/:matchId");
  const matchId = params?.matchId;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(30);
  const cancelMutation = useCancelMatchmaking();

  const { data: matchStatus } = useGetMatchStatus(matchId as string, {
    query: {
      enabled: !!matchId && timeLeft > 0,
      refetchInterval: 2000,
      queryKey: ["matchStatus", matchId]
    }
  });

  useEffect(() => {
    if (matchStatus?.status === "matched") {
      setTimeout(() => {
        setLocation(`/game/${matchId}`);
      }, 3000); // Show VS screen for 3 seconds
    } else if (matchStatus?.status === "cancelled") {
      toast({ title: "Match Cancelled", description: matchStatus.message });
      setLocation("/");
    }
  }, [matchStatus, setLocation, matchId, toast]);

  useEffect(() => {
    if (timeLeft <= 0 && matchStatus?.status === "searching") {
      cancelMutation.mutate(
        { data: { matchId: matchId! } },
        {
          onSuccess: () => {
            toast({ title: "Timeout", description: "No opponent found. Refund processed." });
            setLocation("/rooms");
          }
        }
      );
      return;
    }

    if (matchStatus?.status === "searching" && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, matchStatus?.status, matchId, cancelMutation, setLocation, toast]);

  if (matchStatus?.status === "matched") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-12">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background animate-pulse"></div>
        
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-primary to-accent z-10 animate-bounce">
          MATCH FOUND!
        </h1>

        <div className="flex items-center justify-between w-full max-w-sm z-10 relative">
          {/* Player 1 */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-20 h-20 border-4 border-primary shadow-[0_0_20px_rgba(255,215,0,0.5)]">
              <AvatarFallback className="text-xl bg-card">{user?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-white text-lg">{user?.name}</span>
          </div>

          <div className="text-3xl font-black text-accent italic -skew-x-12 px-4 py-2 bg-black/50 border border-accent/50 rounded-lg shadow-[0_0_15px_rgba(255,107,0,0.4)]">
            VS
          </div>

          {/* Player 2 */}
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-20 h-20 border-4 border-accent shadow-[0_0_20px_rgba(255,107,0,0.5)]">
              <AvatarFallback className="text-xl bg-card">{matchStatus.opponent?.substring(0, 2).toUpperCase() || "?"}</AvatarFallback>
            </Avatar>
            <span className="font-bold text-white text-lg">{matchStatus.opponent || "Opponent"}</span>
          </div>
        </div>

        <div className="z-10 text-xl font-bold text-primary animate-pulse">
          Starting game...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Radar animation circles */}
        <div className="absolute inset-0 border-2 border-primary/30 rounded-full animate-ping"></div>
        <div className="absolute inset-[-20px] border border-primary/20 rounded-full animate-pulse delay-100"></div>
        <div className="absolute inset-[-40px] border border-primary/10 rounded-full animate-pulse delay-200"></div>
        
        <div className="w-20 h-20 bg-card border-2 border-primary rounded-2xl rotate-45 flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.3)]">
          <div className="w-10 h-10 border-4 border-dashed border-primary rounded-full animate-spin"></div>
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Searching Opponent</h2>
        <p className="text-muted-foreground">Finding a worthy challenger for you...</p>
      </div>

      <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-muted-foreground">
        {timeLeft}s
      </div>

      <button 
        onClick={() => {
          cancelMutation.mutate({ data: { matchId: matchId! } }, {
            onSuccess: () => {
              toast({ title: "Cancelled", description: "Matchmaking cancelled, fee refunded." });
              setLocation("/rooms");
            }
          });
        }}
        disabled={cancelMutation.isPending}
        className="mt-8 px-6 py-2 bg-card border border-white/10 rounded-full text-white font-medium hover:bg-card/80 active:scale-95 transition-all"
      >
        {cancelMutation.isPending ? "Cancelling..." : "Cancel Search"}
      </button>
    </div>
  );
}