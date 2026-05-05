import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, CheckCircle2 } from "lucide-react";

const settingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  avatarUrl: z.string().url("Must be a valid URL").or(z.string().length(0)).optional().nullable(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { data: user, isLoading } = useGetMe();
  const updateMeMutation = useUpdateMe();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  const previewAvatarUrl = watch("avatarUrl");

  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user, reset]);

  const onSubmit = (data: SettingsFormValues) => {
    // Convert empty string to null for API
    const payload = {
      name: data.name,
      avatarUrl: data.avatarUrl === "" ? null : data.avatarUrl,
    };

    updateMeMutation.mutate(
      { data: payload },
      {
        onSuccess: () => {
          toast({ 
            title: "Profile updated successfully",
            description: "Your changes have been saved.",
          });
        },
        onError: (err) => {
          toast({ 
            title: "Update failed", 
            description: err.error,
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col gap-8 pb-10 fade-in duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage your account preferences and profile.</p>
        </div>

        {isLoading ? (
          <Card className="bg-[var(--bg-card)] border-[var(--border)]">
            <CardHeader className="border-b border-[var(--border)] pb-6">
              <Skeleton className="h-6 w-32 mb-2 bg-[var(--bg-hover)]" />
              <Skeleton className="h-4 w-64 bg-[var(--bg-hover)]" />
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="flex gap-6">
                <Skeleton className="h-24 w-24 rounded-full bg-[var(--bg-hover)]" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-4 w-1/3 bg-[var(--bg-hover)]" />
                  <Skeleton className="h-10 w-full bg-[var(--bg-hover)]" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-[var(--bg-hover)]" />
                  <Skeleton className="h-10 w-full bg-[var(--bg-hover)]" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-[var(--bg-hover)]" />
                  <Skeleton className="h-10 w-full bg-[var(--bg-hover)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="bg-[var(--bg-card)] border-[var(--border)] shadow-md overflow-hidden">
              <CardHeader className="border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 pb-6">
                <CardTitle className="text-xl text-white">Profile Information</CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">Update your photo and personal details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 pt-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 bg-[var(--bg-secondary)] p-6 rounded-xl border border-[var(--border-subtle)]">
                  <Avatar className="h-28 w-28 border-4 border-[var(--bg-card)] shadow-xl shrink-0 relative group">
                    <AvatarImage src={previewAvatarUrl || user?.avatarUrl || undefined} />
                    <AvatarFallback className="text-3xl bg-[var(--bg-hover)] text-white font-bold">{user?.name.charAt(0) || "U"}</AvatarFallback>
                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <UploadCloud className="w-8 h-8 text-white" />
                    </div>
                  </Avatar>
                  <div className="space-y-2 flex-1 w-full">
                    <Label htmlFor="avatarUrl" className="text-white text-base">Avatar URL</Label>
                    <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-3">Provide a URL to an image to use as your avatar. Leave blank to use initials.</p>
                    <Input 
                      id="avatarUrl" 
                      placeholder="https://example.com/avatar.jpg" 
                      {...register("avatarUrl")} 
                      className="bg-[var(--bg-card)] border-[var(--border)] text-white focus-visible:ring-[var(--accent)] max-w-md h-10"
                    />
                    {errors.avatarUrl && <p className="text-sm text-[var(--danger)]">{errors.avatarUrl.message}</p>}
                  </div>
                </div>

                <div className="grid gap-6 max-w-2xl">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-white">Full Name</Label>
                    <Input 
                      id="name" 
                      {...register("name")} 
                      className="bg-[var(--bg-secondary)] border-[var(--border)] text-white focus-visible:ring-[var(--accent)] h-10"
                    />
                    {errors.name && <p className="text-sm text-[var(--danger)]">{errors.name.message}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-white">Email Address</Label>
                    <Input 
                      id="email" 
                      value={user?.email || ""} 
                      disabled 
                      className="bg-[var(--bg-secondary)]/50 border-[var(--border)] text-[var(--text-secondary)] cursor-not-allowed h-10" 
                    />
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Email is managed securely by your authentication provider.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-[var(--border)] bg-[var(--bg-secondary)]/50 px-6 py-4 flex justify-end">
                <Button type="submit" disabled={updateMeMutation.isPending} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8">
                  {updateMeMutation.isPending ? "Saving changes..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </Layout>
  );
}