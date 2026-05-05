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
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
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
      <div className="flex flex-col gap-8 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground mt-1">Manage all your team's projects in one place.</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-project">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Add a new project to track tasks and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Project name" {...register("name")} data-testid="input-project-name" />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the project" {...register("description")} data-testid="input-project-desc" />
                  {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full cursor-pointer transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setValue("color", color)}
                        data-testid={`color-picker-${color}`}
                      />
                    ))}
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createProjectMutation.isPending} data-testid="button-submit-project">
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
              <Card key={i} className="overflow-hidden">
                <div className="h-2 bg-muted" />
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="pb-4">
                  <Skeleton className="h-2 w-full mb-2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
                <CardFooter className="border-t bg-muted/20 py-3">
                  <Skeleton className="h-4 w-1/3" />
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
                  <Card className="overflow-hidden transition-all hover:shadow-md cursor-pointer h-full flex flex-col group" data-testid={`project-card-${project.id}`}>
                    <div className="h-2 w-full" style={{ backgroundColor: project.color }} />
                    <CardHeader className="pb-3 flex-none">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">{project.name}</CardTitle>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium capitalize">
                          {project.myRole}
                        </span>
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2 mt-1.5">{project.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="pb-4 flex-1 flex flex-col justify-end">
                      <div className="space-y-1.5 mt-auto">
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-muted-foreground font-medium">Progress</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-1.5" />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/10 py-3 flex-none text-xs text-muted-foreground flex justify-between">
                      <div className="flex items-center gap-1.5" title="Tasks (completed / total)">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{project.completedTasks}/{project.totalTasks}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Overdue tasks">
                        <Clock className="w-3.5 h-3.5 text-destructive" />
                        <span className={project.overdueTasks > 0 ? "text-destructive font-medium" : ""}>{project.overdueTasks}</span>
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
          <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-card border-dashed">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold mb-2">No projects yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Create your first project to start organizing tasks and collaborating with your team.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-empty-create-project">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}