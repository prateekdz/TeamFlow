import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Command, Menu, Search, Settings, LogOut } from "lucide-react";
import { useClerk, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { getListProjectsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/theme";

function getInitials(name) {
  if (!name) return "TF";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getAvatarTone(seed) {
  const tones = [
    "from-violet-500 to-indigo-500",
    "from-sky-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-fuchsia-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-rose-500 to-red-500",
  ];
  const value = (seed || "teamflow")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return tones[value % tones.length];
}

function breadcrumbForLocation(location) {
  const items = [{ label: "Home", href: "/dashboard" }];

  if (location.startsWith("/projects")) {
    items.push({ label: "Projects", href: "/projects" });
  }

  const projectMatch = location.match(/^\/projects\/(\d+)/);
  if (projectMatch) {
    items.push({ label: `Project ${projectMatch[1]}`, href: `/projects/${projectMatch[1]}` });
  }

  if (/^\/projects\/\d+\/members$/.test(location)) {
    items.push({ label: "Team", href: location });
  }

  if (/^\/projects\/\d+\/tasks\/\d+$/.test(location)) {
    items.push({ label: "Task Detail", href: location });
  }

  if (location.startsWith("/settings")) {
    items.push({ label: "Settings", href: "/settings" });
  }

  return items;
}

function mobileNavItems(currentProjectId) {
  const items = [
    { id: "dashboard", label: "Dashboard", path: "/dashboard", iconName: "dashboard" },
    { id: "projects", label: "Projects", path: "/projects", iconName: "projects" },
  ];

  if (currentProjectId) {
    items.push({ id: "team", label: "Team", path: `/projects/${currentProjectId}/members`, iconName: "team" });
  }

  items.push({ id: "settings", label: "Settings", path: "/settings", iconName: "settings" });
  return items;
}

function isMobileItemActive(pathname, item) {
  if (item.id === "dashboard") return pathname === "/dashboard";
  if (item.id === "projects") return /^\/projects(?:\/\d+)?(?:\/tasks\/\d+)?$/.test(pathname);
  if (item.id === "team") return /^\/projects\/\d+\/members$/.test(pathname);
  if (item.id === "settings") return /^\/settings(?:\/.*)?$/.test(pathname);
  return false;
}

function MobileIcon({ iconName, className = "" }) {
  if (iconName === "dashboard") {
    return <div className={`h-4 w-4 rounded-[4px] border border-current ${className}`} />;
  }
  if (iconName === "projects") {
    return <div className={`h-4 w-4 rounded-sm border border-current ${className}`} />;
  }
  if (iconName === "team") {
    return <div className={`h-4 w-4 rounded-full border border-current ${className}`} />;
  }
  return <Settings className={`h-4 w-4 ${className}`} />;
}

export function Layout({ children }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentProjectMatch = location.match(/^\/projects\/(\d+)/);
  const currentProjectId = currentProjectMatch ? Number(currentProjectMatch[1]) : 0;

  const [persistedProjectId, setPersistedProjectId] = useState(() => {
    const stored = localStorage.getItem("tf-last-project");
    return stored ? Number(stored) : 0;
  });

  useEffect(() => {
    if (currentProjectId) {
      setPersistedProjectId(currentProjectId);
      localStorage.setItem("tf-last-project", String(currentProjectId));
    }
  }, [currentProjectId]);

  // Fall back to first project in cache if localStorage is empty
  const cachedProjects = queryClient.getQueryData(getListProjectsQueryKey()) ?? [];
  const firstCachedProjectId = cachedProjects[0]?.id ?? 0;
  const activeProjectId = currentProjectId || persistedProjectId || firstCachedProjectId;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        setCollapsed(true);
      }
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const profileName =
    user?.fullName || user?.firstName || "Team member";
  const profileEmail =
    user?.primaryEmailAddress?.emailAddress || "";
  const roleBadge = "Member";
  const breadcrumbItems = useMemo(
    () => breadcrumbForLocation(location),
    [location],
  );
  const pageTitle =
    breadcrumbItems[breadcrumbItems.length - 1]?.label ||
    (location === "/dashboard" ? "Dashboard" : "Workspace");
  const profileTone = getAvatarTone(profileName);
  const mobileItems = useMemo(() => mobileNavItems(activeProjectId), [activeProjectId]);

  return (
    <div className="app-shell-grid bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <aside
        className={`surface-glass hidden h-screen flex-col border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-secondary)_92%,transparent)] transition-all duration-300 md:flex ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <Sidebar
          pathname={location}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onCloseMobile={closeMobileMenu}
          profileName={profileName}
          profileImageUrl={user?.imageUrl}
          roleBadge={roleBadge}
          currentProjectId={activeProjectId}
          basePath={basePath}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSignOut={handleSignOut}
        />
      </aside>

      <main className="min-w-0">
        <header className="surface-glass sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-[var(--border)] px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-xs text-[var(--text-secondary)]">
                {breadcrumbItems.map((item, index) => (
                  <div key={`${item.label}-${item.href}`} className="flex items-center gap-2">
                    {index > 0 && <span className="text-[var(--text-muted)]">/</span>}
                    {index === breadcrumbItems.length - 1 ? (
                      <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
                    ) : (
                      <Link href={item.href} className="hover:text-[var(--text-primary)]">
                        {item.label}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
              <div className="truncate text-sm font-semibold text-[var(--text-primary)] md:hidden">
                {pageTitle}
              </div>
            </div>
          </div>

          <div className="hidden flex-1 justify-center md:flex">
            <div className="group relative w-full max-w-[280px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)]" />
              <Input
                type="search"
                placeholder="Search tasks, projects, people"
                className="h-10 rounded-xl border-[var(--border)] bg-[var(--bg-card)] pl-9 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-ring"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-muted)]">
                <Command className="h-3 w-3" />
                K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="surface-card mt-2 w-[320px] border-[var(--border)] bg-[var(--bg-card)] p-0 text-[var(--text-primary)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <div>
                    <div className="font-semibold">Notifications</div>
                    <div className="text-xs text-[var(--text-secondary)]">Recent project activity</div>
                  </div>
                </div>
                <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                  No recent notifications.
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-2 py-1.5 text-left hover:bg-[var(--bg-hover)]">
                  <Avatar className="h-8 w-8 border border-[var(--border)]">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback
                      className={`bg-gradient-to-br ${profileTone} text-xs font-semibold text-white`}
                    >
                      {getInitials(profileName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden min-w-0 md:block">
                    <div className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {profileName}
                    </div>
                    <div className="truncate text-xs text-[var(--text-secondary)]">
                      {profileEmail}
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="surface-card mt-2 w-64 border-[var(--border)] bg-[var(--bg-card)] p-1 text-[var(--text-primary)]"
              >
                <DropdownMenuLabel className="px-3 py-3">
                  <div className="text-sm font-semibold">{profileName}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{profileEmail}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--border)]" />
                <Link href="/settings">
                  <DropdownMenuItem className="cursor-pointer rounded-xl px-3 py-2.5 text-[var(--text-primary)] focus:bg-[var(--bg-hover)]">
                    <Settings className="mr-2 h-4 w-4 text-[var(--text-secondary)]" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl px-3 py-2.5 text-[var(--danger)] focus:bg-[rgba(239,68,68,0.12)] focus:text-[var(--danger)]"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="mobile-safe mx-auto w-full max-w-[1600px] px-4 py-6 md:px-6 lg:px-8">
          <div className="page-enter">{children}</div>
        </div>
      </main>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={closeMobileMenu}
          />
          <aside className="surface-glass fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-secondary)_92%,transparent)] md:hidden">
            <Sidebar
              pathname={location}
              collapsed={false}
              onToggleCollapse={() => {}}
              onCloseMobile={closeMobileMenu}
              profileName={profileName}
              profileImageUrl={user?.imageUrl}
              roleBadge={roleBadge}
              currentProjectId={activeProjectId}
              basePath={basePath}
              theme={theme}
              onToggleTheme={toggleTheme}
              onSignOut={handleSignOut}
              mobile
            />
          </aside>
        </>
      )}

      <nav className="surface-glass fixed bottom-3 left-3 right-3 z-40 flex items-center justify-around rounded-[22px] border border-[var(--border)] px-2 py-2 md:hidden">
        {mobileItems.map((item) => {
          const active = isMobileItemActive(location, item);
          return (
            <Link key={`mobile-${item.id}`} href={item.path}>
              <button
                type="button"
                onClick={closeMobileMenu}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] ${
                  active ? "bg-[var(--accent-glow)] text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
                }`}
              >
                <MobileIcon iconName={item.iconName} className={active ? "text-[var(--accent)]" : ""} />
                <span className="truncate">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
