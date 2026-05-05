import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, Settings, LogOut, Plus } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  // Upsert user into database
  useGetMe({
    query: {
      enabled: !!user?.id,
      staleTime: Infinity,
    }
  });

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
  ];

  return (
    <div className="min-h-screen flex bg-background w-full">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-sidebar flex flex-col hidden md:flex h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2">
            <img src={`${basePath}/logo.svg`} alt="Logo" className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">ShipHub</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-2 px-2">
            Overview
          </div>
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{user?.fullName}</span>
              <span className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Link href="/settings">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm" data-testid="nav-settings">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" size="sm" onClick={handleSignOut} data-testid="button-signout">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b flex items-center px-6 md:hidden sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            <img src={`${basePath}/logo.svg`} alt="Logo" className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">ShipHub</span>
          </div>
        </div>
        <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}