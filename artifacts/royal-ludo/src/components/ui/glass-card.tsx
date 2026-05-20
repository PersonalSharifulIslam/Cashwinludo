import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "gold" | "neon";
  onClick?: () => void;
}

export function GlassCard({ children, className, style, variant = "default", onClick }: GlassCardProps) {
  const baseClasses = "rounded-xl overflow-hidden transition-all duration-300";
  
  const variants = {
    default: "glass hover:bg-card/80",
    gold: "glass-gold",
    neon: "bg-card/40 backdrop-blur-md border border-accent/30 shadow-[0_0_15px_rgba(255,107,0,0.15)] hover:border-accent/60"
  };

  return (
    <div 
      className={cn(baseClasses, variants[variant], className)}
      style={style}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}