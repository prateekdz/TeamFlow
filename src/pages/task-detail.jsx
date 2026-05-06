import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "wouter";
import { useGetTask, useUpdateTask, useGetProject, useListProjectMembers, getGetTaskQueryKey, getListTasksQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  MessageSquare,
  User,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const PRIORITY_ICONS = {
  low: <Circle className="h-4 w-4 text-[var(--info)]" />,
  medium: <Circle className="h-4 w-4 text-[var(--warning)]" />,
  high: <ArrowUpCircle className="h-4 w-4 text-[var(--danger)]" />,
  urgent: <AlertCircle className="h-4 w-4 text-[var(--danger)]" />,
};

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function statusTone(status) {
  if (status === "todo") return "accent-pill";
  if (status === "in_progress") return "info-pill";
  if (status === "done") return "success-pill";
  if (status === "cancelled") return "danger-pill";
  return "accent-pill";
}

export default function TaskDetail() {
  const { projectId: pId, taskId: tId } = useParams();
  const projectId = parseInt(pId || "0", 10);
  const taskId = parseInt(tId || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project } = useGetProject(projectId, {
    query: { enabled: !!projectId },
  });
  const { data: task, isLoading: isLoadingTask } = useGetTask(projectId, taskId, {
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(projectId, taskId) },
  });
  const { data: members } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId },
  });
  const updateTaskMutation = useUpdateTask();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState("");

  const titleInputRef = useRef(null);
  const descInputRef = useRef(null);

  useEffect(() => {
    if (task) {
      setEditTitle(task.title);
      setEditDesc(task.description || "");
    }
  }, [task]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDesc && descInputRef.current) {
      descInputRef.current.focus();
    }
  }, [isEditingDesc]);

  const handleUpdate = (updates) => {
    updateTaskMutation.mutate(
      { projectId, taskId, data: updates },
      {
        onSuccess: (updatedTask) => {
          queryClient.setQueryData(getGetTaskQueryKey(projectId, taskId), updatedTask);
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId) });
          toast({ title: "Task updated" });
        },
        onError: (err) => {
          toast({
            title: "Update failed",
            description: err.error || "Something went wrong",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (editTitle.trim() && editTitle !== task?.title) {
      handleUpdate({ title: editTitle.trim() });
    } else {
      setEditTitle(task?.title || "");
    }
  };

  const handleDescSubmit = () => {
    setIsEditingDesc(false);
    if (editDesc !== (task?.description || "")) {
      handleUpdate({ description: editDesc });
    }
  };

  if (isLoadingTask) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="shimmer h-5 w-44 rounded-lg bg-[var(--bg-hover)]" />
          <Skeleton className="shimmer h-32 rounded-[24px] bg-[var(--bg-hover)]" />
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <Skeleton className="shimmer h-[520px] rounded-[24px] bg-[var(--bg-hover)]" />
            <Skeleton className="shimmer h-[520px] rounded-[24px] bg-[var(--bg-hover)]" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="surface-card flex flex-col items-center rounded-[24px] px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--bg-secondary)] text-[var(--danger)]">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[var(--text-primary)]">Task not found</h2>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Button className="mt-6 h-11 rounded-xl bg-[var(--accent)] px-5 text-white" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </Layout>
    );
  }

  const statusClass = statusTone(task.status);

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-8">
        <section className="surface-card rounded-[24px] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Link href="/projects" className="hover:text-[var(--text-primary)]">
              Projects
            </Link>
            <span>/</span>
            {project ? (
              <Link href={`/projects/${project.id}`} className="hover:text-[var(--text-primary)]">
                {project.name}
              </Link>
            ) : (
              <span>Project</span>
            )}
            <span>/</span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-2.5 py-1 font-mono text-[11px] text-[var(--text-primary)]">
              T-{task.id}
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Link href={`/projects/${projectId}`}>
                <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to board
                </button>
              </Link>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={`${statusClass} rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]`}>
                  {task.status.replace("_", " ")}
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  {task.priority}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <Clock3 className="h-4 w-4 text-[var(--accent)]" />
              Last updated via inline editor
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section className="surface-card rounded-[24px] p-6 sm:p-8">
            <div className="space-y-8">
              <div>
                {isEditingTitle ? (
                  <Input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(event) => setEditTitle(event.target.value)}
                    onBlur={handleTitleSubmit}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleTitleSubmit();
                      if (event.key === "Escape") {
                        setIsEditingTitle(false);
                        setEditTitle(task.title);
                      }
                    }}
                    className="h-auto rounded-2xl border-[var(--accent)] bg-[var(--bg-secondary)] px-4 py-3 text-3xl font-semibold text-[var(--text-primary)] focus-visible:ring-0 focus-ring"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className={`w-full rounded-2xl border border-transparent p-2 text-left text-3xl font-semibold transition-colors hover:border-[var(--border)] hover:bg-[var(--bg-hover)] ${
                      task.status === "done" ? "text-[var(--text-muted)] line-through" : "text-[var(--text-primary)]"
                    }`}
                  >
                    {task.title}
                  </button>
                )}
                <p className="mt-3 px-2 text-sm text-[var(--text-secondary)]">
                  Click the title to edit inline. Quick edits stay on this page without changing the backend flow.
                </p>
              </div>

              <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
                <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <Activity className="h-4 w-4" />
                  Description
                </div>
                {isEditingDesc ? (
                  <div className="space-y-4">
                    <Textarea
                      ref={descInputRef}
                      value={editDesc}
                      onChange={(event) => setEditDesc(event.target.value)}
                      className="min-h-[220px] rounded-2xl border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] focus-visible:ring-0 focus-ring"
                      placeholder="Describe the task in detail..."
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        className="h-10 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                        onClick={() => {
                          setIsEditingDesc(false);
                          setEditDesc(task.description || "");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button className="h-10 rounded-xl bg-[var(--accent)] px-5 text-white hover:bg-[var(--accent-hover)]" onClick={handleDescSubmit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingDesc(true)}
                    className="min-h-[180px] w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 text-left text-sm leading-7 text-[var(--text-primary)] hover:border-[rgba(108,99,255,0.18)] hover:bg-[var(--bg-hover)]"
                  >
                    {task.description ? (
                      <span className="whitespace-pre-wrap">{task.description}</span>
                    ) : (
                      <span className="text-[var(--text-muted)]">Add a richer task description, expected outcome, or implementation notes.</span>
                    )}
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <CheckCircle2 className="h-4 w-4" />
                    Subtasks
                  </div>
                  <div className="space-y-3">
                    {["Clarify scope", "Update implementation", "Share progress with team"].map((item, index) => (
                      <label key={item} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                        <input type="checkbox" className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-secondary)]" defaultChecked={index === 0} />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 border border-[var(--border)]">
                          <AvatarFallback className="bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)]">
                            {getInitials(task.createdBy?.name || "System")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{task.createdBy?.name || "System"}</div>
                          <div className="mt-1 text-sm text-[var(--text-secondary)]">
                            Comment threads can plug into this panel later without changing the current task model.
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] px-4 py-6 text-sm text-[var(--text-secondary)]">
                      No comments yet.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="surface-card rounded-[24px] p-6 sm:p-7 xl:sticky xl:top-24 xl:h-fit">
            <div className="space-y-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Task properties</div>
                <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Right-side control panel</h2>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Status</div>
                  <Select value={task.status} onValueChange={(value) => handleUpdate({ status: value })}>
                    <SelectTrigger className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="done">Done</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Priority</div>
                  <Select value={task.priority} onValueChange={(value) => handleUpdate({ priority: value })}>
                    <SelectTrigger className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      <div className="flex items-center gap-2">
                        {PRIORITY_ICONS[task.priority]}
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Assignee</div>
                  <Select
                    value={task.assigneeId?.toString() || "unassigned"}
                    onValueChange={(value) => handleUpdate({ assigneeId: value === "unassigned" ? null : parseInt(value, 10) })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6 border border-[var(--border)]">
                            <AvatarImage src={task.assignee.avatarUrl || undefined} />
                            <AvatarFallback className="bg-[var(--bg-card)] text-[10px] text-[var(--text-primary)]">
                              {getInitials(task.assignee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate">{task.assignee.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                          <User className="h-4 w-4" />
                          <span>Unassigned</span>
                        </div>
                      )}
                    </SelectTrigger>
                    <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {members?.map((member) => (
                        <SelectItem key={member.id} value={member.userId.toString()}>
                          {member.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Due date</div>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-start rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {task.dueDate ? format(new Date(task.dueDate), "PPP") : "Set date"}
                  </Button>
                </div>
              </div>

              <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Activity log</div>
                <div className="space-y-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 text-[var(--accent)]" />
                    <div>
                      Created on{" "}
                      <span className="font-medium text-[var(--text-primary)]">{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 h-4 w-4 text-[var(--info)]" />
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 border border-[var(--border)]">
                        <AvatarFallback className="bg-[var(--bg-card)] text-[10px] text-[var(--text-primary)]">
                          {getInitials(task.createdBy?.name || "System")}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        Reported by <span className="font-medium text-[var(--text-primary)]">{task.createdBy?.name || "System"}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
