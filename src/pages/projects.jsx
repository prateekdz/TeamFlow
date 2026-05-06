import { useState } from "react";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import {
  ArrowDownUp,
  CalendarDays,
  Check,
  FolderKanban,
  Grid2X2,
  List,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i).optional(),
});

const PRESET_COLORS = ["#6c63ff", "#3b82f6", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444"];

function getStatusBadge(project) {
  if (project.totalTasks > 0 && project.completedTasks === project.totalTasks) {
    return { label: "Completed", className: "success-pill" };
  }
  if (project.overdueTasks > 0) {
    return { label: "At Risk", className: "danger-pill" };
  }
  return { label: "Active", className: "accent-pill" };
}

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortMode, setSortMode] = useState("name");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createProjectMutation = useCreateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      color: PRESET_COLORS[0],
    },
  });

  const sortedProjects = [...(projects || [])].sort((a, b) => {
    if (sortMode === "progress") {
      const aProgress = a.totalTasks ? a.completedTasks / a.totalTasks : 0;
      const bProgress = b.totalTasks ? b.completedTasks / b.totalTasks : 0;
      return bProgress - aProgress;
    }
    if (sortMode === "tasks") {
      return b.totalTasks - a.totalTasks;
    }
    return a.name.localeCompare(b.name);
  });

  const selectedColor = watch("color");

  const onSubmit = (data) => {
    createProjectMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
          setIsCreateOpen(false);
          reset();
          toast({
            title: "Project created",
            description: "Your new project has been created successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Failed to create project",
            description: error.error || "An unexpected error occurred.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-8">
        <section className="surface-card rounded-[24px] p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Portfolio view
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">Projects</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Scan health, progress, and ownership across every active initiative without losing the high-signal details.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                    viewMode === "grid" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <Grid2X2 className="h-4 w-4" />
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                    viewMode === "list" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)]">
                <ArrowDownUp className="h-4 w-4" />
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value)}
                  className="bg-transparent text-[var(--text-primary)] outline-none"
                >
                  <option value="name">Sort by name</option>
                  <option value="progress">Sort by progress</option>
                  <option value="tasks">Sort by tasks</option>
                </select>
              </div>

              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="h-11 rounded-xl bg-[var(--accent)] px-5 text-white shadow-[0_18px_38px_rgba(108,99,255,0.24)] hover:bg-[var(--accent-hover)]">
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="surface-card max-w-[520px] rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-0">
                  <DialogHeader className="border-b border-[var(--border)] px-8 pb-6 pt-8 text-left">
                    <DialogTitle className="text-2xl font-semibold text-[var(--text-primary)]">Create New Project</DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-[var(--text-secondary)]">
                      Launch a new workspace for tasks, progress, and team collaboration.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 px-8 py-8">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-[var(--text-primary)]">
                        Project name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Redesign the onboarding experience"
                        {...register("name")}
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-ring"
                      />
                      {errors.name && <p className="error-shake text-xs text-[var(--danger)]">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-[var(--text-primary)]">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Summarize the goal, scope, or delivery outcome for this project."
                        {...register("description")}
                        className="min-h-[120px] rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-ring"
                      />
                      {errors.description && <p className="error-shake text-xs text-[var(--danger)]">{errors.description.message}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-[var(--text-primary)]">Accent color</Label>
                      <div className="flex flex-wrap gap-3">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setValue("color", color)}
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                              selectedColor === color
                                ? "scale-105 border-white/50 shadow-[0_0_0_3px_var(--accent-glow)]"
                                : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                          >
                            {selectedColor === color && <Check className="h-4 w-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                      Team member selection and due dates can be layered in later without changing the backend contract. This modal keeps creation aligned with currently supported fields.
                    </div>

                    <DialogFooter className="border-t border-[var(--border)] pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        onClick={() => setIsCreateOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createProjectMutation.isPending}
                        className="h-11 rounded-xl bg-[var(--accent)] px-5 text-white hover:bg-[var(--accent-hover)]"
                      >
                        {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {isLoading ? (
          viewMode === "grid" ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Skeleton key={item} className="shimmer h-[260px] rounded-[24px] bg-[var(--bg-hover)]" />
              ))}
            </div>
          ) : (
            <div className="surface-card overflow-hidden rounded-[24px]">
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="shimmer h-16 rounded-[18px] bg-[var(--bg-hover)]" />
                ))}
              </div>
            </div>
          )
        ) : sortedProjects.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {sortedProjects.map((project) => {
                const progress = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
                const status = getStatusBadge(project);
                return (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div className="surface-card group flex h-full cursor-pointer flex-col overflow-hidden rounded-[24px] hover:-translate-y-0.5">
                      <div className="h-2 w-full" style={{ backgroundColor: project.color || "var(--accent)" }} />
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`${status.className} rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]`}>
                            {status.label}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                onClick={(event) => event.preventDefault()}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="surface-card w-44 border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                              <DropdownMenuItem className="cursor-pointer focus:bg-[var(--bg-hover)]">Open project</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer focus:bg-[var(--bg-hover)]">View team</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="mt-5">
                          <h2 className="line-clamp-1 text-lg font-semibold text-[var(--text-primary)]">{project.name}</h2>
                          <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-[var(--text-secondary)]">
                            {project.description || "A focused project workspace for coordinating delivery and keeping execution visible."}
                          </p>
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-[var(--text-secondary)]">
                          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                            <div className="font-semibold text-[var(--text-primary)]">{project.totalTasks}</div>
                            <div className="mt-1">Tasks</div>
                          </div>
                          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                            <div className="font-semibold text-[var(--text-primary)]">{project.memberCount}</div>
                            <div className="mt-1">Members</div>
                          </div>
                          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
                            <div className="font-semibold text-[var(--text-primary)]">{project.overdueTasks}</div>
                            <div className="mt-1">At risk</div>
                          </div>
                        </div>

                        <div className="mt-6">
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <span className="text-[var(--text-secondary)]">Progress</span>
                            <span className="font-semibold text-[var(--text-primary)]">{progress}%</span>
                          </div>
                          <Progress
                            value={progress}
                            className="h-2 rounded-full bg-[var(--bg-secondary)]"
                            indicatorClassName="bg-gradient-to-r from-[var(--accent)] via-[var(--info)] to-[var(--success)]"
                          />
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {[0, 1, 2, 3].slice(0, Math.max(1, Math.min(4, project.memberCount))).map((index) => (
                              <div
                                key={`${project.id}-avatar-${index}`}
                                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bg-card)] bg-[var(--bg-secondary)] text-[10px] font-semibold text-[var(--text-primary)]"
                              >
                                {project.name.charAt(index).toUpperCase() || "T"}
                              </div>
                            ))}
                            {project.memberCount > 4 && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--bg-card)] bg-[var(--bg-hover)] text-[10px] font-semibold text-[var(--text-primary)]">
                                +{project.memberCount - 4}
                              </div>
                            )}
                          </div>

                          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                            {project.myRole}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="surface-card overflow-hidden rounded-[24px]">
              <div className="hidden grid-cols-[minmax(0,2fr)_120px_120px_120px_120px_140px_64px] gap-4 border-b border-[var(--border)] px-6 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] lg:grid">
                <div>Name</div>
                <div>Status</div>
                <div>Progress</div>
                <div>Members</div>
                <div>Tasks</div>
                <div>Due Date</div>
                <div />
              </div>

              <div className="divide-y divide-[var(--border)]">
                {sortedProjects.map((project) => {
                  const progress = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
                  const status = getStatusBadge(project);
                  return (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <div className="grid gap-4 px-5 py-4 hover:bg-[var(--bg-hover)] lg:grid-cols-[minmax(0,2fr)_120px_120px_120px_120px_140px_64px] lg:items-center lg:px-6">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-1 rounded-full" style={{ backgroundColor: project.color || "var(--accent)" }} />
                            <div className="min-w-0">
                              <div className="truncate font-semibold text-[var(--text-primary)]">{project.name}</div>
                              <div className="truncate text-sm text-[var(--text-secondary)]">
                                {project.description || "Project workspace"}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className={`${status.className} rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]`}>
                            {status.label}
                          </span>
                        </div>
                        <div className="text-sm text-[var(--text-primary)]">{progress}%</div>
                        <div className="text-sm text-[var(--text-primary)]">{project.memberCount}</div>
                        <div className="text-sm text-[var(--text-primary)]">{project.totalTasks}</div>
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <CalendarDays className="h-4 w-4" />
                          Rolling
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => event.preventDefault()}
                            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          <div className="surface-card flex flex-col items-center justify-center rounded-[24px] px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--accent-glow)] text-[var(--accent)]">
              <FolderKanban className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">No projects yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
              Create your first project to organize tasks, assign contributors, and make delivery visible across the team.
            </p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="mt-8 h-11 rounded-xl bg-[var(--accent)] px-5 text-white hover:bg-[var(--accent-hover)]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
