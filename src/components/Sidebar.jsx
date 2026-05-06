import { useMemo } from "react";
import { Link } from "wouter";
import SidebarItem from "@/components/SidebarItem";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ChevronLeft,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  Users,
  Shield,
} from "lucide-react";

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

function resolveActiveItem(pathname, items) {
  const matchers = [
    { id: "team", test: /^\/projects\/\d+\/members$/ },
    { id: "settings", test: /^\/settings(?:\/.*)?$/ },
    { id: "projects", test: /^\/projects(?:\/\d+)?(?:\/tasks\/\d+)?$/ },
    { id: "dashboard", test: /^\/dashboard$/ },
  ];

  const matched = matchers.find((entry) => entry.test.test(pathname));
  if (!matched) return null;

  return items.some((item) => item.id === matched.id) ? matched.id : null;
}

export default function Sidebar({
  pathname,
  collapsed,
  onToggleCollapse,
  onCloseMobile,
  profileName,
  profileImageUrl,
  roleBadge,
  currentProjectId,
  basePath,
  theme,
  onToggleTheme,
  onSignOut,
  mobile = false,
}) {
  const profileTone = getAvatarTone(profileName);

  const items = useMemo(() => {
    const navItems = [
      { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { id: "projects", label: "Projects", path: "/projects", icon: FolderKanban },
    ];

    if (currentProjectId) {
      navItems.push({
        id: "team",
        label: "Team",
        path: `/projects/${currentProjectId}/members`,
        icon: Users,
      });
    }

    navItems.push({ id: "settings", label: "Settings", path: "/settings", icon: Settings });
    return navItems;
  }, [currentProjectId]);

  const activeItem = resolveActiveItem(pathname, items);

  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-[var(--border)] px-3">
        <Link href="/dashboard">
          <button type="button" onClick={onCloseMobile} className="flex items-center gap-3 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--info)] shadow-[0_10px_24px_rgba(108,99,255,0.24)]">
              <img src={`${basePath}/logo.svg`} alt="TeamFlow" className="h-5 w-5 brightness-200" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">TeamFlow</div>
                <div className="truncate text-xs text-[var(--text-muted)]">ShipHub workspace</div>
              </div>
            )}
          </button>
        </Link>

        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className={`hidden h-8 w-8 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] md:inline-flex ${
              collapsed ? "rotate-180" : ""
            }`}
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
          </Button>
        )}
      </div>

      <div className={`border-b border-[var(--border)] px-3 py-4 ${collapsed ? "items-center" : ""}`}>
        <div className={`surface-panel flex items-center gap-3 rounded-2xl p-3 ${collapsed ? "justify-center px-2" : ""}`}>
          <Avatar className="h-10 w-10 border border-[var(--border)]">
            <AvatarImage src={profileImageUrl} />
            <AvatarFallback className={`bg-gradient-to-br ${profileTone} text-sm font-semibold text-white`}>
              {getInitials(profileName)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate font-medium text-[var(--text-primary)]">{profileName}</div>
              <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                {roleBadge === "Admin" ? (
                  <Shield className="h-3 w-3 text-[var(--accent)]" />
                ) : (
                  <Users className="h-3 w-3 text-[var(--info)]" />
                )}
                {roleBadge}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4">
        {!collapsed && (
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Workspace
          </div>
        )}
        <div className="space-y-1.5">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              collapsed={collapsed}
              isActive={activeItem === item.id}
              onClick={onCloseMobile}
            />
          ))}
        </div>

        {!collapsed && (
          <>
            <div className="mt-6 px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              Admin
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-3 text-xs text-[var(--text-secondary)]">
              {currentProjectId
                ? "Manage project members from the Team view."
                : "Open a project to access team management."}
            </div>
          </>
        )}
      </div>

      <div className="border-t border-[var(--border)] p-2">
        <div className="space-y-1">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-full rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  onClick={onToggleTheme}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Button
              variant="ghost"
              className="h-10 w-full justify-start rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              onClick={onToggleTheme}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            </Button>
          )}

          <Button
            variant="ghost"
            className={`h-10 rounded-xl text-[var(--text-secondary)] hover:bg-[rgba(239,68,68,0.12)] hover:text-[var(--danger)] ${
              collapsed ? "w-full justify-center px-0" : "w-full justify-start"
            }`}
            onClick={onSignOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </>
  );
}
