import { SignUp } from "@clerk/react";

export default function SignUpPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <div className="flex min-h-[100dvh] bg-[var(--bg-primary)]">
      <div className="hidden lg:flex w-1/2 bg-gradient-animated flex-col justify-center px-20 text-white border-r border-[var(--border)]">
        <div className="flex items-center gap-3 mb-8">
          <img src={`${basePath}/logo.svg`} alt="Logo" className="w-10 h-10" />
          <span className="font-bold text-3xl tracking-tight">TeamFlow</span>
        </div>
        <h1 className="text-4xl font-bold mb-4">Get started</h1>
        <p className="text-lg text-white/80 max-w-md">Join your team and start managing projects with precision and speed.</p>
      </div>
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 relative">
        <div className="lg:hidden flex items-center justify-center gap-2 mb-8 absolute top-8 left-0 right-0">
          <img src={`${basePath}/logo.svg`} alt="Logo" className="w-8 h-8" />
          <span className="font-bold text-xl tracking-tight text-white">TeamFlow</span>
        </div>
        <div className="w-full max-w-[400px] mx-auto">
          <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
        </div>
      </div>
    </div>
  );
}