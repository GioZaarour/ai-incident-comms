"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ListChecks, History } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Submit Brief", icon: AlertTriangle },
  { href: "/queue", label: "Queue", icon: ListChecks },
  { href: "/history", label: "History", icon: History },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-tight text-foreground"
        >
          INCIDENT COMMS
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
