import { SignIn } from "@clerk/react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

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
        "w-full max-w-none rounded-[24px] border border-[var(--border)] bg-[var(--bg-card)] p-0 shadow-[0_24px_80px_rgba(4,8,20,0.28)]",
      header: "hidden",
      footer: "hidden",
      form: "gap-4 px-6 pb-6 sm:px-8 sm:pb-8",
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
          <div className="auth-orb absolute left-[12%] top-[18%] h-56 w-56 rounded-full bg-[rgba(108,99,255,0.26)] blur-3xl" />
          <div className="auth-orb absolute right-[15%] top-[14%] h-48 w-48 rounded-full bg-[rgba(59,130,246,0.22)] blur-3xl" />
          <div className="auth-orb absolute bottom-[14%] left-[30%] h-64 w-64 rounded-full bg-[rgba(124,116,255,0.16)] blur-3xl" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between px-14 py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--info)] shadow-[0_18px_38px_rgba(108,99,255,0.24)]">
              <img src={`${basePath}/logo.svg`} alt="TeamFlow" className="h-6 w-6 brightness-200" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white">TeamFlow</div>
              <div className="text-sm text-white/60">High-velocity work orchestration</div>
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/72">
              <Sparkles className="h-3.5 w-3.5" />
              Calm, fast, production-ready
            </div>
            <h1 className="max-w-lg text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-white">
              {title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-white/70">{subtitle}</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["Faster focus", "Keep task context, owners, and blockers visible in one place."],
                ["Cleaner collaboration", "Stay aligned without digging through scattered updates."],
                ["Confident delivery", "Move from plan to shipped work with less friction."],
              ].map(([heading, body]) => (
                <div key={heading} className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-sm">
                  <div className="text-sm font-semibold text-white">{heading}</div>
                  <div className="mt-2 text-sm leading-6 text-white/64">{body}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-5 py-4 text-sm text-white/72 backdrop-blur-sm">
            <span>Used by ambitious teams to run projects with less noise.</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-4 py-10 sm:px-8 lg:px-12">
        <div className="pointer-events-none absolute inset-0 lg:hidden">
          <div className="absolute left-[10%] top-12 h-40 w-40 rounded-full bg-[rgba(108,99,255,0.24)] blur-3xl" />
          <div className="absolute right-[10%] top-32 h-32 w-32 rounded-full bg-[rgba(59,130,246,0.18)] blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-[460px]">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--info)] shadow-[0_12px_30px_rgba(108,99,255,0.24)]">
              <img src={`${basePath}/logo.svg`} alt="TeamFlow" className="h-5 w-5 brightness-200" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-[var(--text-primary)]">TeamFlow</div>
              <div className="text-xs text-[var(--text-secondary)]">Work orchestration hub</div>
            </div>
          </div>

          <div className="surface-card overflow-hidden rounded-[28px] border-[var(--border)] p-0">
            <div className="border-b border-[var(--border)] px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Secure authentication
              </div>
              <h2 className="mt-4 max-w-[14ch] text-3xl font-semibold leading-tight text-[var(--text-primary)] sm:text-[2rem]">
                {title}
              </h2>
              <p className="mt-2 max-w-[36ch] text-sm leading-6 text-[var(--text-secondary)]">{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-card)_88%,transparent)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <ShieldCheck className="h-4 w-4 text-[var(--accent)]" />
              Protected by secure Clerk sign-in
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-card)_88%,transparent)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Redirects straight to your dashboard
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SignInPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to review priorities, unblock teammates, and get back to shipping."
    >
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/dashboard`}
        appearance={getClerkAppearance()}
      />
    </AuthShell>
  );
}
