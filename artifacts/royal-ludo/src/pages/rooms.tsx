import { useGetRooms, useJoinMatchmaking } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { GlassCard } from "@/components/ui/glass-card";
import { Users, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Rooms() {
  const { data: rooms, isLoading } = useGetRooms();
  const joinMatchMutation = useJoinMatchmaking();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleJoin = (roomId: number) => {
    joinMatchMutation.mutate(
      { data: { roomId } },
      {
        onSuccess: (res) => {
          if (res.matchId) {
            setLocation(`/searching/${res.matchId}`);
          } else {
            toast({ title: "Error", description: "Failed to get match ID", variant: "destructive" });
          }
        },
        onError: (err: any) => {
          toast({ 
            title: "Cannot join room", 
            description: err?.message || "Insufficient balance or room error.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-card/40 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]"></span>
          Ludo Rooms
        </h1>
      </div>

      <div className="space-y-4">
        {rooms?.filter(r => r.active).map(room => (
          <GlassCard key={room.id} className="p-4 relative overflow-hidden" style={{ borderLeftColor: room.color, borderLeftWidth: '4px' }}>
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-2xl" style={{ backgroundColor: room.color }}></div>
            
            <div className="flex justify-between items-start mb-2 relative z-10">
              <div>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 shadow-sm" style={{ backgroundColor: `${room.color}30`, color: room.color }}>
                  {room.label}
                </span>
                <h3 className="text-lg font-bold text-white">{room.name}</h3>
                <p className="text-xs text-muted-foreground">{room.tagline}</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-white/70 bg-black/40 px-2 py-1 rounded-md">
                <Users className="w-3 h-3 text-primary" />
                {room.playerCount} Players
              </div>
            </div>

            <div className="flex justify-between items-end mt-4 relative z-10">
              <div className="space-y-1">
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">1st Prize</div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-primary" />
                  <span className="text-xl font-bold text-primary text-glow">৳ {room.winnerPrize}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleJoin(room.id)}
                disabled={joinMatchMutation.isPending}
                className="bg-gradient-to-r from-primary to-yellow-600 hover:from-primary/90 hover:to-yellow-600/90 text-black font-bold px-6 py-2 rounded-lg shadow-[0_0_10px_rgba(255,215,0,0.4)] transform active:scale-95 transition-all"
              >
                Join ৳ {room.entryFee}
              </button>
            </div>
          </GlassCard>
        ))}

        {rooms?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No active rooms available right now.
          </div>
        )}
      </div>
    </div>
  );
}