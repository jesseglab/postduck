"use client";

import { CollectionTree } from "./collection-tree";
import { EnvironmentSelector } from "./environment-selector";
import { RequestHistory } from "./request-history";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Settings,
  Trash2,
  Cloud,
  CloudOff,
  Moon,
  Sun,
  Download,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useState, useEffect, useRef, useMemo } from "react";
import { Logo } from "@/components/ui/logo";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { clearLocalStorage } from "@/lib/db/local";
import { useRouter } from "next/navigation";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useSelectedRequest } from "@/hooks/use-request";
import { requestToCurl } from "@/lib/curl-parser";
import { isAuthSessionExpired, formatTimeAgo } from "@/lib/auth-extraction";
import { deleteAuthSession } from "@/hooks/use-local-db";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/local";
import { useTheme } from "next-themes";
import { useTeam, useTeamRole } from "@/hooks/use-team";
import { getRoleDisplayName, canManage } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import type {
  AuthSession,
  RequestHistory as RequestHistoryType,
  Team,
} from "@/types";

interface SidebarProps {
  onHistoryItemClick?: (historyItem: RequestHistoryType) => void;
}

export function Sidebar({ onHistoryItemClick }: SidebarProps) {
  const {
    workspace,
    setRequests,
    setCollections,
    setEnvironments,
    setWorkspace,
    setSelectedRequest,
    setSelectedCollection,
    setActiveEnvironment,
    setAuthSessions,
    deleteAuthSession: deleteFromStore,
  } = useAppStore();
  const [showClearStorageDialog, setShowClearStorageDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState<"success" | "error">(
    "success"
  );
  const router = useRouter();
  const selectedRequest = useSelectedRequest();
  const prevSessionsRef = useRef<string>("");
  const { theme, setTheme } = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch teams and current user
  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setCurrentUserId(data.id);
        }
      })
      .catch(() => {});

    fetch("/api/teams")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          setTeams(data);
          // Set current team from workspace if it's a team workspace
          if (workspace && (workspace as any).teamId) {
            setCurrentTeamId((workspace as any).teamId);
          } else if (data.length > 0) {
            setCurrentTeamId(data[0].id);
          }
        }
      })
      .catch(() => {});
  }, [workspace]);

  const currentUserRole = useTeamRole(currentTeamId, currentUserId);
  const canManageTeam = canManage(currentUserRole);

  // Live query for auth sessions
  const sessionsQuery = useLiveQuery(
    () =>
      workspace
        ? db.authSessions.where("workspaceId").equals(workspace.id).toArray()
        : Promise.resolve([] as AuthSession[]),
    [workspace?.id]
  );

  const sessions: AuthSession[] = useMemo(() => {
    return (sessionsQuery as AuthSession[] | undefined) || [];
  }, [sessionsQuery]);

  // Sync auth sessions to store
  useEffect(() => {
    const sessionsStr = JSON.stringify(sessions ?? []);
    if (prevSessionsRef.current !== sessionsStr) {
      prevSessionsRef.current = sessionsStr;
      setAuthSessions(sessions ?? []);
    }
  }, [sessions, setAuthSessions]);

  const handleClearStorage = async () => {
    await clearLocalStorage();
    // Reset store state
    setRequests([]);
    setCollections([]);
    setEnvironments([]);
    // setWorkspace(null);
    setSelectedRequest(null);
    setSelectedCollection(null);
    // setActiveEnvironment(null);
    // The useLocalDB hook will automatically reinitialize and update the store
  };

  const handleSync = async (direction: "to-cloud" | "from-cloud") => {
    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        setAlertMessage("Sync completed successfully!");
        setAlertVariant("success");
        setShowAlert(true);
        router.refresh();
      } else {
        const data = await response.json();
        setAlertMessage(`Sync failed: ${data.error || "Unknown error"}`);
        setAlertVariant("error");
        setShowAlert(true);
      }
    } catch (error) {
      setAlertMessage(
        `Sync error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setAlertVariant("error");
      setShowAlert(true);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCurl = () => {
    if (!selectedRequest) return;

    const curlCommand = requestToCurl(selectedRequest);
    navigator.clipboard.writeText(curlCommand).then(() => {
      setAlertMessage("cURL command copied to clipboard!");
      setAlertVariant("success");
      setShowAlert(true);
    });
  };

  const handleLogout = async (sessionId: string) => {
    await deleteAuthSession(sessionId);
    deleteFromStore(sessionId);
  };

  return (
    <div className="w-64 border-r bg-sidebar flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Logo width={24} height={24} />
          <h1 className="font-semibold text-lg">Postduck</h1>
        </div>
        {currentTeamId && currentUserRole && (
          <div className="mt-2 space-y-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-auto py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    <span className="text-xs font-medium truncate">
                      {teams.find((t) => t.id === currentTeamId)?.name ||
                        "Team"}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Switch Team</DropdownMenuLabel>
                {teams.map((team) => (
                  <DropdownMenuItem
                    key={team.id}
                    onClick={() => {
                      setCurrentTeamId(team.id);
                      // TODO: Load team workspace
                    }}
                  >
                    {team.name}
                    {team.id === currentTeamId && (
                      <CheckCircle2 className="h-3 w-3 ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/team")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Teams
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="outline" className="text-xs">
              {getRoleDisplayName(currentUserRole)}
            </Badge>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">Collections</p>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <CollectionTree />
      </div>

      <div className="border-t shrink-0">
        <RequestHistory onHistoryItemClick={onHistoryItemClick} />
      </div>

      <div className="p-4 border-t space-y-2 shrink-0">
        <EnvironmentSelector />

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {sessions && sessions.length > 0 && (
                <>
                  <DropdownMenuLabel>Auth Sessions</DropdownMenuLabel>
                  {sessions.map((session) => {
                    const expired = isAuthSessionExpired(session);
                    return (
                      <DropdownMenuItem
                        key={session.id}
                        className="flex items-center justify-between"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLogout(session.id);
                          }}
                          title="Logout"
                        >
                          <LogOut className="h-3 w-3" />
                        </Button>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                </>
              )}
              {!currentTeamId && (
                <>
                  <DropdownMenuItem onClick={() => handleSync("to-cloud")}>
                    <Cloud className="h-4 w-4 mr-2" />
                    {isSyncing ? "Syncing..." : "Sync to Cloud"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSync("from-cloud")}>
                    <CloudOff className="h-4 w-4 mr-2" />
                    {isSyncing ? "Syncing..." : "Sync from Cloud"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {currentTeamId && canManageTeam && (
                <DropdownMenuItem onClick={() => router.push("/team")}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/login")}>
                Login / Register
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  const currentTheme = theme || "light";
                  setTheme(currentTheme === "dark" ? "light" : "dark");
                }}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 mr-2" />
                ) : (
                  <Moon className="h-4 w-4 mr-2" />
                )}
                Toggle Theme
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleExportCurl}
                disabled={!selectedRequest}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as cURL
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowClearStorageDialog(true)}
                variant="destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Local Storage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={showClearStorageDialog}
        onOpenChange={setShowClearStorageDialog}
        title="Clear Local Storage"
        message="This will permanently delete all your local data including collections, requests, environments, and request history. This action cannot be undone. Are you sure you want to continue?"
        confirmText="Clear All Data"
        onConfirm={handleClearStorage}
      />
      <AlertDialog
        open={showAlert}
        onOpenChange={setShowAlert}
        message={alertMessage}
        variant={alertVariant}
      />
    </div>
  );
}
