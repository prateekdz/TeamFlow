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
          toast({ title: "Profile updated successfully" });
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
      <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account preferences.</p>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center gap-6">
                  <Avatar className="h-24 w-24 border-2">
                    <AvatarImage src={previewAvatarUrl || user?.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl">{user?.name.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">Avatar</h3>
                    <p className="text-xs text-muted-foreground max-w-sm">Provide a URL to an image to use as your avatar. Leave blank to use initials.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...register("name")} />
                    {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ""} disabled className="bg-muted/50 cursor-not-allowed" />
                    <p className="text-xs text-muted-foreground">Email is managed by your authentication provider.</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="avatarUrl">Avatar URL</Label>
                    <Input id="avatarUrl" placeholder="https://example.com/avatar.jpg" {...register("avatarUrl")} />
                    {errors.avatarUrl && <p className="text-sm text-destructive">{errors.avatarUrl.message}</p>}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 px-6 py-4">
                <Button type="submit" disabled={updateMeMutation.isPending}>
                  {updateMeMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}
      </div>
    </Layout>
  );
}