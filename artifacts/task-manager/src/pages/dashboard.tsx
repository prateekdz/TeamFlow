import { useGetDashboardSummary, useGetMyTasks, useGetOverdueTasks, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "@/components/layout";
import { CheckCircle2, Clock, FolderKanban, AlertCircle, Plus, LayoutList } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/react";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: myTasks, isLoading: isLoadingTasks } = useGetMyTasks();
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity();
  const { user } = useUser();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-[var(--danger)]';
      case 'high': return 'bg-[var(--warning)]';
      case 'medium': return 'bg-[var(--info)]';
      case 'low': return 'bg-[var(--text-muted)]';
      default: return 'bg-[var(--text-muted)]';
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'todo') return <span className="text-xs px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">To Do</span>;
    if (s === 'in_progress') return <span className="text-xs px-2.5 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-[var(--info)] font-medium">In Progress</span>;
    if (s === 'done') return <span className="text-xs px-2.5 py-0.5 rounded-full border border-green-500/30 bg-[var(--success)]/10 text-[var(--success)] font-medium">Done</span>;
    if (s === 'cancelled') return <span className="text-xs px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-hover)] text-[var(--text-muted)] font-medium">Cancelled</span>;
    return <span className="text-xs px-2.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] font-medium">{status}</span>;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10 fade-in zoom-in duration-300">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              {getGreeting()}, {user?.firstName || 'there'}
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">{currentDate}</p>
          </div>
          <Link href="/projects">
            <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-none transition-transform hover:scale-[1.02]">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)]" data-testid="stat-projects">
                  {isLoadingSummary ? <Skeleton className="h-8 w-12 bg-[var(--bg-hover)]" /> : summary?.totalProjects || 0}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">My Open Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[var(--info)] flex items-center justify-center">
                  <LayoutList className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold text-[var(--text-primary)]" data-testid="stat-my-tasks">
                  {isLoadingSummary ? <Skeleton className="h-8 w-12 bg-[var(--bg-hover)]" /> : summary?.myOpenTasks || 0}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold text-[var(--danger)]" data-testid="stat-overdue">
                  {isLoadingSummary ? <Skeleton className="h-8 w-12 bg-[var(--bg-hover)]" /> : summary?.overdueTasks || 0}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[var(--text-secondary)]">Completed This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-3xl font-bold text-[var(--success)]" data-testid="stat-completed">
                  {isLoadingSummary ? <Skeleton className="h-8 w-12 bg-[var(--bg-hover)]" /> : summary?.completedThisWeek || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Main Content Area - 2/3 */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            <Card className="flex-1 bg-[var(--bg-card)] border-[var(--border)] shadow-sm">
              <CardHeader className="border-b border-[var(--border)] pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">My Tasks</CardTitle>
                </div>
                <div className="flex bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-subtle)]">
                  <button className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent-glow)] text-[var(--accent)]">All</button>
                  <button className="px-3 py-1 text-xs font-medium rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">My Tasks</button>
                  <button className="px-3 py-1 text-xs font-medium rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Overdue</button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingTasks ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full bg-[var(--bg-hover)]" />)}
                  </div>
                ) : myTasks && myTasks.length > 0 ? (
                  <div className="flex flex-col divide-y divide-[var(--border)]">
                    {myTasks.slice(0, 5).map((task) => {
                      const isOverdue = new Date(task.dueDate || new Date()) < new Date() && task.status !== 'done';
                      
                      return (
                        <Link key={task.id} href={`/projects/${task.projectId}/tasks/${task.id}`}>
                          <div 
                            className={`flex items-center justify-between p-4 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors group ${isOverdue ? 'border-l-2 border-l-[var(--danger)]' : 'border-l-2 border-l-transparent'}`} 
                            data-testid={`my-task-${task.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(task.priority)}`} />
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors truncate">{task.title}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] text-[var(--text-secondary)] px-2 py-0.5 rounded bg-[var(--bg-secondary)] truncate max-w-[120px] border border-[var(--border-subtle)]">{task.project.name}</span>
                                  {task.dueDate && (
                                    <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]'}`}>
                                      <Clock className="w-3 h-3" />
                                      {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              {getStatusBadge(task.status)}
                              <Avatar className="h-6 w-6 border border-[var(--border)]">
                                <AvatarFallback className="bg-[var(--bg-secondary)] text-[10px] text-[var(--text-secondary)]">{task.assignee?.name?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-6 h-6 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-[var(--text-secondary)] font-medium">No open tasks assigned to you</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">You're all caught up!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Area - 1/3 */}
          <div className="col-span-1 flex flex-col gap-6">
            <Card className="flex-1 bg-[var(--bg-card)] border-[var(--border)] shadow-sm">
              <CardHeader className="border-b border-[var(--border)] pb-4">
                <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingActivity ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full bg-[var(--bg-hover)]" />)}
                  </div>
                ) : activity && activity.length > 0 ? (
                  <div className="flex flex-col p-4 relative">
                    <div className="absolute left-[31px] top-6 bottom-6 w-px bg-[var(--border)] z-0" />
                    
                    {activity.map((item) => {
                      const isCreate = item.action.includes('created');
                      const isUpdate = item.action.includes('updated');
                      
                      let borderColor = 'border-[var(--border)]';
                      if (isCreate) borderColor = 'border-[var(--success)]';
                      else if (isUpdate) borderColor = 'border-[var(--info)]';

                      return (
                        <div key={item.id} className="flex gap-4 items-start relative z-10 mb-6 last:mb-0" data-testid={`activity-${item.id}`}>
                          <Avatar className={`w-8 h-8 shrink-0 border-2 ${borderColor} bg-[var(--bg-card)]`}>
                            <AvatarImage src={item.actorAvatarUrl || undefined} />
                            <AvatarFallback className="text-[10px] bg-[var(--bg-secondary)] text-[var(--text-secondary)]">{item.actorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col bg-[var(--bg-secondary)] rounded-lg p-3 w-full border border-[var(--border-subtle)]">
                            <p className="text-sm text-[var(--text-secondary)]">
                              <span className="font-medium text-[var(--text-primary)]">{item.actorName}</span>{" "}
                              {item.action}{" "}
                              <Link href={`/projects/${item.projectId}/tasks/${item.taskId}`} className="font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors">
                                {item.taskTitle}
                              </Link>
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)] flex items-center mt-2">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(item.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--text-muted)] text-sm">
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
