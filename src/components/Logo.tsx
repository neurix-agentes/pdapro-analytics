import { Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

export function Logo({ size = "md", withText = true }: LogoProps) {
  const dim = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const text = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className={`${dim} relative rounded-xl bg-gradient-to-br from-primary to-primary/40 flex items-center justify-center glow-primary transition-transform group-hover:scale-105`}>
        <Activity className="h-1/2 w-1/2 text-primary-foreground" strokeWidth={2.5} />
        <div className="absolute inset-0 rounded-xl ring-1 ring-primary/30" />
      </div>
      {withText && (
        <div className="flex items-baseline gap-1.5">
          <span className={`${text} font-bold tracking-tight font-[var(--font-display)]`}>PDA</span>
          <span className={`${text} font-light text-muted-foreground`}>Sport</span>
        </div>
      )}
    </Link>
  );
}
