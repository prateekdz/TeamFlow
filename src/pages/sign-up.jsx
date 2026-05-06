import { SignUp } from "@clerk/react";
import { ArrowRight, Chrome, Github, Sparkles } from "lucide-react";

function getClerkAppearance() {
  return {
    variables: {
      colorPrimary: "#6c63ff",
      colorBackground: "#16161f",
      colorInputBackground: "#111118",
      colorInputText: "#f0f0ff",
      colorText: "#f0f0ff",
      colorTextSecondary: "#8b8ba7",
      colorNeutral: "#2a2a3a",
      colorDanger: "#ef4444",
      borderRadius: "8px",
      fontFamily: "'Inter', sans-serif",
    },
    elements: {
      rootBox: "w-full",
      cardBox: "w-full",
      card:
        "w-full max-w-none rounded-[20px] border border-[var(--border)] bg-[var(--bg-card)] p-0 shadow-[0_8px_24px_rgba(0,0,0,0.3)]",
      header: "hidden",
      footer: "hidden",
      form: "gap-4 px-10 pb-10",
      formFieldLabel: "mb-2 text-sm font-medium text-[var(--text-primary)]",
      formFieldInput:
        "h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)]",
      formButtonPrimary:
        "h-11 rounded-lg bg-[var(--accent)] text-sm font-semibold text-white shadow-[0_14px_32px_rgba(108,99,255,0.28)] hover:bg-[var(--accent-hover)] hover:scale-[1.01]",
      dividerLine: "bg-[var(--border)]",
      dividerText: "text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]",
      socialButtonsBlockButton:
        "h-11 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
      socialButtonsBlockButtonText: "text-sm font-medium",
      formFieldErrorText: "error-shake text-xs font-medium text-[var(--danger)]",
      footerActionLink: "font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]",
      identityPreviewText: "text-[var(--text-primary)]",
      identityPreviewEditButton: "text-[var(--accent)]",
      formResendCodeLink: "text-[var(--accent)]",
      otpCodeFieldInput:
        "h-12 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
    },
  };
}

function AuthShell({ title, subtitle, children }) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <div className="grid min-h-[100dvh] bg-[var(--bg-primary)] lg:grid-cols-2">
      <section className="auth-mesh relative hidden overflow-hidden border-r border-[var(--border)] lg:flex">
        <div className="absolute inset-0">
          <div className="auth-orb absolute left-[14%] top-[16%] h-56 w-56 rounded-full bg-[rgba(108,99,255,0.26)] blur-3xl" />
          <div className="auth-orb absolute right-[14%] top-[24%] h-48 w-48 rounded-full bg-[rgba(59,130,246,0.22)] blur-3xl" />
          <div className="auth-orb absolute bottom-[12%] left-[26%] h-64 w-64 rounded-full bg-[rgba(124,116,255,0.18)] blur-3xl" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between px-14 py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--info)] shadow-[0_18px_38px_rgba(108,99,255,0.24)]">
              <img src={`${basePath}/logo.svg`} alt="TeamFlow" className="h-6 w-6 brightness-200" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white">TeamFlow</div>
              <div className="text-sm text-white/60">Ship with clarity, not chaos</div>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/72">
              <Sparkles className="h-3.5 w-3.5" />
              Premium workspace experience
            </div>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">{subtitle}</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Project clarity", "See ownership, status, and delivery risk at a glance."],
                ["Task velocity", "Move from idea to execution with less ceremony."],
                ["Team alignment", "Keep every contributor and admin on the same page."],
              ].map(([heading, body]) => (
                <div key={heading} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                  <div className="text-sm font-semibold text-white">{heading}</div>
                  <div className="mt-2 text-sm leading-6 text-white/64">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-sm text-white/72 backdrop-blur-sm">
            <span>Built for focused teams that want polish and speed from day one.</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute left-[8%] top-12 h-40 w-40 rounded-full bg-[rgba(108,99,255,0.24)] blur-3xl" />
          <div className="absolute right-[12%] top-28 h-32 w-32 rounded-full bg-[rgba(59,130,246,0.18)] blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[420px]">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--info)] shadow-[0_12px_30px_rgba(108,99,255,0.24)]">
              <img src={`${basePath}/logo.svg`} alt="TeamFlow" className="h-5 w-5 brightness-200" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-[var(--text-primary)]">TeamFlow</div>
              <div className="text-xs text-[var(--text-secondary)]">Work orchestration hub</div>
            </div>
          </div>

          <div className="surface-card rounded-[24px] p-0">
            <div className="border-b border-[var(--border)] px-10 pb-6 pt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Start securely
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-[var(--text-primary)]">{title}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              <Chrome className="h-4 w-4 text-[var(--info)]" />
              Continue with Google
            </button>
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
            >
              <Github className="h-4 w-4" />
              Continue with GitHub
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SignUpPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <AuthShell
      title="Create a workspace that feels fast, clear, and beautifully organized."
      subtitle="Set up your account to manage projects, assign owners, and keep the entire team moving together."
    >
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/dashboard`}
        appearance={getClerkAppearance()}
      />
    </AuthShell>
  );
}
