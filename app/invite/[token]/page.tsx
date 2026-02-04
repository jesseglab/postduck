"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid invitation link");
      return;
    }

    const acceptInvitation = async () => {
      try {
        const response = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to accept invitation");
        }

        setStatus("success");
        setMessage("Successfully joined the team!");

        // Redirect to team page after 2 seconds
        setTimeout(() => {
          router.push("/team");
        }, 2000);
      } catch (error) {
        console.error("Accept invitation error:", error);
        setStatus("error");
        setMessage(
          error instanceof Error ? error.message : "Failed to accept invitation"
        );
      }
    };

    acceptInvitation();
  }, [token, router]);

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            {status === "loading" && "Processing your invitation..."}
            {status === "success" && "Welcome to the team!"}
            {status === "error" && "Unable to process invitation"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Accepting invitation...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="size-12 text-green-500" />
              <p className="text-center">{message}</p>
              <p className="text-sm text-muted-foreground">
                Redirecting to team page...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="size-12 text-destructive" />
              <p className="text-center text-destructive">{message}</p>
              <Button onClick={() => router.push("/")} variant="outline">
                Go to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
