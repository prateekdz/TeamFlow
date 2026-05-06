import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function SidebarItemButton({ item, collapsed, isActive, onClick }) {
  return (
    <Link href={item.path}>
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center rounded-xl border text-sm transition-all ${
          collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5"
        } ${
          isActive
            ? "border-[rgba(108,99,255,0.18)] bg-[var(--accent-glow)] text-[var(--text-primary)] shadow-[inset_2px_0_0_var(--accent)]"
            : "border-transparent text-[var(--text-secondary)] hover:border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        }`}
      >
        <item.icon
          className={`h-4 w-4 shrink-0 ${
            isActive
              ? "text-[var(--accent)]"
              : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
          }`}
        />
        {!collapsed && <span className="truncate font-medium">{item.label}</span>}
      </button>
    </Link>
  );
}

export default function SidebarItem({ item, collapsed = false, isActive = false, onClick }) {
  const content = (
    <SidebarItemButton item={item} collapsed={collapsed} isActive={isActive} onClick={onClick} />
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}
