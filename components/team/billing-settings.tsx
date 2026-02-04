"use client";

import { useState, useEffect } from "react";
import { useTeam } from "@/hooks/use-team";
import { useCanManageBilling } from "@/hooks/use-team";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreditCard, ExternalLink } from "lucide-react";

interface BillingSettingsProps {
  teamId: string;
  userId: string | null;
}

export function BillingSettings({ teamId, userId }: BillingSettingsProps) {
  const { team, loading } = useTeam({ teamId });
  const canManage = useCanManageBilling(teamId, userId);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setCheckoutLoading(true);
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create checkout session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      const response = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading billing information...
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="text-sm text-muted-foreground">
        You don't have permission to manage billing for this team.
      </div>
    );
  }

  const subscription = team?.subscription;
  const isActive =
    subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Subscription Status</h3>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "outline"}>
              {subscription?.status || "inactive"}
            </Badge>
            {subscription?.currentPeriodEnd && (
              <span className="text-sm text-muted-foreground">
                {isActive
                  ? `Renews on ${new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}`
                  : `Expires on ${new Date(
                      subscription.currentPeriodEnd
                    ).toLocaleDateString()}`}
              </span>
            )}
          </div>
        </div>

        {!isActive ? (
          <Button onClick={handleCheckout} disabled={checkoutLoading}>
            <CreditCard className="size-4" />
            {checkoutLoading ? "Loading..." : "Subscribe"}
          </Button>
        ) : (
          <Button
            onClick={handlePortal}
            disabled={portalLoading}
            variant="outline"
          >
            <ExternalLink className="size-4" />
            {portalLoading ? "Loading..." : "Manage Subscription"}
          </Button>
        )}
      </div>
    </Card>
  );
}
