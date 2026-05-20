import { useAuth } from "@/lib/auth-context";
import { useGetTelegramLink } from "@workspace/api-client-react";
import { Link } from "wouter";
import { GlassCard } from "@/components/ui/glass-card";
import { MessageCircle, Send } from "lucide-react";

export default function Home() {
  const { data: telegramData } = useGetTelegramLink();

  const games = [
    { id: "ludo", name: "Ludo Classic", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffaed?auto=format&fit=crop&q=80&w=400&h=300", badge: "Hot" },
    { id: "speed-ludo", name: "Speed Ludo", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffaed?auto=format&fit=crop&q=80&w=400&h=300", badge: "Fast" },
    { id: "tezz-ludo", name: "Tezz Ludo", image: "https://images.unsplash.com/photo-1610890716171-6b1bb98ffaed?auto=format&fit=crop&q=80&w=400&h=300", badge: "New" },
  ];

  return (
    <div className="pb-24 space-y-6">
      {/* Banner */}
      <GlassCard variant="neon" className="p-4 bg-gradient-to-r from-primary/20 to-accent/20 border-accent/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white text-glow mb-1">Join Telegram Channel</h2>
            <p className="text-xs text-muted-foreground">Get daily updates and promo codes</p>
          </div>
          <a 
            href={telegramData?.telegramLink || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          >
            <Send className="w-5 h-5 ml-[-2px]" />
          </a>
        </div>
      </GlassCard>

      {/* All Games */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]"></span>
          All Games
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {games.map((game, i) => (
            <Link key={game.id} href="/rooms">
              <GlassCard className="relative h-32 group cursor-pointer overflow-hidden transform transition-all duration-300 hover:scale-[1.02]">
                <img 
                  src={game.image} 
                  alt={game.name} 
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent"></div>
                <div className="absolute top-3 right-3 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,107,0,0.8)]">
                  {game.badge}
                </div>
                <div className="absolute bottom-4 left-4">
                  <h3 className="text-xl font-bold text-white text-glow">{game.name}</h3>
                  <p className="text-xs text-primary font-medium">Play & Win Real Cash</p>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>

      {/* Floating Chat */}
      <div className="fixed bottom-24 right-4 z-40">
        <button className="w-14 h-14 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.6)] text-black hover:scale-110 transition-transform">
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}