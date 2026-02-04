"use client";

import { useState } from "react";
import { useTeamInvitations } from "@/hooks/use-team";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RoleSelector } from "./role-selector";
import { UserPlus, X } from "lucide-react";
import type { TeamRole } from "@/types";

interface InviteMemberDialogProps {
  teamId: string;
  onInviteSent?: () => void;
}

export function InviteMemberDialog({
  teamId,
  onInviteSent,
}: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("COSMIC_OBSERVER");
  const [loading, setLoading] = useState(false);
  const { refetch } = useTeamInvitations(teamId);

  const handleInvite = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      await refetch();
      setEmail("");
      setRole("COSMIC_OBSERVER");
      setOpen(false);
      onInviteSent?.();
    } catch (error) {
      console.error("Failed to send invitation:", error);
      alert(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="size-4" />
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your team. They will receive an email
            with a link to accept.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Role</label>
            <RoleSelector currentRole={role} onRoleChange={setRole} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={loading || !email}>
              {loading ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
