"use client";

import { useState, useMemo } from "react";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import { CheckCircle2, ChevronDown, Eye, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/lib/db/local";
import { deleteAuthSession } from "@/hooks/use-local-db";
import { LoginResponseDialog } from "./login-response-dialog";
import { getActiveAuthSession } from "@/lib/auth-extraction";
import type { ExecuteResponse, AuthSession } from "@/types";

interface AuthStatusIndicatorProps {
  onOpenLoginResponse?: (response: ExecuteResponse) => void;
}

export function AuthStatusIndicator({
  onOpenLoginResponse,
}: AuthStatusIndicatorProps) {
  const { authSessions, deleteAuthSession: deleteFromStore } = useAppStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loginResponse, setLoginResponse] = useState<ExecuteResponse | null>(
    null
  );

  // Get the most recent active global auth session (not tied to a specific request)
  const authSession = useMemo(() => {
    return getActiveAuthSession(authSessions) as AuthSession | null;
  }, [authSessions]);

  // If no active auth session exists, don't show anything
  if (!authSession) return null;

  const handleViewResponse = async () => {
    if (!authSession.loginResponseHistoryId) {
      console.warn("No login response history ID found");
      return;
    }

    try {
      // Fetch the history entry
      const historyEntry = await db.requestHistory.get(
        authSession.loginResponseHistoryId
      );

      if (!historyEntry) {
        console.warn(
          "History entry not found:",
          authSession.loginResponseHistoryId
        );
        return;
      }

      // Parse cookies from Set-Cookie headers if available
      const cookies: Array<{
        name: string;
        value: string;
        domain?: string;
        path?: string;
        expires?: string;
      }> = [];

      // Check for Set-Cookie headers (case-insensitive)
      Object.entries(historyEntry.responseHeaders).forEach(([key, value]) => {
        if (key.toLowerCase() === "set-cookie" && typeof value === "string") {
          // Parse Set-Cookie header
          const parts = value.split(";").map((p) => p.trim());
          const firstEqualsIndex = parts[0].indexOf("=");
          const name =
            firstEqualsIndex > 0
              ? parts[0].substring(0, firstEqualsIndex).trim()
              : parts[0].trim();
          const cookieValue =
            firstEqualsIndex > 0
              ? parts[0].substring(firstEqualsIndex + 1).trim()
              : "";

          if (name) {
            const cookie: (typeof cookies)[0] = {
              name,
              value: cookieValue || "",
            };

            parts.slice(1).forEach((part) => {
              const lowerPart = part.toLowerCase();
              if (lowerPart.startsWith("domain=")) {
                cookie.domain = part.split("=").slice(1).join("=");
              } else if (lowerPart.startsWith("path=")) {
                cookie.path = part.split("=").slice(1).join("=");
              } else if (lowerPart.startsWith("expires=")) {
                cookie.expires = part.split("=").slice(1).join("=");
              }
            });

            cookies.push(cookie);
          }
        }
      });

      // Convert history entry to ExecuteResponse format
      const response: ExecuteResponse = {
        statusCode: historyEntry.statusCode,
        headers: historyEntry.responseHeaders,
        body: historyEntry.responseBody,
        duration: historyEntry.duration,
        size: new Blob([historyEntry.responseBody]).size,
        cookies: cookies.length > 0 ? cookies : undefined,
      };

      setLoginResponse(response);
      setDialogOpen(true);

      // Also call the callback if provided (for backwards compatibility)
      if (onOpenLoginResponse) {
        onOpenLoginResponse(response);
      }
    } catch (error) {
      console.error("Failed to load login response:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await deleteAuthSession(authSession.id);
      deleteFromStore(authSession.id);
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950"
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            <span className="text-xs font-medium">Logged in</span>
            <ChevronDown className="h-3 w-3 ml-1.5 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            {authSession.name || "Auth Session"}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleViewResponse}>
            <Eye className="h-4 w-4 mr-2" />
            View Login Response
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} variant="destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LoginResponseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        response={loginResponse}
        sessionName={authSession.name}
      />
    </>
  );
}
