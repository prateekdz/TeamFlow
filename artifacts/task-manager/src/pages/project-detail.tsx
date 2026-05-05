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
import { Badge } from "@/components/ui/badge";
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
import { CheckCircle2, Clock, MoreHorizontal, Plus, Search, Settings, Users, ArrowLeft, ArrowUpCircle, ArrowDownCircle, AlertCircle, Circle } from "lucide-react";
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
  low: <ArrowDownCircle className="w-4 h-4 text-blue-500" />,
  medium: <Circle className="w-4 h-4 text-yellow-500" />,
  high: <ArrowUpCircle className="w-4 h-4 text-orange-500" />,
  urgent: <AlertCircle className="w-4 h-4 text-red-500" />
};

const STATUS_COLORS = {
  todo: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
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

  // Convert "all" back to undefined for the API call
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
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4 mt-8">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground mt-2 mb-6">The project you're looking for doesn't exist or you don't have access.</p>
          <Link href="/projects">
            <Button>Back to Projects</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const isAdmin = project.myRole === "admin";

  return (
    <Layout>
      <div className="flex flex-col gap-6 pb-10 h-full">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b pb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/projects" className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Projects
            </Link>
            <span>/</span>
            <span className="font-medium text-foreground">{project.name}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-4 h-8 rounded-full" style={{ backgroundColor: project.color }} />
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  {project.name}
                  <Badge variant="outline" className="capitalize">{project.myRole}</Badge>
                </h1>
                {project.description && (
                  <p className="text-muted-foreground mt-1 max-w-3xl">{project.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href={`/projects/${project.id}/members`}>
                <Button variant="outline" size="sm" className="hidden sm:flex" data-testid="button-manage-members">
                  <Users className="w-4 h-4 mr-2" />
                  Members ({project.memberCount})
                </Button>
              </Link>
              {isAdmin && (
                <Button variant="outline" size="icon" title="Project Settings">
                  <Settings className="w-4 h-4" />
                </Button>
              )}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-task">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>
                      Add a new task to {project.name}.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" placeholder="Task title" {...register("title")} data-testid="input-task-title" />
                      {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Task details..." {...register("description")} data-testid="input-task-desc" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select 
                          value={watch("status")} 
                          onValueChange={(val: any) => setValue("status", val)}
                        >
                          <SelectTrigger data-testid="select-task-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todo">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select 
                          value={watch("priority")} 
                          onValueChange={(val: any) => setValue("priority", val)}
                        >
                          <SelectTrigger data-testid="select-task-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter className="pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTaskMutation.isPending} data-testid="button-submit-task">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9 bg-background"
                // Implement client side search or wire to API if available
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-background" data-testid="filter-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] bg-background" data-testid="filter-priority">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {tasks ? `${tasks.length} tasks` : "Loading..."}
          </div>
        </div>

        {/* Task List */}
        <div className="bg-card border rounded-xl shadow-sm flex-1 overflow-hidden">
          {isLoadingTasks ? (
            <div className="divide-y">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="divide-y divide-border">
              {tasks.map(task => (
                <Link key={task.id} href={`/projects/${project.id}/tasks/${task.id}`}>
                  <div className="p-4 hover:bg-muted/30 transition-colors flex items-start sm:items-center gap-4 cursor-pointer group" data-testid={`task-row-${task.id}`}>
                    <div className="mt-1 sm:mt-0">
                      {PRIORITY_ICONS[task.priority as keyof typeof PRIORITY_ICONS]}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(task.createdAt), "MMM d")}
                          </span>
                          <span className="uppercase text-[10px] tracking-wider font-semibold">
                            T-{task.id}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 shrink-0 mt-2 sm:mt-0">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_COLORS[task.status as keyof typeof STATUS_COLORS]}`}>
                          {task.status.replace("_", " ")}
                        </span>
                        
                        <div className="w-8 flex justify-end">
                          {task.assignee ? (
                            <Avatar className="h-6 w-6 border shadow-sm" title={task.assignee.name}>
                              <AvatarImage src={task.assignee.avatarUrl || undefined} />
                              <AvatarFallback className="text-[10px]">{task.assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-6 w-6 rounded-full border border-dashed flex items-center justify-center text-muted-foreground bg-muted/50" title="Unassigned">
                              <span className="text-xs">?</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium mb-1">No tasks found</h3>
              <p className="text-muted-foreground text-sm max-w-sm mb-4">
                {statusFilter !== "all" || priorityFilter !== "all" 
                  ? "Try adjusting your filters to see more tasks." 
                  : "Create your first task to get started."}
              </p>
              {(statusFilter !== "all" || priorityFilter !== "all") ? (
                <Button variant="outline" onClick={() => { setStatusFilter("all"); setPriorityFilter("all"); }}>
                  Clear Filters
                </Button>
              ) : (
                <Button onClick={() => setIsCreateOpen(true)}>
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