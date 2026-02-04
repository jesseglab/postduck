"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { isAuthSessionExpired, formatTimeAgo } from "@/lib/auth-extraction";
import { deleteAuthSession } from "@/hooks/use-local-db";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/local";
import type { AuthSession } from "@/types";

export function AuthSessionIndicator() {
  const {
    workspace,
    setAuthSessions,
    deleteAuthSession: deleteFromStore,
  } = useAppStore();
  const prevSessionsRef = useRef<string>("");

  // Live query for reactive updates
  const sessions =
    useLiveQuery(
      () =>
        workspace
          ? db.authSessions.where("workspaceId").equals(workspace.id).toArray()
          : Promise.resolve([] as AuthSession[]),
      [workspace?.id]
    ) || [];

  // Sync to store
  useEffect(() => {
    const sessionsStr = JSON.stringify(sessions ?? []);
    if (prevSessionsRef.current !== sessionsStr) {
      prevSessionsRef.current = sessionsStr;
      setAuthSessions(sessions ?? []);
    }
  }, [sessions, setAuthSessions]);

  const handleLogout = async (sessionId: string) => {
    await deleteAuthSession(sessionId);
    deleteFromStore(sessionId);
  };

  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 border-b pb-4 mb-4">
      <div className="text-xs font-medium text-muted-foreground px-4">
        Auth Sessions
      </div>
      {sessions.map((session) => {
        const expired = isAuthSessionExpired(session);
        return (
          <div
            key={session.id}
            className="px-4 py-2 flex items-center justify-between gap-2 hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {expired ? (
                  <AlertCircle className="h-3 w-3 text-yellow-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                )}
                <span className="text-sm font-medium truncate">
                  {session.name || "Auth Session"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatTimeAgo(session.createdAt)}
                {expired && " (expired)"}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => handleLogout(session.id)}
              title="Logout"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
