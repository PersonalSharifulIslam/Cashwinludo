import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetMatchStatus } from "@workspace/api-client-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function Game() {
  const [, params] = useRoute("/game/:matchId");
  const matchId = params?.matchId;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: matchStatus } = useGetMatchStatus(matchId as string, {
    query: {
      enabled: !!matchId,
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResultSubmit = (result: "won" | "lost") => {
    setIsSubmitting(true);
    // In a real app we'd call an API here. The provided API spec doesn't explicitly have a result submission hook.
    // So we'll just mock it.
    setTimeout(() => {
      setIsSubmitting(false);
      toast({ title: "Result Submitted", description: "Waiting for admin verification." });
      setLocation("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pt-4 pb-20 space-y-6">
      {/* Top Header - Opponent */}
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-accent">
            <AvatarFallback className="bg-card text-accent font-bold">
              {matchStatus?.opponent?.substring(0, 2).toUpperCase() || "OP"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-bold text-white">{matchStatus?.opponent || "Opponent"}</div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-3 py-1 bg-card border border-white/10 rounded-full text-xs text-muted-foreground font-mono">
          ID: {matchId}
        </div>
      </div>

      {/* Game Board (Visual Representation) */}
      <div className="flex-1 flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
        <div className="w-full aspect-square max-w-[350px] bg-[#fffdf0] rounded-xl shadow-2xl relative p-3 border-4 border-yellow-800">
          <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-1 relative z-10">
            {/* Top Left - Red */}
            <div className="bg-red-600 rounded-tl-lg p-3 border-2 border-red-800">
              <div className="w-full h-full bg-white rounded-md grid grid-cols-2 grid-rows-2 gap-2 p-2">
                {[1,2,3,4].map(i => <div key={i} className="bg-red-600 rounded-full shadow-inner border border-red-800"></div>)}
              </div>
            </div>
            {/* Top Middle - Path */}
            <div className="bg-white grid grid-cols-3 grid-rows-6 gap-0.5">
              {Array.from({length: 18}).map((_, i) => (
                <div key={i} className={`border border-gray-300 ${i % 3 === 1 && i !== 1 ? 'bg-yellow-400' : ''}`}></div>
              ))}
            </div>
            {/* Top Right - Green */}
            <div className="bg-green-500 rounded-tr-lg p-3 border-2 border-green-700">
              <div className="w-full h-full bg-white rounded-md grid grid-cols-2 grid-rows-2 gap-2 p-2">
                {[1,2,3,4].map(i => <div key={i} className="bg-green-500 rounded-full shadow-inner border border-green-700"></div>)}
              </div>
            </div>

            {/* Middle Left - Path */}
            <div className="bg-white grid grid-rows-3 grid-cols-6 gap-0.5">
              {Array.from({length: 18}).map((_, i) => (
                <div key={i} className={`border border-gray-300 ${Math.floor(i / 6) === 1 && i !== 6 ? 'bg-red-500' : ''}`}></div>
              ))}
            </div>
            {/* Center Home */}
            <div className="bg-primary border-2 border-yellow-600 relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-inner">
                   <div className="w-8 h-8 bg-primary rounded-full"></div>
                 </div>
               </div>
            </div>
            {/* Middle Right - Path */}
            <div className="bg-white grid grid-rows-3 grid-cols-6 gap-0.5">
              {Array.from({length: 18}).map((_, i) => (
                <div key={i} className={`border border-gray-300 ${Math.floor(i / 6) === 1 && i !== 11 ? 'bg-blue-500' : ''}`}></div>
              ))}
            </div>

            {/* Bottom Left - Blue */}
            <div className="bg-blue-500 rounded-bl-lg p-3 border-2 border-blue-700">
              <div className="w-full h-full bg-white rounded-md grid grid-cols-2 grid-rows-2 gap-2 p-2">
                {[1,2,3,4].map(i => <div key={i} className="bg-blue-500 rounded-full shadow-inner border border-blue-700"></div>)}
              </div>
            </div>
            {/* Bottom Middle - Path */}
            <div className="bg-white grid grid-cols-3 grid-rows-6 gap-0.5">
              {Array.from({length: 18}).map((_, i) => (
                <div key={i} className={`border border-gray-300 ${i % 3 === 1 && i !== 16 ? 'bg-green-500' : ''}`}></div>
              ))}
            </div>
            {/* Bottom Right - Yellow */}
            <div className="bg-yellow-400 rounded-br-lg p-3 border-2 border-yellow-600">
              <div className="w-full h-full bg-white rounded-md grid grid-cols-2 grid-rows-2 gap-2 p-2">
                {[1,2,3,4].map(i => <div key={i} className="bg-yellow-400 rounded-full shadow-inner border border-yellow-600"></div>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Header - You */}
      <div className="px-4 flex items-center justify-between">
        <div>
          <div className="flex gap-1 mb-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-3 h-3 bg-red-500 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
            ))}
          </div>
          <div className="font-bold text-white text-lg">{user?.name}</div>
        </div>
        <Avatar className="w-16 h-16 border-2 border-primary shadow-[0_0_15px_rgba(255,215,0,0.4)]">
          <AvatarFallback className="bg-card text-primary font-bold text-xl">
            {user?.name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Actions */}
      <div className="px-4 mt-auto">
        <GlassCard className="p-4 bg-card/80">
          <h3 className="text-center font-bold text-white mb-4">Submit Match Result</h3>
          <div className="flex gap-3">
            <button 
              onClick={() => handleResultSubmit("won")}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-[0_0_10px_rgba(22,163,74,0.4)] active:scale-95 transition-all"
            >
              I Won
            </button>
            <button 
              onClick={() => handleResultSubmit("lost")}
              disabled={isSubmitting}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-[0_0_10px_rgba(220,38,38,0.4)] active:scale-95 transition-all"
            >
              I Lost
            </button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest">
            Submitting false results will lead to account ban
          </p>
        </GlassCard>
      </div>
    </div>
  );
}