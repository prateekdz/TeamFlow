import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClerkProvider, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { ThemeProvider, useTheme } from "@/lib/theme";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import TaskDetail from "@/pages/task-detail";
import ProjectMembers from "@/pages/project-members";
import Settings from "@/pages/settings";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function buildClerkAppearance(theme: "dark" | "light") {
  const isDark = theme === "dark";
  return {
    baseTheme: isDark ? dark : undefined,
    cssLayerName: "clerk",
    variables: {
      colorPrimary: "#6c63ff",
      colorBackground: isDark ? "#16161f" : "#ffffff",
      colorInputBackground: isDark ? "#111118" : "#ebebf5",
      colorInputText: isDark ? "#f0f0ff" : "#12122a",
      colorText: isDark ? "#f0f0ff" : "#12122a",
      colorTextSecondary: isDark ? "#8b8ba7" : "#4a4a70",
      colorDanger: isDark ? "#ef4444" : "#dc2626",
      colorNeutral: isDark ? "#2a2a3a" : "#d0d0e8",
      fontFamily: "'Inter', sans-serif",
      borderRadius: "8px",
    },
    elements: {
      card: isDark
        ? "shadow-2xl border border-[#2a2a3a]"
        : "shadow-lg border border-[#d0d0e8]",
      formButtonPrimary: "bg-[#6c63ff] hover:bg-[#7c74ff]",
    },
  };
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={buildClerkAppearance(theme)}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
          <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
          <Route path="/projects/:projectId" component={() => <ProtectedRoute component={ProjectDetail} />} />
          <Route path="/projects/:projectId/tasks/:taskId" component={() => <ProtectedRoute component={TaskDetail} />} />
          <Route path="/projects/:projectId/members" component={() => <ProtectedRoute component={ProjectMembers} />} />
          <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ClerkProviderWithRoutes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
