import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Layout, Zap, Users } from "lucide-react";
import { Show } from "@clerk/react";
import { Redirect } from "wouter";

export default function Landing() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <div className="min-h-screen bg-background flex flex-col">
          <header className="px-6 h-16 flex items-center justify-between border-b">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">ShipHub</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button data-testid="button-get-started">Get Started</Button>
              </Link>
            </div>
          </header>
          
          <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-6">
              Precision tooling for teams
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight max-w-3xl mb-6">
              The collaborative cockpit for teams who <span className="text-primary">ship things.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mb-10">
              Stay aligned, manage projects, and execute tasks with unmatched density and speed. Your entire workspace, organized perfectly.
            </p>
            <div className="flex gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-12 px-8 text-base" data-testid="button-hero-signup">
                  Start Building Now
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base" data-testid="button-hero-signin">
                  Sign In
                </Button>
              </Link>
            </div>
            
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full text-left">
              <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Layout className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Dense Organization</h3>
                <p className="text-muted-foreground text-sm">Everything exactly where you expect it. High information density without the clutter.</p>
              </div>
              <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card">
                <div className="w-10 h-10 rounded-lg bg-chart-2/10 text-chart-2 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Lightning Fast</h3>
                <p className="text-muted-foreground text-sm">Optimized for speed. Create, edit, and navigate through your tasks without any friction.</p>
              </div>
              <div className="flex flex-col gap-3 p-6 rounded-2xl border bg-card">
                <div className="w-10 h-10 rounded-lg bg-chart-3/10 text-chart-3 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg">Team Alignment</h3>
                <p className="text-muted-foreground text-sm">Built-in roles, activity feeds, and shared contexts to keep everyone on the same page.</p>
              </div>
            </div>
          </main>
        </div>
      </Show>
    </>
  );
}