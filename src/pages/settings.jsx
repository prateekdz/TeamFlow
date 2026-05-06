import { useEffect } from "react";
import { useGetMe, useUpdateMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Link2, UploadCloud, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().url("Must be a valid URL").or(z.string().length(0)).optional().nullable(),
});

function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function isPlaceholderName(name) {
  if (!name) return true;
  return name.includes("@clerk.local") || name.startsWith("user_");
}

export default function Settings() {
  const { data: dbUser, isLoading } = useGetMe();
  const { user: clerkUser } = useUser();
  const updateMeMutation = useUpdateMe();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Use Clerk as source of truth for display; fall back to DB
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? "";
  const clerkName = clerkUser?.fullName || clerkUser?.firstName || "";
  // For display: use Clerk name, then real email username, never show @clerk.local
  const displayName = clerkName
    || (!isPlaceholderName(dbUser?.name) ? dbUser?.name : "")
    || (clerkEmail ? clerkEmail.split("@")[0] : "");
  const displayEmail = clerkEmail || (!dbUser?.email?.includes("@clerk.local") ? dbUser?.email : "") || "";
  const displayAvatar = clerkUser?.imageUrl || dbUser?.avatarUrl || undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(settingsSchema),
  });

  const previewAvatarUrl = watch("avatarUrl");

  useEffect(() => {
    const nameToUse = clerkName
      || (!isPlaceholderName(dbUser?.name) ? dbUser?.name : "")
      || (clerkEmail ? clerkEmail.split("@")[0] : "");
    if (nameToUse || dbUser) {
      reset({
        name: nameToUse,
        avatarUrl: dbUser?.avatarUrl || "",
      });
    }
  }, [dbUser?.name, dbUser?.avatarUrl, clerkName, clerkEmail, reset]);

  const onSubmit = (data) => {
    const payload = {
      name: data.name,
      avatarUrl: data.avatarUrl === "" ? null : data.avatarUrl,
    };
    updateMeMutation.mutate(
      { data: payload },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(getGetMeQueryKey(), updatedUser);
          queryClient.refetchQueries({ queryKey: getGetMeQueryKey() });
          reset({
            name: updatedUser.name,
            avatarUrl: updatedUser.avatarUrl || "",
          });
          toast({
            title: "Profile updated",
            description: "Your name has been saved.",
          });
        },
        onError: (err) => {
          toast({
            title: "Update failed",
            description: err.error,
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <Layout>
      <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-8">
        <section className="surface-card rounded-[24px] p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            Workspace profile
          </div>
          <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">Settings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Manage your identity, keep your workspace recognizable, and make sure collaborators see the right profile details.
          </p>
        </section>

        {isLoading ? (
          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Skeleton className="shimmer h-[320px] rounded-[24px] bg-[var(--bg-hover)]" />
            <Skeleton className="shimmer h-[420px] rounded-[24px] bg-[var(--bg-hover)]" />
          </section>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <section className="surface-card rounded-[24px] p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-28 w-28 border border-[var(--border)] shadow-[0_18px_38px_rgba(0,0,0,0.22)]">
                  <AvatarImage src={previewAvatarUrl || displayAvatar} />
                  <AvatarFallback className="bg-gradient-to-br from-[var(--accent)] to-[var(--info)] text-3xl font-semibold text-white">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="mt-5 text-xl font-semibold text-[var(--text-primary)]">
                  {displayName || "Set your name below"}
                </div>
                <div className="mt-1 text-sm text-[var(--text-secondary)]">{displayEmail}</div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <UserRound className="h-4 w-4" />
                    Identity
                  </div>
                  <div className="mt-3 text-sm text-[var(--text-secondary)]">
                    Your public workspace name and avatar help teammates recognize updates instantly.
                  </div>
                </div>
                <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 text-left">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <CheckCircle2 className="h-4 w-4" />
                    Auth managed
                  </div>
                  <div className="mt-3 text-sm text-[var(--text-secondary)]">
                    Email and secure sign-in are handled by your authentication provider.
                  </div>
                </div>
              </div>
            </section>

            <section className="surface-card rounded-[24px] p-6 sm:p-8">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Profile information</h2>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    Update the details that appear throughout the workspace.
                  </p>
                </div>

                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-6">
                  <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    <UploadCloud className="h-4 w-4" />
                    Avatar source
                  </div>
                  <Label htmlFor="avatarUrl" className="text-sm font-medium text-[var(--text-primary)]">
                    Avatar URL
                  </Label>
                  <div className="relative mt-2">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/avatar.jpg"
                      {...register("avatarUrl")}
                      className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-card)] pl-9 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-ring"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">
                    Leave this blank to use your initials. A direct image URL works best.
                  </p>
                  {errors.avatarUrl && <p className="error-shake mt-2 text-xs text-[var(--danger)]">{errors.avatarUrl.message}</p>}
                </div>

                <div className="grid gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-[var(--text-primary)]">
                      Full name
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] focus-visible:ring-0 focus-ring"
                    />
                    {errors.name && <p className="error-shake text-xs text-[var(--danger)]">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-[var(--text-primary)]">
                      Email address
                    </Label>
                    <Input
                      id="email"
                      value={displayEmail}
                      disabled
                      className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)]/60 text-[var(--text-secondary)]"
                    />
                    <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Email is managed securely by your authentication provider.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end border-t border-[var(--border)] pt-6">
                  <Button
                    type="submit"
                    disabled={updateMeMutation.isPending}
                    className="h-11 rounded-xl bg-[var(--accent)] px-6 text-white hover:bg-[var(--accent-hover)]"
                  >
                    {updateMeMutation.isPending ? "Saving changes..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </section>
          </form>
        )}
      </div>
    </Layout>
  );
}
