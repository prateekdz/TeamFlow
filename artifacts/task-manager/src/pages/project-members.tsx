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
import { ArrowLeft, Mail, Shield, User, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
    query: { enabled: !!projectId }
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
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-24 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-10 max-w-4xl mx-auto w-full">
        <div className="flex flex-col gap-4 border-b pb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href={`/projects/${project.id}`} className="hover:text-foreground transition-colors flex items-center">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Back to {project.name}
            </Link>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Members</h1>
            <p className="text-muted-foreground mt-1">Manage who has access to {project.name}.</p>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Invite New Member</h2>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full space-y-2">
                <Input 
                  type="email" 
                  placeholder="colleague@example.com" 
                  value={emailToInvite}
                  onChange={(e) => setEmailToInvite(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="w-full sm:w-auto flex gap-2">
                <select 
                  className="flex h-10 w-[120px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button type="submit" disabled={!emailToInvite || addMemberMutation.isPending}>
                  <Mail className="w-4 h-4 mr-2" />
                  Invite
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-muted/30">
            <h3 className="font-semibold">{members?.length || 0} Members</h3>
          </div>
          <div className="divide-y divide-border">
            {members?.map((member) => (
              <div key={member.id} className="p-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 border shadow-sm">
                    <AvatarImage src={member.user.avatarUrl || undefined} />
                    <AvatarFallback>{member.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm flex items-center gap-2">
                      {member.user.name}
                      {member.role === "admin" && <Badge variant="secondary" className="h-5 text-[10px] px-1.5"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>}
                    </span>
                    <span className="text-xs text-muted-foreground">{member.user.email}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground hidden sm:block text-xs">
                    Joined {format(new Date(member.joinedAt), "MMM d, yyyy")}
                  </span>
                  
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, member.role === "admin" ? "member" : "admin")}>
                          <Shield className="w-4 h-4 mr-2" />
                          Make {member.role === "admin" ? "Member" : "Admin"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemove(member.id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove from project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}