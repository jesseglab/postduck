"use client";

import { useState, useEffect } from "react";
import { useTeamMembers, useTeamRole } from "@/hooks/use-team";
import { getRoleDisplayName, canManage } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoleSelector } from "./role-selector";
import { Trash2, UserX } from "lucide-react";
import type { TeamMember, TeamRole } from "@/types";

interface MemberListProps {
  teamId: string;
  onMemberRemoved?: () => void;
}

export function MemberList({ teamId, onMemberRemoved }: MemberListProps) {
  const { members, loading, refetch } = useTeamMembers(teamId);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setCurrentUserId(data.id);
        }
      })
      .catch(() => {
        // User not logged in or error
      });
  }, []);

  const handleRemoveMember = async (memberId: string) => {
    try {
      setRemovingMemberId(memberId);
      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const response = await fetch(
        `/api/teams/${teamId}/members/${member.userId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      await refetch();
      onMemberRemoved?.();
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("Failed to remove member");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: TeamRole) => {
    try {
      const member = members.find((m) => m.id === memberId);
      if (!member) return;

      const response = await fetch(
        `/api/teams/${teamId}/members/${member.userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update role");
      }

      await refetch();
      setEditingMemberId(null);
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Loading members...</div>
    );
  }

  if (members.length === 0) {
    return <div className="text-sm text-muted-foreground">No members yet</div>;
  }

  const currentUserRole = useTeamRole(teamId, currentUserId);
  const canManageTeam = canManage(currentUserRole);

  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-8 rounded-full bg-primary/10 text-primary font-medium">
              {member.user?.name?.[0]?.toUpperCase() ||
                member.user?.email?.[0]?.toUpperCase() ||
                "?"}
            </div>
            <div>
              <div className="font-medium">
                {member.user?.name || member.user?.email || "Unknown"}
              </div>
              <div className="text-sm text-muted-foreground">
                {member.user?.email}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getRoleDisplayName(member.role)}</Badge>
            {canManageTeam && member.userId !== currentUserId && (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setEditingMemberId(member.id)}
                >
                  <UserX className="size-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={removingMemberId === member.id}
                >
                  <Trash2 className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>
      ))}

      <Dialog
        open={editingMemberId !== null}
        onOpenChange={(open) => !open && setEditingMemberId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Member Role</DialogTitle>
            <DialogDescription>
              Select a new role for this team member.
            </DialogDescription>
          </DialogHeader>
          {editingMemberId && (
            <RoleSelector
              currentRole={
                members.find((m) => m.id === editingMemberId)?.role ||
                "COSMIC_OBSERVER"
              }
              onRoleChange={(role) => {
                if (editingMemberId) {
                  handleRoleChange(editingMemberId, role);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
