import { useGetDashboardSummary, useGetMyTasks, useGetOverdueTasks, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { CheckCircle2, Clock, FolderKanban, Activity, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: myTasks, isLoading: isLoadingTasks } = useGetMyTasks();
  const { data: overdueTasks, isLoading: isLoadingOverdue } = useGetOverdueTasks();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening across your projects.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-projects">
                {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.totalProjects || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Open Tasks</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-my-tasks">
                {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.myOpenTasks || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive" data-testid="stat-overdue">
                {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.overdueTasks || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary" data-testid="stat-completed">
                {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : summary?.completedThisWeek || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Content Area */}
          <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>My Tasks</CardTitle>
                <CardDescription>Tasks assigned to you across all projects.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingTasks ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : myTasks && myTasks.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {myTasks.slice(0, 5).map((task) => (
                      <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" data-testid={`my-task-${task.id}`}>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{task.title}</span>
                            <span className="text-xs text-muted-foreground">{task.project.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground font-medium`}>
                              {task.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No open tasks assigned to you.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area */}
          <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivity ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : activity && activity.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {activity.map((item) => (
                      <div key={item.id} className="flex gap-3 items-start" data-testid={`activity-${item.id}`}>
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                          {item.actorAvatarUrl ? (
                            <img src={item.actorAvatarUrl} alt={item.actorName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium">{item.actorName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm">
                            <span className="font-medium">{item.actorName}</span>{" "}
                            <span className="text-muted-foreground">{item.action}</span>{" "}
                            <Link href={`/projects/${item.projectId}/tasks/${item.taskId}`} className="font-medium hover:underline">
                              {item.taskTitle}
                            </Link>
                          </p>
                          <span className="text-xs text-muted-foreground flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No recent activity to show.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}