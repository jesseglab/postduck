"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useTeam,
  useTeamMembers,
  useTeamInvitations,
  useTeamRole,
} from "@/hooks/use-team";
import { getRoleDisplayName, canManage } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MemberList } from "@/components/team/member-list";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";
import { BillingSettings } from "@/components/team/billing-settings";
import { ArrowLeft, Settings, Users, CreditCard } from "lucide-react";

export default function TeamPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  useEffect(() => {
    // Get current user
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setCurrentUserId(data.id);
        }
      });

    // Get user's teams and use first one, or get from URL params
    fetch("/api/teams")
      .then((res) => res.json())
      .then((teams) => {
        if (teams.length > 0) {
          setTeamId(teams[0].id);
        } else {
          setShowCreateTeam(true);
        }
      })
      .catch(() => {
        setShowCreateTeam(true);
      });
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      alert("Please enter a team name");
      return;
    }

    try {
      setCreatingTeam(true);
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create team");
      }

      const team = await response.json();
      setTeamId(team.id);
      setShowCreateTeam(false);
      setNewTeamName("");
    } catch (error) {
      console.error("Failed to create team:", error);
      alert("Failed to create team");
    } finally {
      setCreatingTeam(false);
    }
  };

  const currentUserRole = useTeamRole(teamId, currentUserId);
  const canManageTeam = canManage(currentUserRole);

  if (showCreateTeam) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Team</CardTitle>
            <CardDescription>
              Get started by creating a team workspace. You can invite members
              later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Team Name
              </label>
              <Input
                placeholder="My Awesome Team"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateTeam();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateTeam}
                disabled={creatingTeam || !newTeamName.trim()}
              >
                {creatingTeam ? "Creating..." : "Create Team"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Workspace
        </Button>
        <h1 className="text-3xl font-bold mb-2">Team Management</h1>
        <p className="text-muted-foreground">
          Manage your team members, roles, and billing settings.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage team members and their roles. Your role:{" "}
              <Badge variant="outline">
                {getRoleDisplayName(currentUserRole || "COSMIC_OBSERVER")}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canManageTeam && (
              <div className="mb-4">
                <InviteMemberDialog teamId={teamId} />
              </div>
            )}
            <MemberList teamId={teamId} />
          </CardContent>
        </Card>

        {canManageTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                Billing & Subscription
              </CardTitle>
              <CardDescription>
                Manage your team's subscription and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BillingSettings teamId={teamId} userId={currentUserId} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
