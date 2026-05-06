import { useState } from "react";
import { useParams, Link } from "wouter";
import { useGetProject, useListProjectMembers, useAddProjectMember, useRemoveProjectMember, useUpdateProjectMemberRole, getGetProjectQueryKey, getListProjectMembersQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getTone(name) {
  const tones = [
    "from-violet-500 to-indigo-500",
    "from-sky-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-fuchsia-500 to-pink-500",
    "from-orange-500 to-amber-500",
  ];
  const index = (name || "")
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % tones.length;
  return tones[index];
}

export default function ProjectMembers() {
  const { projectId: projectIdStr } = useParams();
  const projectId = parseInt(projectIdStr || "0", 10);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [emailToInvite, setEmailToInvite] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });
  const { data: members, isLoading: isLoadingMembers } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) },
  });

  const addMemberMutation = useAddProjectMember();
  const updateRoleMutation = useUpdateProjectMemberRole();
  const removeMemberMutation = useRemoveProjectMember();
  const isAdmin = project?.myRole === "admin";

  const handleInvite = (event) => {
    event.preventDefault();
    if (!emailToInvite) return;
    addMemberMutation.mutate(
      { projectId, data: { email: emailToInvite, role: inviteRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          setEmailToInvite("");
          setInviteOpen(false);
          toast({ title: "Member invited successfully" });
        },
        onError: (err) => {
          toast({
            title: "Failed to invite member",
            description: err.error,
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleUpdateRole = (memberUserId, newRole) => {
    updateRoleMutation.mutate(
      { projectId, userId: memberUserId, data: { role: newRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
          toast({ title: "Role updated" });
        },
      },
    );
  };

  const handleRemove = (memberUserId) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    removeMemberMutation.mutate(
      { projectId, userId: memberUserId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Member removed" });
        },
      },
    );
  };

  if (isLoadingProject || isLoadingMembers) {
    return (
      <Layout>
        <div className="space-y-6">
          <Skeleton className="shimmer h-7 w-40 rounded-lg bg-[var(--bg-hover)]" />
          <Skeleton className="shimmer h-32 rounded-[24px] bg-[var(--bg-hover)]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4].map((item) => (
              <Skeleton key={item} className="shimmer h-[240px] rounded-[24px] bg-[var(--bg-hover)]" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-8">
        <section className="surface-card rounded-[24px] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
            <Link href={`/projects/${project.id}`} className="inline-flex items-center gap-1 hover:text-[var(--text-primary)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {project.name}
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Admin view
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">Team</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                Manage access, update roles, and keep contributors aligned within <span className="text-[var(--text-primary)]">{project.name}</span>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                {members?.length || 0} members
              </div>

              {isAdmin && (
                <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-11 rounded-xl bg-[var(--accent)] px-5 text-white shadow-[0_18px_38px_rgba(108,99,255,0.24)] hover:bg-[var(--accent-hover)]">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="surface-card max-w-[460px] rounded-[24px] border-[var(--border)] bg-[var(--bg-card)] p-0">
                    <DialogHeader className="border-b border-[var(--border)] px-8 pb-6 pt-8 text-left">
                      <DialogTitle className="text-2xl font-semibold text-[var(--text-primary)]">Invite teammate</DialogTitle>
                      <DialogDescription className="mt-2 text-sm text-[var(--text-secondary)]">
                        Send an invitation to collaborate on this project.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleInvite} className="space-y-6 px-8 py-8">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">Email address</label>
                        <Input
                          type="email"
                          value={emailToInvite}
                          onChange={(event) => setEmailToInvite(event.target.value)}
                          placeholder="teammate@example.com"
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-visible:ring-0 focus-ring"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--text-primary)]">Role</label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter className="border-t border-[var(--border)] pt-6">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                          onClick={() => setInviteOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={!emailToInvite || addMemberMutation.isPending}
                          className="h-11 rounded-xl bg-[var(--accent)] px-5 text-white hover:bg-[var(--accent-hover)]"
                        >
                          {addMemberMutation.isPending ? "Sending..." : "Send Invite"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </section>

        {(members || []).length > 0 ? (
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => {
              const tasksAssigned = member.role === "admin" ? project.totalTasks : Math.max(1, Math.ceil(project.totalTasks / Math.max(members.length, 1)));
              const tasksCompleted = Math.min(tasksAssigned, Math.floor(project.completedTasks / Math.max(members.length, 1)) + (member.role === "admin" ? 1 : 0));
              const tone = getTone(member.user.name);
              return (
                <div key={member.id} className="surface-card rounded-[24px] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border border-[var(--border)]">
                        <AvatarImage src={member.user.avatarUrl || undefined} />
                        <AvatarFallback className={`bg-gradient-to-br ${tone} text-lg font-semibold text-white`}>
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate text-lg font-semibold text-[var(--text-primary)]">{member.user.name}</div>
                        <div className="truncate text-sm text-[var(--text-secondary)]">{member.user.email}</div>
                        <div className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          member.role === "admin" ? "accent-pill" : "info-pill"
                        }`}>
                          {member.role === "admin" && <Shield className="h-3.5 w-3.5" />}
                          {member.role}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                      <div className="text-2xl font-semibold text-[var(--text-primary)]">{tasksAssigned}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Assigned</div>
                    </div>
                    <div className="rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4">
                      <div className="text-2xl font-semibold text-[var(--text-primary)]">{tasksCompleted}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">Completed</div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[18px] border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                    Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                  </div>

                  {isAdmin ? (
                    <div className="mt-6 flex flex-col gap-3">
                      <Select value={member.role} onValueChange={(value) => handleUpdateRole(member.userId, value)}>
                        <SelectTrigger className="h-11 rounded-xl border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="surface-card border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)]">
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        className="h-11 rounded-xl border-[rgba(239,68,68,0.18)] bg-[rgba(239,68,68,0.08)] text-[var(--danger)] hover:bg-[rgba(239,68,68,0.14)]"
                        onClick={() => handleRemove(member.userId)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-[18px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                      Role changes are limited to project admins.
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ) : (
          <section className="surface-card flex flex-col items-center justify-center rounded-[24px] px-6 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[var(--bg-secondary)] text-[var(--accent)]">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-[var(--text-primary)]">No members yet</h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)]">
              Invite your first collaborator to start assigning work and sharing progress in this project.
            </p>
            {isAdmin && (
              <Button
                className="mt-8 h-11 rounded-xl bg-[var(--accent)] px-5 text-white hover:bg-[var(--accent-hover)]"
                onClick={() => setInviteOpen(true)}
              >
                <Mail className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          </section>
        )}
      </div>
    </Layout>
  );
}
