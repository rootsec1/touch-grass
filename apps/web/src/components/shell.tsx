import type { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Skeleton } from "@touch-grass/ui/components/skeleton";
import { Button } from "@touch-grass/ui/components/button";
import {
  Leaf,
  BookOpen,
  Camera,
  Map,
  Compass,
  Settings,
  CloudOff,
} from "lucide-react";
import { useOnline, useUser } from "@/lib/use-journal";
import { cn } from "@touch-grass/ui/lib/utils";
import { Brand } from "@/components/brand";
const links = [
  { to: "/explore", label: "Today", icon: Leaf },
  { to: "/journal", label: "Journal", icon: BookOpen },
  { to: "/capture", label: "Capture", icon: Camera },
  { to: "/map", label: "Places", icon: Map },
  { to: "/challenges", label: "Wander", icon: Compass },
] as const;
export function Shell({ children }: { children: ReactNode }) {
  const path = useLocation({ select: (l) => l.pathname });
  const online = useOnline();
  const { user, pending } = useUser();
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="topbar">
        <Brand to="/explore" />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links
            .filter((l) => l.to !== "/capture")
            .map(({ to, label }) => (
              <Button
                key={to}
                variant="nav"
                aria-current={path.startsWith(to) ? "page" : undefined}
                nativeButton={false}
                render={<Link to={to} />}
              >
                {label}
              </Button>
            ))}
        </nav>
        <div className="topbar-end">
          {pending ? (
            <Skeleton
              className="h-8 w-11 rounded-full"
              aria-label="Loading account"
            />
          ) : user ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Settings"
              nativeButton={false}
              render={<Link to="/settings" />}
            >
              <Settings />
            </Button>
          ) : (
            <Button
              variant="ghost"
              nativeButton={false}
              render={<Link to="/login" search={{ mode: "signin" }} />}
            >
              Sign in
            </Button>
          )}
        </div>
      </header>
      {!online ? (
        <div className="offline-bar" role="status">
          <CloudOff className="inline mr-2" size={14} />
          Offline. You can still save photos to this device.
        </div>
      ) : null}
      <main id="main">{children}</main>
      <nav className="mobile-nav" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <Button
            key={to}
            variant="nav"
            className={cn(to === "/capture" && "capture-nav")}
            aria-current={path.startsWith(to) ? "page" : undefined}
            nativeButton={false}
            render={<Link to={to} />}
          >
            <span className="nav-icon">
              <Icon />
            </span>
            <span>{label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}
