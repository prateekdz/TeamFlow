import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetProject, 
  useListProjectMembers,
  useAddProjectMember,
  useRemoveProjectMember,
  useUpdateProjectMemberRole,
  getListProjectMembersQueryKey,
  getGetProjectQueryKey
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Mail, Shield, User, Trash2, MoreVertical, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ProjectMembers() {
  const { projectId: projectIdStr } = useParams();
  const projectId = parseInt(projectIdStr || "0", 10);
  const [emailToInvite, setEmailToInvite] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading: isLoadingProject } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) }
  });

  const { data: members, isLoading: isLoadingMembers } = useListProjectMembers(projectId, {
    query: { enabled: !!projectId, queryKey: getListProjectMembersQueryKey(projectId) }
  });

  const addMemberMutation = useAddProjectMember();
  const updateRoleMutation = useUpdateProjectMemberRole();
  const removeMemberMutation = useRemoveProjectMember();

  const isAdmin = project?.myRole === "admin";

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailToInvite) return;
    
    addMemberMutation.mutate(
      { projectId, data: { email: emailToInvite, role: inviteRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          setEmailToInvite("");
          toast({ title: "Member invited successfully" });
        },
        onError: (err) => {
          toast({ 
            title: "Failed to invite member", 
            description: err.error, 
            variant: "destructive" 
          });
        }
      }
    );
  };

  const handleUpdateRole = (memberId: number, newRole: "admin" | "member") => {
    updateRoleMutation.mutate(
      { projectId, memberId, data: { role: newRole } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
          toast({ title: "Role updated" });
        }
      }
    );
  };

  const handleRemove = (memberId: number) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    
    removeMemberMutation.mutate(
      { projectId, memberId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProjectMembersQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          toast({ title: "Member removed" });
        }
      }
    );
  };

  if (isLoadingProject || isLoadingMembers) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 fade-in duration-300">
          <Skeleton className="h-8 w-1/4 bg-[var(--bg-hover)]" />
          <Skeleton className="h-24 w-full bg-[var(--bg-hover)]" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full bg-[var(--bg-hover)] rounded-xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10 max-w-4xl mx-auto w-full fade-in duration-300">
        <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-1">
            <Link href={`/projects/${project.id}`} className="hover:text-white transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to {project.name}
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Team Members
              <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-subtle)] align-middle">
                {members?.length || 0}
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage who has access to <span className="text-white font-medium">{project.name}</span>.</p>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--accent)]" /> Add New Member
            </h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium text-white">Email Address</label>
                <Input 
                  type="email" 
                  placeholder="colleague@example.com" 
                  value={emailToInvite}
                  onChange={(e) => setEmailToInvite(e.target.value)}
                  className="bg-[var(--bg-secondary)] border-[var(--border)] text-white focus-visible:ring-[var(--accent)] h-10"
                />
              </div>
              <div className="w-full sm:w-auto flex gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white block">Role</label>
                  <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                    <SelectTrigger className="w-[120px] bg-[var(--bg-secondary)] border-[var(--border)] text-white h-10 focus:ring-[var(--accent)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--bg-card)] border-[var(--border)] text-white">
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={!emailToInvite || addMemberMutation.isPending} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white h-10 mt-auto border-none">
                  <Mail className="w-4 h-4 mr-2" />
                  {addMemberMutation.isPending ? "Inviting..." : "Invite"}
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members?.map((member) => (
            <div key={member.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 flex items-start justify-between group hover:border-[var(--border-subtle)] hover:shadow-md transition-all">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar className="h-12 w-12 border border-[var(--border)] shadow-sm shrink-0">
                  <AvatarImage src={member.user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-[var(--bg-secondary)] text-white font-medium">{member.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-white truncate flex items-center gap-2">
                    {member.user.name}
                  </span>
                  <span className="text-sm text-[var(--text-secondary)] truncate">{member.user.email}</span>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold border ${member.role === 'admin' ? 'bg-[var(--accent-glow)] text-[var(--accent)] border-[var(--accent)]/20' : 'bg-blue-500/10 text-blue-400 border-blue-900/30'}`}>
                      {member.role === 'admin' && <Shield className="w-3 h-3 inline mr-1 -mt-0.5" />}
                      {member.role}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[var(--text-muted)] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[var(--bg-card)] border-[var(--border)] text-white w-48">
                    <DropdownMenuItem className="cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => handleUpdateRole(member.id, member.role === "admin" ? "member" : "admin")}>
                      <Shield className="w-4 h-4 mr-2" />
                      Make {member.role === "admin" ? "Member" : "Admin"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[var(--border)]" />
                    <DropdownMenuItem className="cursor-pointer text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white focus:bg-[var(--danger)] focus:text-white" onClick={() => handleRemove(member.id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove from project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}