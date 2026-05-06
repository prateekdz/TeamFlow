import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProject, useListTasks, useCreateTask, getGetProjectQueryKey, getListTasksQueryKey, getGetMyTasksQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpCircle,
  Calendar,
  KanbanSquare,
  List,
  Plus,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const columnOrder = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getPriorityMeta(priority) {
  switch ((priority || "").toLowerCase()) {
    case "high":
    case "urgent":
      return { dot: "bg-[var(--danger)]", pill: "danger-pill", label: "High" };
    case "medium":
      return { dot: "bg-[var(--warning)]", pill: "warning-pill", label: "Medium" };
    case "low":
      return { dot: "bg-[var(--info)]", pill: "info-pill", label: "Low" };
    default:
      return { dot: "bg-[var(--text-muted)]", pill: "accent-pill", label: "Normal" };
  }
}

function getStatusBadge(status) {
  if (status === "todo") return "accent-pill";
  if (status === "in_progress") return "info-pill";
  if (status === "done") return "success-pill";
  if (status === "cancelled") return "danger-pill";
  return "accent-pill";
}

export default function ProjectDetail() {
  const { projectId: projectIdStr } = useParams();
  const projectId = parseInt(projectIdStr || "0", 10);
  const [viewMode, setViewMode] = useState("kanban");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [inlineComposerStatus, setInlineComposerStatus] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPriority, setDraftPriority] = useState("medium");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const queryParams = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (priorityFilter !== "all") queryParams.priority = priorityFilter;

  const { data: tasks, isLoading: isLoadingTasks } = useListTasks(
    projectId,
    queryParams,
    {
      query: { enabled: !!projectId, queryKey: getListTasksQueryKey(projectId, queryParams) },
    },
  );

  const createTaskMutation = useCreateTask();

  const filteredTasks = (tasks || []).filter((task) => {
    if (!searchText.trim()) return true;
    const query = searchText.trim().toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description || "").toLowerCase().includes(query)
    );
  });

  const columnTasks = columnOrder.map((column) => ({
    ...column,
    tasks: filteredTasks.filter((task) => task.status === column.key),
  }));

  const handleCreateTask = (status) => {
    if (!draftTitle.trim()) return;
    createTaskMutation.mutate(
      {
        projectId,
        data: {
          title: draftTitle.trim(),
          priority: draftPriority,
          status,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId, queryParams) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          queryClient.refetchQueries({ queryKey: getGetMyTasksQueryKey() });
          queryClient.refetchQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setDraftTitle("");
          setDraftPriority("medium");
          setInlineComposerStatus("");
          toast({
            title: "Task created",
            description: "Your task was added to the board.",
          });
        },
        onError: (error) => {
          toast({
            title: "Failed to create task",
            description: error.error || "An unexpected error occurred.",
            variant: "destructive",
          });
        },
      },
    );
  };

  if (isLoadingProject) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="shimmer h-7 w-40 rounded-lg bg-[var(--bg-hover)]" />
          <Skeleton className="shimmer h-32 rounded-[24px] bg-[var(--bg-hover)]" />
          <Skeleton className="shimmer h-[420px] rounded-[24px] bg-[var(--bg-hover)]" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="surface-card rounded-[24px] px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Project not found</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Link href="/projects">
            <Button className="mt-6 h-11 rounded-xl bg-[var(--accent)] px-5 text-white">Back to Projects</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const projectProgress = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
  const isAdmin = project.myRole === "admin";

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-8">
        <section className="surface-card rounded-[24px] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Link href="/projects" className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Projects
            </Link>
            <span>/</span>
            <span className="font-medium text-[var(--text-primary)]">{project.name}</span>
          </div>

          <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Task workspace
              </div>
              <div className="flex items-start gap-4">
                <div className="mt-1 h-14 w-2 rounded-full" style={{ backgroundColor: project.color || "var(--accent)" }} />
                <div>
                  <h1 className="text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">{project.name}</h1>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                    {project.description || "Manage work across stages, keep execution visible, and create new tasks inline without leaving the board."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Progress", `${projectProgress}%`, "accent-pill"],
                  ["Tasks", `${project.totalTasks}`, "info-pill"],
                  ["Members", `${project.memberCount}`, "success-pill"],
                ].map(([label, value, tone]) => (
                  <div key={label} className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                    <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tone}`}>{label}</div>
                    <div className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href={`/projects/${project.id}/members`}>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Team
                </Button>
              </Link>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              <Button
                className="h-11 rounded-xl bg-[var(--accent)] px-5 text-white shadow-[0_18px_38px_rgba(108,99,255,0.24)] hover:bg-[var(--accent-hover)]"
                onClick={() => setInlineComposerStatus("todo")}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
          </div>
        </section>

        <section className="surface-card rounded-[24px] p-4 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row">
              <div className="group relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search tasks, descriptions, or keywords"
                  className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] pl-9 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-ring"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11 min-w-[150px] rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-11 min-w-[150px] rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    viewMode === "kanban" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <KanbanSquare className="h-4 w-4" />
                    Kanban
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    viewMode === "list" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)]"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <List className="h-4 w-4" />
                    List
                  </span>
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                {filteredTasks.length} tasks
              </div>
            </div>
          </div>
        </section>

        {viewMode === "kanban" ? (
          <section className="grid gap-4 xl:grid-cols-4">
            {columnTasks.map((column) => (
              <div key={column.key} className="surface-panel min-h-[420px] rounded-[20px] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-[var(--text-primary)]">{column.label}</h2>
                      <span className="accent-pill rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                        {column.tasks.length}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setInlineComposerStatus(column.key);
                      setDraftPriority("medium");
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {inlineComposerStatus === column.key && (
                    <div className="rounded-[18px] border border-[rgba(108,99,255,0.18)] bg-[var(--bg-card)] p-4 shadow-[0_16px_32px_rgba(108,99,255,0.12)]">
                      <Input
                        value={draftTitle}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        placeholder="Quick task title"
                        className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-ring"
                      />
                      <div className="mt-3">
                        <Select value={draftPriority} onValueChange={setDraftPriority}>
                          <SelectTrigger className="h-10 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                            <SelectValue placeholder="Priority" />
                          </SelectTrigger>
                          <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-9 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                          onClick={() => {
                            setInlineComposerStatus("");
                            setDraftTitle("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="h-9 rounded-xl bg-[var(--accent)] px-4 text-white hover:bg-[var(--accent-hover)]"
                          disabled={createTaskMutation.isPending}
                          onClick={() => handleCreateTask(column.key)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  )}

                  {isLoadingTasks ? (
                    [1, 2, 3].map((item) => (
                      <Skeleton key={item} className="shimmer h-36 rounded-[18px] bg-[var(--bg-hover)]" />
                    ))
                  ) : column.tasks.length > 0 ? (
                    column.tasks.map((task) => {
                      const priority = getPriorityMeta(task.priority);
                      return (
                        <Link key={task.id} href={`/projects/${project.id}/tasks/${task.id}`}>
                          <div className="group rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition-all hover:-translate-y-0.5 hover:border-[rgba(108,99,255,0.18)] hover:shadow-[0_18px_36px_rgba(0,0,0,0.22)]">
                            <div className={`mb-3 h-1 w-10 rounded-full ${priority.dot}`} />
                            <div className="font-semibold text-[var(--text-primary)]">{task.title}</div>
                            <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-6 text-[var(--text-secondary)]">
                              {task.description || "Open the task to add more context, comments, and ownership details."}
                            </p>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <span className={`${priority.pill} rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]`}>
                                {priority.label}
                              </span>
                              <span className={`${getStatusBadge(task.status)} rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]`}>
                                {task.status.replace("_", " ")}
                              </span>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-7 w-7 border border-[var(--border)]">
                                  <AvatarImage src={task.assignee?.avatarUrl || undefined} />
                                  <AvatarFallback className="bg-[var(--bg-secondary)] text-[10px] text-[var(--text-primary)]">
                                    {getInitials(task.assignee?.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{task.assignee?.name || "Unassigned"}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                                  : "No date"}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="rounded-[18px] border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                      No tasks in {column.label.toLowerCase()}.
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        ) : (
          <section className="surface-card overflow-hidden rounded-[24px]">
            {isLoadingTasks ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <Skeleton key={item} className="shimmer h-20 rounded-[18px] bg-[var(--bg-hover)]" />
                ))}
              </div>
            ) : filteredTasks.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {filteredTasks.map((task) => {
                  const priority = getPriorityMeta(task.priority);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
                  return (
                    <Link key={task.id} href={`/projects/${project.id}/tasks/${task.id}`}>
                      <div className={`grid gap-4 px-5 py-4 hover:bg-[var(--bg-hover)] lg:grid-cols-[minmax(0,2fr)_140px_120px_120px_80px] lg:items-center ${
                        isOverdue ? "border-l-4 border-l-[var(--danger)]" : ""
                      }`}>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-[var(--text-primary)]">{task.title}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                            <span className={`status-dot ${priority.dot}`} />
                            <span>{priority.label}</span>
                            <span>T-{task.id}</span>
                            {isOverdue && <span className="text-[var(--danger)]">Overdue</span>}
                          </div>
                        </div>
                        <div>
                          <span className={`${getStatusBadge(task.status)} rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]`}>
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                            : "No date"}
                        </div>
                        <div className="text-sm text-[var(--text-secondary)]">{task.assignee?.name || "Unassigned"}</div>
                        <div className="flex justify-end">
                          <ArrowUpCircle className={`h-4 w-4 ${priority.dot.replace("bg-", "text-")}`} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                  <AlertCircle className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[var(--text-primary)]">No tasks found</h3>
                <p className="mt-2 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
                  Try clearing filters or add a new task inline to populate the board.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}
