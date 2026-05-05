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
import { ArrowLeft, Clock, Calendar, AlertCircle, ArrowUpCircle, ArrowDownCircle, Circle, CheckCircle2, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const PRIORITY_ICONS = {
  low: <ArrowDownCircle className="w-4 h-4 text-blue-500" />,
  medium: <Circle className="w-4 h-4 text-yellow-500" />,
  high: <ArrowUpCircle className="w-4 h-4 text-orange-500" />,
  urgent: <AlertCircle className="w-4 h-4 text-red-500" />
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
    // Optimistic local update could go here
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
        <div className="space-y-6 max-w-4xl mx-auto">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-3/4" />
          <div className="flex gap-4 border-b pb-6">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Task not found</h2>
          <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto flex flex-col gap-6 pb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
          <span>/</span>
          {project ? (
            <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors">{project.name}</Link>
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
          <span>/</span>
          <span className="font-medium text-foreground">T-{task.id}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <div className="flex flex-col gap-2">
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
                  className="text-3xl font-bold h-auto py-2 px-3 border-primary"
                />
              ) : (
                <h1 
                  className="text-3xl font-bold tracking-tight hover:bg-muted/50 p-2 -ml-2 rounded-md cursor-pointer transition-colors border border-transparent hover:border-border"
                  onClick={() => setIsEditingTitle(true)}
                  data-testid="task-title-display"
                >
                  {task.title}
                </h1>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</h3>
              {isEditingDesc ? (
                <div className="flex flex-col gap-2">
                  <Textarea
                    ref={descInputRef}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="min-h-[150px] resize-y"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDescSubmit}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setIsEditingDesc(false);
                      setEditDesc(task.description || "");
                    }}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div 
                  className="prose dark:prose-invert max-w-none text-sm p-4 border rounded-xl bg-card hover:border-primary/50 cursor-pointer min-h-[100px] transition-colors"
                  onClick={() => setIsEditingDesc(true)}
                >
                  {task.description ? (
                    <p className="whitespace-pre-wrap">{task.description}</p>
                  ) : (
                    <span className="text-muted-foreground italic">Add a description...</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t pt-6 mt-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Activity</h3>
              <div className="text-center py-8 border border-dashed rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground">Activity feed coming soon</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6 lg:pl-6 lg:border-l">
            <div className="flex flex-col gap-4 p-5 bg-card border rounded-xl shadow-sm">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Status</span>
                <Select 
                  value={task.status} 
                  onValueChange={(val: any) => handleUpdate({ status: val })}
                >
                  <SelectTrigger className="h-9 w-full bg-background" data-testid="select-update-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Priority</span>
                <Select 
                  value={task.priority} 
                  onValueChange={(val: any) => handleUpdate({ priority: val })}
                >
                  <SelectTrigger className="h-9 w-full bg-background">
                    <div className="flex items-center gap-2">
                      {PRIORITY_ICONS[task.priority as keyof typeof PRIORITY_ICONS]}
                      <span className="capitalize">{task.priority}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Assignee</span>
                <Select 
                  value={task.assigneeId?.toString() || "unassigned"} 
                  onValueChange={(val) => handleUpdate({ assigneeId: val === "unassigned" ? null : parseInt(val) })}
                >
                  <SelectTrigger className="h-9 w-full bg-background">
                    {task.assignee ? (
                      <div className="flex items-center gap-2 truncate">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={task.assignee.avatarUrl || undefined} />
                          <AvatarFallback className="text-[10px]">{task.assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{task.assignee.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span className="text-sm">Unassigned</span>
                      </div>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {members?.map(m => (
                      <SelectItem key={m.id} value={m.userId.toString()}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={m.user.avatarUrl || undefined} />
                            <AvatarFallback className="text-[10px]">{m.user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {m.user.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-3 text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl border border-dashed">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-medium text-foreground">{format(new Date(task.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Reporter</span>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] text-muted-foreground">
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