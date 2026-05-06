import { Suspense, lazy, useEffect, useRef } from "react";
import { Switch, Route, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Show, useClerk } from "@clerk/react";
import { ThemeProvider } from "@/lib/theme";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/LandingPage";
import {
  getDashboardSummary,
  getMyTasks,
  getRecentActivity,
  listProjects,
  getGetDashboardSummaryQueryKey,
  getGetMyTasksQueryKey,
  getGetRecentActivityQueryKey,
  getListProjectsQueryKey,
} from "@workspace/api-client-react";

const SignInPage = lazy(() => import("@/pages/sign-in"));
const SignUpPage = lazy(() => import("@/pages/sign-up"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Projects = lazy(() => import("@/pages/projects"));
const ProjectDetail = lazy(() => import("@/pages/project-detail"));
const TaskDetail = lazy(() => import("@/pages/task-detail"));
const ProjectMembers = lazy(() => import("@/pages/project-members"));
const Settings = lazy(() => import("@/pages/settings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function prefetchDashboard(qc) {
  return Promise.all([
    qc.prefetchQuery({ queryKey: getGetDashboardSummaryQueryKey(), queryFn: ({ signal }) => getDashboardSummary({ signal }) }),
    qc.prefetchQuery({ queryKey: getGetMyTasksQueryKey(), queryFn: ({ signal }) => getMyTasks({ signal }) }),
    qc.prefetchQuery({ queryKey: getGetRecentActivityQueryKey(), queryFn: ({ signal }) => getRecentActivity({ signal }) }),
    qc.prefetchQuery({ queryKey: getListProjectsQueryKey(), queryFn: ({ signal }) => listProjects({ signal }) }),
  ]);
}
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
function ClerkQueryClientCacheInvalidator() {
    const { addListener } = useClerk();
    const qc = useQueryClient();
    const prevUserIdRef = useRef(undefined);
    useEffect(() => {
        const unsubscribe = addListener(({ user }) => {
            const userId = user?.id ?? null;
            const prev = prevUserIdRef.current;
            prevUserIdRef.current = userId;
            if (prev !== undefined && prev !== userId) {
                qc.clear();
            }
            // Prefetch as soon as a user signs in
            if (userId && prev !== userId) {
                prefetchDashboard(qc);
            }
        });
        return unsubscribe;
    }, [addListener, qc]);
    return null;
}
function ProtectedRoute({ component: Component }) {
    return (<>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/"/>
      </Show>
    </>);
}

function RouteLoader() {
    return (<div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-6 py-10">
        <div className="shimmer h-12 w-48 rounded-2xl bg-[var(--bg-hover)]"/>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (<div key={item} className="shimmer h-36 rounded-[28px] bg-[var(--bg-hover)]"/>))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
          <div className="shimmer h-[420px] rounded-[32px] bg-[var(--bg-hover)]"/>
          <div className="shimmer h-[420px] rounded-[32px] bg-[var(--bg-hover)]"/>
        </div>
      </div>
    </div>);
}

const DashboardRoute = () => <ProtectedRoute component={Dashboard} />;
const ProjectsRoute = () => <ProtectedRoute component={Projects} />;
const ProjectDetailRoute = () => <ProtectedRoute component={ProjectDetail} />;
const TaskDetailRoute = () => <ProtectedRoute component={TaskDetail} />;
const ProjectMembersRoute = () => <ProtectedRoute component={ProjectMembers} />;
const SettingsRoute = () => <ProtectedRoute component={Settings} />;

function AppWithRoutes() {
    return (<QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Suspense fallback={<RouteLoader />}>
          <Switch>
            <Route path="/" component={LandingPage}/>
            <Route path="/sign-in/*?" component={SignInPage}/>
            <Route path="/sign-up/*?" component={SignUpPage}/>
            <Route path="/dashboard" component={DashboardRoute}/>
            <Route path="/projects" component={ProjectsRoute}/>
            <Route path="/projects/:projectId" component={ProjectDetailRoute}/>
            <Route path="/projects/:projectId/tasks/:taskId" component={TaskDetailRoute}/>
            <Route path="/projects/:projectId/members" component={ProjectMembersRoute}/>
            <Route path="/settings" component={SettingsRoute}/>
            <Route component={NotFound}/>
          </Switch>
        </Suspense>
      </QueryClientProvider>);
}
function App() {
    return (<ThemeProvider>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <AppWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>);
}
export default App;
