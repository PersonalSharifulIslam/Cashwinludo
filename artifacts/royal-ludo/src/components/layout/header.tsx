import { useAuth } from "@/lib/auth-context";
import { useGetWallet } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, RefreshCcw, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function Header() {
  const { user } = useAuth();
  const { data: wallet, refetch: refetchWallet } = useGetWallet();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    await refetchWallet();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass border-b-0 rounded-b-2xl mb-4 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/profile">
          <Avatar className="h-10 w-10 border-2 border-primary shadow-[0_0_10px_rgba(255,215,0,0.3)]">
            <AvatarFallback className="bg-secondary text-primary font-bold">
              {user?.name?.substring(0, 2).toUpperCase() || "RL"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Welcome</span>
          <span className="text-sm font-bold text-white truncate max-w-[120px]">
            {user?.name || "Player"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={handleRefresh}
          className="p-2 rounded-full bg-secondary/50 text-white hover:text-primary transition-colors"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
        
        <Link href="/notifications" className="p-2 rounded-full bg-secondary/50 text-white hover:text-primary transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-destructive rounded-full border border-card"></span>
        </Link>

        <Link href="/add-cash">
          <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full pl-3 pr-1 py-1 cursor-pointer hover:bg-primary/20 transition-all">
            <span className="text-sm font-bold text-primary text-glow">
              ৳ {wallet?.totalBalance?.toFixed(2) || "0.00"}
            </span>
            <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-[0_0_8px_rgba(255,215,0,0.5)]">
              <Plus className="w-3 h-3" strokeWidth={3} />
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
}