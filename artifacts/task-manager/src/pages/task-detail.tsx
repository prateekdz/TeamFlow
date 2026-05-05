import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetTask, 
  useUpdateTask,
  useGetProject,
  useListProjectMembers,
  getGetTaskQueryKey,
  getListTasksQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Clock, Calendar, AlertCircle, ArrowUpCircle, ArrowDownCircle, Circle, CheckCircle2, User, Activity as ActivityIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const PRIORITY_ICONS = {
  low: <ArrowDownCircle className="w-4 h-4 text-[var(--text-muted)]" />,
  medium: <Circle className="w-4 h-4 text-[var(--info)]" />,
  high: <ArrowUpCircle className="w-4 h-4 text-[var(--warning)]" />,
  urgent: <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
};

export default function TaskDetail() {
  const { projectId: pId, taskId: tId } = useParams();
  const projectId = parseInt(pId || "0", 10);
  const taskId = parseInt(tId || "0", 10);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project } = useGetProject(projectId, {
    query: { enabled: !!projectId }
  });

  const { data: task, isLoading: isLoadingTask } = useGetTask(projectId, taskId, {
    query: { enabled: !!taskId, queryKey: getGetTaskQueryKey(projectId, taskId) }
  });

  const { data: members } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId }
  });

  const updateTaskMutation = useUpdateTask();

  // Inline editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDesc, setEditDesc] = useState("");

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleUpdate = (updates: any) => {
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
            variant: "destructive"
          });
        }
      }
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
        <div className="space-y-6 max-w-5xl mx-auto fade-in duration-300">
          <Skeleton className="h-4 w-1/4 bg-[var(--bg-hover)]" />
          <Skeleton className="h-14 w-3/4 bg-[var(--bg-hover)]" />
          <div className="flex gap-4 border-b border-[var(--border)] pb-6">
            <Skeleton className="h-10 w-32 bg-[var(--bg-hover)]" />
            <Skeleton className="h-10 w-32 bg-[var(--bg-hover)]" />
            <Skeleton className="h-10 w-32 bg-[var(--bg-hover)]" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-64 w-full bg-[var(--bg-hover)]" />
            </div>
            <div>
              <Skeleton className="h-96 w-full bg-[var(--bg-hover)] rounded-xl" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-center py-20 flex flex-col items-center">
          <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4 text-[var(--text-muted)]">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Task not found</h2>
          <p className="text-[var(--text-secondary)] mb-6">The task you're looking for doesn't exist or you don't have access.</p>
          <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10 fade-in duration-300">
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <Link href="/projects" className="hover:text-white transition-colors">Projects</Link>
          <span>/</span>
          {project ? (
            <Link href={`/projects/${project.id}`} className="hover:text-white transition-colors font-medium">{project.name}</Link>
          ) : (
            <Skeleton className="h-4 w-20 bg-[var(--bg-hover)]" />
          )}
          <span>/</span>
          <span className="font-mono text-[10px] tracking-wider text-white bg-[var(--bg-secondary)] px-2 py-0.5 rounded border border-[var(--border-subtle)]">T-{task.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex flex-col gap-2 relative group">
              {isEditingTitle ? (
                <Input
                  ref={titleInputRef}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTitleSubmit();
                    if (e.key === "Escape") {
                      setIsEditingTitle(false);
                      setEditTitle(task.title);
                    }
                  }}
                  className="text-3xl md:text-4xl font-extrabold h-auto py-2 px-3 bg-[var(--bg-secondary)] border-[var(--accent)] text-white focus-visible:ring-[var(--accent)]"
                />
              ) : (
                <h1 
                  className={`text-3xl md:text-4xl font-extrabold tracking-tight hover:bg-[var(--bg-hover)] p-2 -ml-2 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[var(--border)] text-white ${task.status === 'done' ? 'text-[var(--text-muted)] line-through decoration-[var(--border-subtle)]' : ''}`}
                  onClick={() => setIsEditingTitle(true)}
                  data-testid="task-title-display"
                >
                  {task.title}
                </h1>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                <ActivityIcon className="w-4 h-4" /> Description
              </h3>
              {isEditingDesc ? (
                <div className="flex flex-col gap-3 bg-[var(--bg-card)] border border-[var(--accent)] rounded-xl p-2 shadow-[0_0_0_2px_rgba(108,99,255,0.2)]">
                  <Textarea
                    ref={descInputRef}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="min-h-[200px] resize-y bg-transparent border-none focus-visible:ring-0 text-white text-base leading-relaxed"
                    placeholder="Describe the task in detail..."
                  />
                  <div className="flex gap-2 justify-end px-2 pb-2">
                    <Button variant="ghost" className="text-[var(--text-secondary)] hover:text-white" onClick={() => {
                      setIsEditingDesc(false);
                      setEditDesc(task.description || "");
                    }}>Cancel</Button>
                    <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white" onClick={handleDescSubmit}>Save</Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="prose dark:prose-invert max-w-none text-base leading-relaxed p-5 border border-[var(--border)] rounded-xl bg-[var(--bg-card)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] cursor-pointer min-h-[120px] transition-all text-[var(--text-primary)]"
                  onClick={() => setIsEditingDesc(true)}
                >
                  {task.description ? (
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <span className="text-[var(--text-muted)] italic flex items-center h-full justify-center">Click to add a description...</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-[var(--border)] pt-8 mt-4">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-6 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Activity Feed
              </h3>
              <div className="flex flex-col items-center justify-center py-12 border border-[var(--border)] border-dashed rounded-xl bg-[var(--bg-card)]/50">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-3">
                  <ActivityIcon className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
                <p className="text-sm font-medium text-white">Activity feed coming soon</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Comments and history will appear here.</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6 lg:pl-8 lg:border-l border-[var(--border)] sticky top-20">
            <div className="flex flex-col gap-5 p-6 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-lg">
              <div className="flex items-center gap-2 mb-2 pb-4 border-b border-[var(--border)]">
                <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                <h3 className="font-semibold text-white">Properties</h3>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</span>
                <Select 
                  value={task.status} 
                  onValueChange={(val: any) => handleUpdate({ status: val })}
                >
                  <SelectTrigger className="h-10 w-full bg-[var(--bg-secondary)] border-[var(--border)] text-white focus:ring-[var(--accent)]" data-testid="select-update-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-white">
                    <SelectItem value="todo">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--text-muted)]" /> To Do
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> In Progress
                      </div>
                    </SelectItem>
                    <SelectItem value="done">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--success)]" /> Done
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full border border-[var(--text-muted)]" /> Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Priority</span>
                <Select 
                  value={task.priority} 
                  onValueChange={(val: any) => handleUpdate({ priority: val })}
                >
                  <SelectTrigger className="h-10 w-full bg-[var(--bg-secondary)] border-[var(--border)] text-white focus:ring-[var(--accent)]">
                    <div className="flex items-center gap-2">
                      {PRIORITY_ICONS[task.priority as keyof typeof PRIORITY_ICONS]}
                      <span className="capitalize">{task.priority}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-white">
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        {PRIORITY_ICONS.low} Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        {PRIORITY_ICONS.medium} Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        {PRIORITY_ICONS.high} High
                      </div>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <div className="flex items-center gap-2">
                        {PRIORITY_ICONS.urgent} Urgent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Assignee</span>
                <Select 
                  value={task.assigneeId?.toString() || "unassigned"} 
                  onValueChange={(val) => handleUpdate({ assigneeId: val === "unassigned" ? null : parseInt(val) })}
                >
                  <SelectTrigger className="h-10 w-full bg-[var(--bg-secondary)] border-[var(--border)] text-white focus:ring-[var(--accent)]">
                    {task.assignee ? (
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-6 w-6 border border-[var(--border)]">
                          <AvatarImage src={task.assignee.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px] bg-[var(--bg-card)]">{task.assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate font-medium">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <div className="w-6 h-6 rounded-full border border-dashed border-[var(--border-subtle)] flex items-center justify-center bg-[var(--bg-card)]">
                          <User className="h-3 w-3" />
                        </div>
                        <span className="text-sm">Unassigned</span>
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-white">
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members?.map(m => (
                      <SelectItem key={m.id} value={m.userId.toString()}>
                        <div className="flex items-center gap-2 py-1">
                          <Avatar className="h-6 w-6 border border-[var(--border)]">
                            <AvatarImage src={m.user.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px] bg-[var(--bg-secondary)]">{m.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{m.user.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Due Date</span>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-white h-10">
                  <Calendar className="mr-2 h-4 w-4" />
                  {task.dueDate ? format(new Date(task.dueDate), "PPP") : <span>Set date</span>}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-[var(--text-secondary)] p-5 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] shadow-sm">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--text-muted)]" /> Created</span>
                <span className="font-medium text-white">{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="flex items-center gap-2"><User className="w-4 h-4 text-[var(--text-muted)]" /> Reporter</span>
                <div className="flex items-center gap-2 font-medium text-white bg-[var(--bg-secondary)] px-2 py-1 rounded-md border border-[var(--border-subtle)]">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-[var(--bg-card)]">
                      {(task as any).createdBy?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  {(task as any).createdBy?.name || "System"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}