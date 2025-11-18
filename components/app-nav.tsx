import { Activity } from 'lucide-react';

export function AppNav({ currentPath = "/dashboard" }: { currentPath?: string }) {
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/conversations", label: "Conversations" },
    { href: "/clients", label: "Clients" },
    { href: "/evaluations", label: "Evaluations" },
    { href: "/instances", label: "Instances" },
    { href: "/models", label: "Models" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Sales Ops AI</h1>
        </div>
        <nav className="flex items-center gap-6">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                currentPath === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
