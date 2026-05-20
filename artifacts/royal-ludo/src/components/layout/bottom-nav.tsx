import { Link, useLocation } from "wouter";
import { Home, PlusCircle, Users, Wallet } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/add-cash", label: "Add Cash", icon: PlusCircle },
    { href: "/referrals", label: "Referrals", icon: Users },
    { href: "/wallet", label: "Wallet", icon: Wallet },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full max-w-[430px] mx-auto bg-card border-t border-white/10 pb-safe z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-primary text-glow" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-primary rounded-b-md shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}