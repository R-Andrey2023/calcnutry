import { Link, useLocation } from "wouter";
import { Activity, Apple, UtensilsCrossed, Heart } from "lucide-react";
import { cn } from "./lib/utils";

export default function NavBar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Início", icon: Activity },
    { href: "/alimentos", label: "Alimentos", icon: Apple },
    { href: "/prato", label: "Meu Prato", icon: UtensilsCrossed },
    { href: "/favoritos", label: "Favoritos", icon: Heart },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-card border-t border-border/50 pb-safe z-50">
      <div className="flex items-center justify-around h-16 max-w-xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors group">
              <div className={cn(
                "p-1.5 rounded-xl transition-all duration-300",
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}