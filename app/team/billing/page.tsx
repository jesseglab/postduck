"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeam } from "@/hooks/use-team";
import { BillingSettings } from "@/components/team/billing-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function BillingPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setCurrentUserId(data.id);
        }
      });

    // Get user's teams and use first one
    fetch("/api/teams")
      .then((res) => res.json())
      .then((teams) => {
        if (teams.length > 0) {
          setTeamId(teams[0].id);
        } else {
          router.push("/team");
        }
      })
      .catch(() => {
        router.push("/team");
      });
  }, [router]);

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
          onClick={() => router.push("/team")}
          className="mb-4"
        >
          <ArrowLeft className="size-4" />
          Back to Team Settings
        </Button>
        <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your team's subscription and billing information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>
            Subscribe to unlock team features, or manage your existing
            subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillingSettings teamId={teamId} userId={currentUserId} />
        </CardContent>
      </Card>
    </div>
  );
}
