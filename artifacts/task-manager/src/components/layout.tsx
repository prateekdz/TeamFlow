import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, FolderKanban, Settings, LogOut, ChevronLeft, Menu, Search, Sun, Moon } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/lib/theme";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
    <div className="min-h-screen flex bg-[var(--bg-primary)] text-[var(--text-primary)] w-full">
      {/* Sidebar */}
      <aside 
        className={`fixed md:sticky top-0 z-50 h-screen border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col transition-all duration-300 ease-in-out ${
          collapsed ? "w-16" : "w-60"
        } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)]">
          <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}>
            <img src={`${basePath}/logo.svg`} alt="Logo" className="w-6 h-6 shrink-0" />
            <span className="font-bold tracking-tight text-[var(--text-primary)]">TeamFlow</span>
          </div>
          {collapsed && (
            <div className="w-full flex justify-center">
              <img src={`${basePath}/logo.svg`} alt="Logo" className="w-6 h-6 shrink-0" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className={`shrink-0 h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hidden md:flex ${collapsed ? "hidden" : ""}`}
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto px-2">
          {!collapsed && (
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-2">
              Menu
            </div>
          )}
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            const content = (
              <div
                className={`flex items-center rounded-lg transition-colors cursor-pointer text-sm font-medium h-9 ${
                  collapsed ? "justify-center w-9 mx-auto" : "px-3 gap-3 w-full"
                } ${
                  isActive
                    ? "bg-[var(--accent-glow)] border-l-2 border-[var(--accent)] text-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] border-l-2 border-transparent"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </div>
            );

            return (
              <Link key={item.href} href={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>{content}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : content}
              </Link>
            );
          })}
        </div>

        <div className="p-2 border-t border-[var(--border)]">
          {/* Theme toggle */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-full justify-center h-9 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] mb-1"
                  onClick={toggleTheme}
                  data-testid="button-theme-toggle"
                >
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{theme === "dark" ? "Light mode" : "Dark mode"}</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-9 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] mb-1"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 mr-2 shrink-0" /> : <Moon className="w-4 h-4 mr-2 shrink-0" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </Button>
          )}

          <Link href="/settings">
            {collapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" className="w-full justify-center h-9 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="ghost" className="w-full justify-start h-9 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] mb-1" size="sm">
                <Settings className="w-4 h-4 mr-2 shrink-0" />
                Settings
              </Button>
            )}
          </Link>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" className="w-full justify-center h-9 text-[var(--text-secondary)] hover:bg-[var(--danger)] hover:text-white" size="icon" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign Out</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="ghost" className="w-full justify-start h-9 text-[var(--text-secondary)] hover:bg-[var(--danger)] hover:text-white" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2 shrink-0" />
              Sign Out
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-40 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden text-[var(--text-secondary)]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="hidden sm:flex relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" />
              <Input 
                placeholder="Search..." 
                className="w-64 bg-[var(--bg-card)] border-[var(--border)] pl-9 h-9 text-sm focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8 border border-[var(--border)] cursor-pointer hover:ring-2 ring-[var(--accent)] transition-all">
                  <AvatarImage src={user?.imageUrl} />
                  <AvatarFallback className="bg-[var(--bg-card)] text-xs text-[var(--text-secondary)]">
                    {user?.firstName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <p className="text-sm font-medium leading-none truncate">{user?.fullName}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-[var(--border)]" />
                <DropdownMenuItem className="cursor-pointer hover:bg-[var(--bg-hover)]">
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="w-4 h-4 mr-2 text-[var(--text-secondary)]" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer hover:bg-[var(--danger)] hover:text-white text-[var(--danger)]" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
      
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}