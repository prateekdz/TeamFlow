import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Show } from "@clerk/react";
import { Redirect } from "wouter";
import { CheckCircle2, Layout, Zap, Users } from "lucide-react";

export default function Landing() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/dashboard" />
      </Show>
      <Show when="signed-out">
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col text-white">
          <header className="px-6 h-16 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="flex items-center gap-2">
              <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Logo" className="w-6 h-6" />
              <span className="font-bold text-lg tracking-tight">TeamFlow</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/sign-in" className="text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/sign-up">
                <Button className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-none shadow-[0_4px_14px_rgba(108,99,255,0.4)] transition-all hover:scale-105">Get Started</Button>
              </Link>
            </div>
          </header>
          
          <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-animated opacity-20 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold bg-[var(--bg-card)] text-[var(--accent)] mb-8 shadow-sm">
                Next-generation tooling
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter max-w-4xl mb-6 leading-tight">
                The collaborative cockpit for teams who <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--info)]">ship things.</span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mb-10 leading-relaxed">
                Stay aligned, manage projects, and execute tasks with unmatched density and speed. Your entire workspace, organized perfectly.
              </p>
              <div className="flex gap-4">
                <Link href="/sign-up">
                  <Button size="lg" className="h-12 px-8 text-base bg-[var(--accent)] hover:bg-[var(--accent-hover)] border-none shadow-[0_4px_14px_rgba(108,99,255,0.4)]">
                    Start Building Now
                  </Button>
                </Link>
                <Link href="/sign-in">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base border-[var(--border)] text-white hover:bg-[var(--bg-hover)]">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left relative z-10">
              <div className="flex flex-col gap-4 p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] flex items-center justify-center">
                  <Layout className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-white">Dense Organization</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">Everything exactly where you expect it. High information density without the clutter. Built for professionals.</p>
              </div>
              <div className="flex flex-col gap-4 p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-white">Lightning Fast</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">Optimized for speed. Create, edit, and navigate through your tasks without any friction or loading states.</p>
              </div>
              <div className="flex flex-col gap-4 p-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-lg hover:-translate-y-1 transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl text-white">Team Alignment</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">Built-in roles, activity feeds, and shared contexts to keep everyone on the same page continuously.</p>
              </div>
            </div>
          </main>
        </div>
      </Show>
    </>
  );
}