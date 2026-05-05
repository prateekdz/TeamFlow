import { useState } from "react";
import { useListProjects, useCreateProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { FolderKanban, Plus, MoreVertical, LayoutGrid, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type CreateProjectFormValues = z.infer<typeof createProjectSchema>;

const PRESET_COLORS = [
  "#6c63ff", // Primary accent
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
];

export default function Projects() {
  const { data: projects, isLoading } = useListProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createProjectMutation = useCreateProject();

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      color: PRESET_COLORS[0],
    },
  });

  const selectedColor = watch("color");

  const onSubmit = (data: CreateProjectFormValues) => {
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
      }
    );
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10 fade-in zoom-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Projects</h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage all your team's projects in one place.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-none transition-transform hover:scale-[1.02]" data-testid="button-create-project">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-white sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription className="text-[var(--text-secondary)]">
                  Add a new project to track tasks and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Project name" 
                    {...register("name")} 
                    data-testid="input-project-name" 
                    className="bg-[var(--bg-secondary)] border-[var(--border)] text-white focus-visible:ring-[var(--accent)]"
                  />
                  {errors.name && <p className="text-sm text-[var(--danger)]">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Brief description of the project" 
                    {...register("description")} 
                    data-testid="input-project-desc" 
                    className="bg-[var(--bg-secondary)] border-[var(--border)] text-white focus-visible:ring-[var(--accent)] resize-none h-24"
                  />
                  {errors.description && <p className="text-sm text-[var(--danger)]">{errors.description.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label className="text-white">Project Color</Label>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full cursor-pointer transition-all flex items-center justify-center ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-card)] ring-[var(--accent)] scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setValue("color", color)}
                        data-testid={`color-picker-${color}`}
                      >
                        {selectedColor === color && <CheckCircle2 className="w-4 h-4 text-white drop-shadow-md" />}
                      </button>
                    ))}
                  </div>
                </div>
                <DialogFooter className="pt-4 border-t border-[var(--border)]">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="border-[var(--border)] hover:bg-[var(--bg-hover)] hover:text-white">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProjectMutation.isPending} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white" data-testid="button-submit-project">
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden bg-[var(--bg-card)] border-[var(--border)]">
                <div className="h-1.5 bg-[var(--bg-hover)]" />
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4 mb-2 bg-[var(--bg-hover)]" />
                  <Skeleton className="h-4 w-full bg-[var(--bg-hover)]" />
                </CardHeader>
                <CardContent className="pb-4">
                  <Skeleton className="h-2 w-full mb-2 bg-[var(--bg-hover)]" />
                  <Skeleton className="h-4 w-1/4 bg-[var(--bg-hover)]" />
                </CardContent>
                <CardFooter className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-3">
                  <Skeleton className="h-4 w-1/3 bg-[var(--bg-hover)]" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : projects && projects.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const progress = project.totalTasks > 0 
                ? Math.round((project.completedTasks / project.totalTasks) * 100) 
                : 0;
              
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="overflow-hidden bg-[var(--bg-card)] border-[var(--border)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-1 cursor-pointer h-full flex flex-col group" data-testid={`project-card-${project.id}`}>
                    <div className="h-1.5 w-full transition-all duration-300 group-hover:h-2" style={{ backgroundColor: project.color || 'var(--accent)' }} />
                    <CardHeader className="pb-3 flex-none">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-bold text-white group-hover:text-[var(--accent)] transition-colors line-clamp-1">{project.name}</CardTitle>
                        <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-semibold border border-[var(--border-subtle)]">
                          {project.myRole}
                        </span>
                      </div>
                      {project.description ? (
                        <CardDescription className="line-clamp-2 mt-2 text-[var(--text-secondary)] text-sm">{project.description}</CardDescription>
                      ) : (
                        <div className="h-10 mt-2" /> // spacer
                      )}
                    </CardHeader>
                    <CardContent className="pb-5 flex-1 flex flex-col justify-end">
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-muted)] font-medium">Progress</span>
                          <span className="font-semibold text-white">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5 bg-[var(--bg-secondary)]" indicatorClassName="bg-gradient-to-r from-[var(--accent)] to-[var(--info)]" />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-3 flex-none text-xs text-[var(--text-secondary)] flex justify-between">
                      <div className="flex items-center gap-1.5" title="Tasks (completed / total)">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />
                        <span>{project.completedTasks}/{project.totalTasks}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Overdue tasks">
                        <Clock className={`w-3.5 h-3.5 ${project.overdueTasks > 0 ? 'text-[var(--danger)]' : ''}`} />
                        <span className={project.overdueTasks > 0 ? "text-[var(--danger)] font-medium" : ""}>{project.overdueTasks}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Team members">
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>{project.memberCount}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-[var(--border)] rounded-xl bg-[var(--bg-card)] border-dashed">
            <div className="w-16 h-16 bg-[var(--accent-glow)] text-[var(--accent)] rounded-full flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No projects yet</h3>
            <p className="text-[var(--text-secondary)] max-w-md mb-8">
              Create your first project to start organizing tasks and collaborating with your team.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white" data-testid="button-empty-create-project">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}