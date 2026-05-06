import { memo, useState } from "react";
import { useGetDashboardSummary, useGetMyTasks, useGetRecentActivity, useListProjects } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CirclePlus,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/react";

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
    case "urgent":
    case "high":
      return { dot: "bg-[var(--danger)]", label: "High priority" };
    case "medium":
      return { dot: "bg-[var(--warning)]", label: "Medium priority" };
    case "low":
      return { dot: "bg-[var(--info)]", label: "Low priority" };
    default:
      return { dot: "bg-[var(--text-muted)]", label: "Normal priority" };
  }
}

function getStatusPill(status) {
  const value = (status || "").toLowerCase();
  if (value === "todo") return "accent-pill";
  if (value === "in_progress") return "info-pill";
  if (value === "done") return "success-pill";
  if (value === "cancelled") return "danger-pill";
  return "accent-pill";
}

function getActivityTone(action) {
  if (action.includes("created")) return "border-[var(--success)]";
  if (action.includes("updated")) return "border-[var(--info)]";
  if (action.includes("completed")) return "border-[var(--accent)]";
  return "border-[var(--border)]";
}

const MetricCard = memo(function MetricCard({ icon: Icon, label, value, helper, tone, loading = false }) {
  return (
    <div className="surface-card rounded-[28px] p-6">
      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-8">
        <div className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-[var(--text-primary)]">
          {loading ? <Skeleton className="shimmer h-9 w-20 rounded-lg bg-[var(--bg-hover)]" /> : value}
        </div>
        <div className="mt-3 text-sm font-medium text-[var(--text-primary)]">{label}</div>
        <div className="mt-1 text-sm text-[var(--text-secondary)]">{helper}</div>
      </div>
    </div>
  );
});

export default function Dashboard() {
  const { user } = useUser();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: myTasks, isLoading: isLoadingTasks } = useGetMyTasks();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { data: projects } = useListProjects();
  const [taskFilter, setTaskFilter] = useState("all");

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const tasks = myTasks || [];
  const filteredTasks =
    taskFilter === "overdue"
      ? tasks.filter((task) => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done")
      : taskFilter === "mine"
        ? tasks
        : tasks;

  const topProjects = (projects || []).slice(0, 3);
  const focusTask = filteredTasks[0];

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
          <div className="surface-card rounded-[32px] p-7 sm:p-9">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              <CalendarClock className="h-3.5 w-3.5 text-[var(--accent)]" />
              Today
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-[var(--text-primary)] sm:text-5xl">
              {greeting}, {user?.firstName || "there"}.
            </h1>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">{currentDate}</p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
              A calm view of what matters today. Review the work in motion, clear overdue tasks first,
              and keep project momentum visible without hunting for context.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/projects">
                <Button className="h-12 rounded-full bg-[var(--accent)] px-6 text-white shadow-[0_18px_38px_rgba(0,113,227,0.22)] hover:bg-[var(--accent-hover)]">
                  <CirclePlus className="mr-2 h-4 w-4" />
                  New Task
                </Button>
              </Link>
              <Link href="/projects">
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-[var(--border)] bg-[var(--bg-secondary)] px-6 text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  Open Projects
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="surface-card rounded-[32px] p-7">
            <div className="text-sm font-medium text-[var(--text-secondary)]">Focus now</div>
            {isLoadingTasks ? (
              <div className="mt-5 space-y-3">
                <Skeleton className="shimmer h-7 w-3/4 rounded-lg bg-[var(--bg-hover)]" />
                <Skeleton className="shimmer h-24 rounded-[20px] bg-[var(--bg-hover)]" />
              </div>
            ) : focusTask ? (
              <>
                <div className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                  {focusTask.title}
                </div>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                  {focusTask.description || "Open this task to add implementation detail, collaborators, and next steps."}
                </p>

                <div className="mt-6 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`${getStatusPill(focusTask.status)} rounded-full px-3 py-1 text-[11px] font-semibold`}>
                      {focusTask.status.replace("_", " ")}
                    </span>
                    <span className="accent-pill rounded-full px-3 py-1 text-[11px] font-semibold">
                      {focusTask.project.name}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-[var(--border)]">
                        <AvatarImage src={focusTask.assignee?.avatarUrl || undefined} />
                        <AvatarFallback className="bg-[var(--bg-card)] text-xs text-[var(--text-primary)]">
                          {getInitials(focusTask.assignee?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {focusTask.assignee?.name || "Unassigned"}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {getPriorityMeta(focusTask.priority).label}
                        </div>
                      </div>
                    </div>
                    {focusTask.dueDate && (
                      <div className="text-right text-xs text-[var(--text-secondary)]">
                        <div>Due</div>
                        <div className="mt-1 text-sm text-[var(--text-primary)]">
                          {new Date(focusTask.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-14 text-center">
                <div className="text-lg font-semibold text-[var(--text-primary)]">You&apos;re clear for now.</div>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">
                  No active tasks are competing for attention.
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={ListTodo}
            label="Open tasks"
            value={summary?.myOpenTasks || 0}
            helper="Work currently assigned across projects."
            tone="bg-[var(--accent-glow)] text-[var(--accent)]"
            loading={isLoadingSummary}
          />
          <MetricCard
            icon={BriefcaseBusiness}
            label="In progress"
            value={tasks.filter((task) => task.status === "in_progress").length}
            helper="Tasks actively moving through delivery."
            tone="bg-[rgba(59,130,246,0.12)] text-[var(--info)]"
            loading={isLoadingTasks}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Completed this week"
            value={summary?.completedThisWeek || 0}
            helper="Proof that the system is moving."
            tone="bg-[rgba(34,197,94,0.12)] text-[var(--success)]"
            loading={isLoadingSummary}
          />
          <MetricCard
            icon={AlertTriangle}
            label="Overdue"
            value={summary?.overdueTasks || 0}
            helper="Items that need a decision today."
            tone="bg-[rgba(239,68,68,0.12)] text-[var(--danger)]"
            loading={isLoadingSummary}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="surface-card overflow-hidden rounded-[32px]">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] px-7 py-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Task pulse</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">One clean list of what deserves attention.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] p-1">
                {[
                  ["all", "All"],
                  ["mine", "My Tasks"],
                  ["overdue", "Overdue"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTaskFilter(key)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                      taskFilter === key
                        ? "bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(0,113,227,0.22)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              {isLoadingTasks ? (
                <div className="space-y-3 p-3">
                  {[1, 2, 3, 4].map((item) => (
                    <Skeleton key={item} className="shimmer h-24 rounded-[22px] bg-[var(--bg-hover)]" />
                  ))}
                </div>
              ) : filteredTasks.length > 0 ? (
                <div className="space-y-3">
                  {filteredTasks.slice(0, 6).map((task) => {
                    const priority = getPriorityMeta(task.priority);
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "done";
                    return (
                      <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                        <div
                          className={`group flex flex-col gap-4 rounded-[24px] border bg-[var(--bg-card)] px-5 py-4 transition-all hover:border-[rgba(0,113,227,0.18)] hover:bg-[var(--bg-hover)] md:flex-row md:items-center md:justify-between ${
                            isOverdue ? "border-l-4 border-l-[var(--danger)]" : "border-[var(--border-subtle)]"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)] ${task.status === "done" ? "line-strike text-[var(--text-muted)]" : ""}`}>
                                {task.title}
                              </span>
                              <span className="accent-pill rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                                {task.project.name}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--text-secondary)]">
                              <span className={`status-dot ${priority.dot}`} />
                              <span>{priority.label}</span>
                              {task.dueDate && (
                                <span className={isOverdue ? "text-[var(--danger)]" : ""}>
                                  Due {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className={`${getStatusPill(task.status)} rounded-full px-3 py-1 text-[11px] font-semibold`}>
                              {task.status.replace("_", " ")}
                            </span>
                            <Avatar className="h-9 w-9 border border-[var(--border)]">
                              <AvatarImage src={task.assignee?.avatarUrl || undefined} />
                              <AvatarFallback className="bg-[var(--bg-secondary)] text-[10px] text-[var(--text-primary)]">
                                {getInitials(task.assignee?.name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-18 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-card)] text-[var(--accent)]">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[var(--text-primary)]">No tasks in focus</h3>
                  <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
                    Create or assign a task to start shaping today&apos;s work.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="surface-card overflow-hidden rounded-[32px]">
              <div className="border-b border-[var(--border)] px-7 py-6">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Recent activity</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">A quiet feed of the work moving around you.</p>
              </div>
              <div className="p-4">
                {isLoadingActivity ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => (
                      <Skeleton key={item} className="shimmer h-16 rounded-[20px] bg-[var(--bg-hover)]" />
                    ))}
                  </div>
                ) : activity?.length ? (
                  <div className="space-y-3">
                    {activity.slice(0, 5).map((item) => (
                      <div key={item.id} className={`rounded-[20px] border-l-2 bg-[var(--bg-secondary)] px-4 py-4 ${getActivityTone(item.action)}`}>
                        <div className="flex items-start gap-3">
                          <Avatar className="h-9 w-9 border border-[var(--border)]">
                            <AvatarImage src={item.actorAvatarUrl || undefined} />
                            <AvatarFallback className="bg-[var(--bg-card)] text-xs text-[var(--text-primary)]">
                              {getInitials(item.actorName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm leading-6 text-[var(--text-secondary)]">
                              <span className="font-medium text-[var(--text-primary)]">{item.actorName}</span> {item.action}{" "}
                              <span className="font-medium text-[var(--text-primary)]">{item.taskTitle}</span>
                            </p>
                            <div className="mt-2 text-xs text-[var(--text-muted)]">
                              {new Date(item.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-14 text-center text-sm text-[var(--text-secondary)]">
                    No recent activity to show.
                  </div>
                )}
              </div>
            </div>

            <div className="surface-card overflow-hidden rounded-[32px]">
              <div className="border-b border-[var(--border)] px-7 py-6">
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">Project momentum</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">A quick read on where progress is healthy.</p>
              </div>
              <div className="space-y-3 p-4">
                {topProjects.length > 0 ? (
                  topProjects.map((project) => {
                    const progress = project.totalTasks > 0 ? Math.round((project.completedTasks / project.totalTasks) * 100) : 0;
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 hover:border-[rgba(0,113,227,0.18)] hover:bg-[var(--bg-hover)]">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
                                {project.name}
                              </div>
                              <div className="mt-1 text-xs text-[var(--text-secondary)]">
                                {project.completedTasks}/{project.totalTasks} tasks complete
                              </div>
                            </div>
                            <span className="accent-pill rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
                              {progress}%
                            </span>
                          </div>
                          <div className="mt-4 progress-animate">
                            <Progress
                              value={progress}
                              className="h-2 rounded-full bg-[var(--bg-primary)]"
                              indicatorClassName="bg-gradient-to-r from-[var(--accent)] via-[var(--info)] to-[var(--success)]"
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                            <div className="flex -space-x-2">
                              {[0, 1, 2].map((index) => (
                                <div
                                  key={`${project.id}-${index}`}
                                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--bg-secondary)] bg-[var(--bg-card)] text-[10px] font-semibold text-[var(--text-primary)]"
                                >
                                  {getInitials(project.name).charAt(index % Math.max(getInitials(project.name).length, 1)) || "T"}
                                </div>
                              ))}
                            </div>
                            <span>{project.memberCount} members</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-6 py-12 text-center text-sm text-[var(--text-secondary)]">
                    Create a project to start tracking progress.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
