import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  useListTasks, 
  useCreateTask, 
  getListTasksQueryKey, 
  getGetProjectQueryKey 
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, Clock, Plus, Search, Settings, Users, ArrowLeft, ArrowUpCircle, ArrowDownCircle, AlertCircle, Circle, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(1000).optional(),
  status: z.enum(["todo", "in_progress", "done", "cancelled"]).default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const PRIORITY_ICONS = {
  low: <ArrowDownCircle className="w-4 h-4 text-[var(--text-muted)]" />,
  medium: <Circle className="w-4 h-4 text-[var(--info)]" />,
  high: <ArrowUpCircle className="w-4 h-4 text-[var(--warning)]" />,
  urgent: <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
};

export default function ProjectDetail() {
  const { projectId: projectIdStr } = useParams();
  const projectId = parseInt(projectIdStr || "0", 10);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const queryParams: any = {};
  if (statusFilter !== "all") queryParams.status = statusFilter;
  if (priorityFilter !== "all") queryParams.priority = priorityFilter;

  const { data: tasks, isLoading: isLoadingTasks } = useListTasks(projectId, {
    query: queryParams
  }, {
    query: { enabled: !!projectId, queryKey: getListTasksQueryKey(projectId, queryParams) }
  });

  const createTaskMutation = useCreateTask();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: "todo",
      priority: "medium",
    },
  });

  const onSubmit = (data: CreateTaskFormValues) => {
    createTaskMutation.mutate(
      { projectId, data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey(projectId, queryParams) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          setIsCreateOpen(false);
          reset();
          toast({
            title: "Task created",
            description: "Your new task has been created successfully.",
          });
        },
        onError: (error) => {
          toast({
            title: "Failed to create task",
            description: error.error || "An unexpected error occurred.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoadingProject) {
    return (
      <Layout>
        <div className="space-y-6 fade-in duration-300">
          <Skeleton className="h-6 w-32 bg-[var(--bg-hover)]" />
          <Skeleton className="h-20 w-1/2 bg-[var(--bg-hover)]" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32 bg-[var(--bg-hover)]" />
            <Skeleton className="h-10 w-32 bg-[var(--bg-hover)]" />
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full bg-[var(--bg-hover)]" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Project not found</h2>
          <p className="text-[var(--text-secondary)] mt-2 mb-6">The project you're looking for doesn't exist or you don't have access.</p>
          <Link href="/projects">
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white">Back to Projects</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isAdmin = project.myRole === "admin";
  const projectColor = project.color || 'var(--accent)';

  return (
    <Layout>
      <div className="flex flex-col gap-6 pb-10 h-full fade-in duration-300">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-1">
            <Link href="/projects" className="hover:text-[var(--text-primary)] transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Projects
            </Link>
            <span>/</span>
            <span className="font-medium text-[var(--text-primary)]">{project.name}</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-6 h-12 rounded-lg mt-1 shrink-0" style={{ backgroundColor: projectColor }} />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--text-primary)] flex items-center gap-3 flex-wrap">
                  {project.name}
                  <span className="text-xs uppercase tracking-wider px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold border border-[var(--border-subtle)] align-middle">
                    {project.myRole}
                  </span>
                </h1>
                {project.description && (
                  <p className="text-[var(--text-secondary)] mt-2 max-w-3xl text-base">{project.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <Link href={`/projects/${project.id}/members`}>
                <Button variant="outline" className="border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]" data-testid="button-manage-members">
                  <Users className="w-4 h-4 mr-2" />
                  Members ({project.memberCount})
                </Button>
              </Link>
              {isAdmin && (
                <Button variant="outline" size="icon" className="border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)]" title="Project Settings">
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-none transition-transform hover:scale-[1.02]" data-testid="button-create-task">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="text-[var(--text-primary)]">Create New Task</DialogTitle>
                    <DialogDescription className="text-[var(--text-secondary)]">
                      Add a new task to <span className="font-semibold text-[var(--text-primary)]">{project.name}</span>.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-[var(--text-primary)]">Task Title</Label>
                      <Input 
                        id="title" 
                        placeholder="E.g., Design landing page header" 
                        {...register("title")} 
                        className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--accent)]"
                        data-testid="input-task-title" 
                      />
                      {errors.title && <p className="text-sm text-[var(--danger)]">{errors.title.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-[var(--text-primary)]">Description (optional)</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Add more details about what needs to be done..." 
                        {...register("description")} 
                        className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-[var(--accent)] min-h-[100px] resize-y"
                        data-testid="input-task-desc" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[var(--text-primary)]">Status</Label>
                        <Select 
                          value={watch("status")} 
                          onValueChange={(val: any) => setValue("status", val)}
                        >
                          <SelectTrigger className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--accent)]" data-testid="select-task-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]">
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[var(--text-primary)]">Priority</Label>
                        <Select 
                          value={watch("priority")} 
                          onValueChange={(val: any) => setValue("priority", val)}
                        >
                          <SelectTrigger className="bg-[var(--bg-secondary)] border-[var(--border)] text-[var(--text-primary)] focus:ring-[var(--accent)]" data-testid="select-task-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]">
                            <SelectItem value="low"><div className="flex items-center gap-2">{PRIORITY_ICONS.low} Low</div></SelectItem>
                            <SelectItem value="medium"><div className="flex items-center gap-2">{PRIORITY_ICONS.medium} Medium</div></SelectItem>
                            <SelectItem value="high"><div className="flex items-center gap-2">{PRIORITY_ICONS.high} High</div></SelectItem>
                            <SelectItem value="urgent"><div className="flex items-center gap-2">{PRIORITY_ICONS.urgent} Urgent</div></SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="pt-6 border-t border-[var(--border)] mt-6">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTaskMutation.isPending} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white" data-testid="button-submit-task">
                        {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
              <Input
                placeholder="Search tasks..."
                className="pl-9 bg-[var(--bg-card)] border-[var(--border)] focus-visible:ring-[var(--accent)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] h-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] h-9 focus:ring-[var(--accent)]" data-testid="filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)] h-9 focus:ring-[var(--accent)]" data-testid="filter-priority">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-primary)]">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] px-3 py-1.5 rounded-md border border-[var(--border)] shrink-0">
            {isLoadingTasks ? <Skeleton className="h-4 w-16 bg-[var(--bg-hover)]" /> : `${tasks?.length || 0} tasks`}
          </div>
        </div>

        {/* Task List */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
          {isLoadingTasks ? (
            <div className="divide-y divide-[var(--border)]">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="w-5 h-5 rounded-full bg-[var(--bg-hover)] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3 bg-[var(--bg-hover)]" />
                    <Skeleton className="h-3 w-1/4 bg-[var(--bg-hover)]" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full bg-[var(--bg-hover)] shrink-0" />
                </div>
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="divide-y divide-[var(--border)] overflow-y-auto">
              {tasks.map(task => {
                const isOverdue = new Date(task.dueDate || new Date()) < new Date() && task.status !== 'done';
                
                const getStatusStyle = (status: string) => {
                  switch(status) {
                    case 'todo': return 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]';
                    case 'in_progress': return 'bg-blue-500/10 text-[var(--info)] border-blue-500/30';
                    case 'done': return 'bg-[var(--success)]/10 text-[var(--success)] border-green-500/30';
                    case 'cancelled': return 'bg-transparent text-[var(--text-muted)] border-dashed border-[var(--border)]';
                    default: return 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border)]';
                  }
                };

                return (
                  <Link key={task.id} href={`/projects/${project.id}/tasks/${task.id}`}>
                    <div 
                      className={`p-4 sm:px-6 hover:bg-[var(--bg-hover)] transition-colors flex items-start sm:items-center gap-4 cursor-pointer group border-l-2 ${isOverdue ? 'border-l-[var(--danger)]' : 'border-l-transparent'}`} 
                      data-testid={`task-row-${task.id}`}
                    >
                      <div className="mt-1 sm:mt-0 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        {PRIORITY_ICONS[task.priority as keyof typeof PRIORITY_ICONS]}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className={`font-semibold truncate transition-colors ${task.status === 'done' ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)] group-hover:text-[var(--accent)]'}`}>
                            {task.title}
                          </span>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
                            <span className="font-mono text-[10px] tracking-wider text-[var(--text-secondary)]">
                              T-{task.id}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {format(new Date(task.createdAt), "MMM d")}
                            </span>
                            {isOverdue && (
                              <span className="text-[var(--danger)] font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Overdue
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 shrink-0">
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium whitespace-nowrap ${getStatusStyle(task.status)}`}>
                            {task.status.replace("_", " ")}
                          </span>
                          
                          <div className="w-8 flex justify-end">
                            {task.assignee ? (
                              <Avatar className="h-7 w-7 border border-[var(--border)] shadow-sm" title={task.assignee.name}>
                                <AvatarImage src={task.assignee.avatarUrl || undefined} />
                                <AvatarFallback className="text-[10px] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">{task.assignee.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="h-7 w-7 rounded-full border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)] bg-[var(--bg-secondary)]" title="Unassigned">
                                <span className="text-[10px] font-medium">?</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4 text-[var(--text-muted)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">No tasks found</h3>
              <p className="text-[var(--text-secondary)] max-w-sm mb-6">
                {statusFilter !== "all" || priorityFilter !== "all" 
                  ? "Try adjusting your filters to see more tasks." 
                  : "Create your first task to get started."}
              </p>
              {(statusFilter !== "all" || priorityFilter !== "all") ? (
                <Button variant="outline" className="border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]" onClick={() => { setStatusFilter("all"); setPriorityFilter("all"); }}>
                  Clear Filters
                </Button>
              ) : (
                <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white" onClick={() => setIsCreateOpen(true)}>
                  Create Task
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
