import { SignIn } from "@clerk/react";

export default function SignInPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  
  return (
    <div className="flex min-h-[100dvh] flex-col bg-muted/30">
      <header className="px-6 h-16 flex items-center border-b bg-background">
        <div className="flex items-center gap-2">
          <img src={`${basePath}/logo.svg`} alt="Logo" className="w-6 h-6" />
          <span className="font-bold text-lg tracking-tight">ShipHub</span>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </main>
    </div>
  );
}