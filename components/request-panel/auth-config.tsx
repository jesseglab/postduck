"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import { updateRequest } from "@/hooks/use-local-db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  isAuthSessionExpired,
  getActiveAuthSession,
} from "@/lib/auth-extraction";
import { CheckCircle2 } from "lucide-react";
import type { AuthType, AuthConfig, AuthSession } from "@/types";

export function AuthConfig() {
  const selectedRequest = useSelectedRequest();
  const { updateRequest: updateRequestStore, authSessions } = useAppStore();

  // Check if global auth session is active (will override request auth)
  const globalSession = useMemo(() => {
    return getActiveAuthSession(authSessions) as AuthSession | null;
  }, [authSessions]);
  const [authType, setAuthType] = useState<AuthType>("none");
  const [authConfig, setAuthConfig] = useState<AuthConfig>({});
  const [useAuthSession, setUseAuthSession] = useState<string | null>(null);

  useEffect(() => {
    if (selectedRequest) {
      setAuthType(selectedRequest.authType);
      setAuthConfig(selectedRequest.authConfig || {});
      setUseAuthSession(selectedRequest.useAuthSession || null);
    }
  }, [selectedRequest]);

  const handleAuthTypeChange = async (newType: AuthType) => {
    if (!selectedRequest) return;
    setAuthType(newType);

    const newConfig: AuthConfig = {};
    if (newType === "bearer") {
      newConfig.bearer = { token: "" };
    } else if (newType === "basic") {
      newConfig.basic = { username: "", password: "" };
    } else if (newType === "apikey") {
      newConfig.apikey = { key: "", value: "", addTo: "header" };
    } else if (newType === "saved-session") {
      // No config needed for saved session
    }

    await updateRequest(selectedRequest.id, {
      authType: newType,
      authConfig: newConfig,
      useAuthSession: newType === "saved-session" ? useAuthSession : null,
    });
    updateRequestStore(selectedRequest.id, {
      authType: newType,
      authConfig: newConfig,
      useAuthSession: newType === "saved-session" ? useAuthSession : null,
    });
    setAuthConfig(newConfig);
  };

  const handleSessionChange = async (sessionId: string | null) => {
    if (!selectedRequest) return;
    setUseAuthSession(sessionId);
    await updateRequest(selectedRequest.id, { useAuthSession: sessionId });
    updateRequestStore(selectedRequest.id, { useAuthSession: sessionId });
  };

  const handleConfigChange = async (field: string, value: any) => {
    if (!selectedRequest) return;
    const newConfig = { ...authConfig };

    if (authType === "bearer") {
      newConfig.bearer = { token: "", ...newConfig.bearer, [field]: value };
    } else if (authType === "basic") {
      newConfig.basic = {
        username: "",
        password: "",
        ...newConfig.basic,
        [field]: value,
      };
    } else if (authType === "apikey") {
      newConfig.apikey = {
        key: "",
        value: "",
        addTo: "header" as const,
        ...newConfig.apikey,
        [field]: value,
      };
    }

    setAuthConfig(newConfig);
    await updateRequest(selectedRequest.id, { authConfig: newConfig });
    updateRequestStore(selectedRequest.id, { authConfig: newConfig });
  };

  if (!selectedRequest) return null;

  return (
    <div className="p-4 space-y-4 relative">
      {globalSession && (
        <div className="absolute inset-0 bg-green-500/10 border-2 border-green-500/30 rounded-lg pointer-events-none z-10 flex items-start justify-start p-4">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium shadow-lg">
            <CheckCircle2 className="h-4 w-4" />
            <span>Logged In</span>
            <span className="text-xs opacity-90">
              ({globalSession.name || "Global Session"})
            </span>
          </div>
        </div>
      )}
      <div className={globalSession ? "opacity-50 pointer-events-none" : ""}>
        <div>
          <label className="text-sm font-medium mb-2 block">Auth Type</label>
          <Select
            value={authType}
            onValueChange={(value) => handleAuthTypeChange(value as AuthType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Auth</SelectItem>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="basic">Basic Auth</SelectItem>
              <SelectItem value="apikey">API Key</SelectItem>
              <SelectItem value="saved-session">Saved Session</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {authType === "bearer" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Token</label>
            <Input
              type="password"
              placeholder="Bearer token"
              value={authConfig.bearer?.token || ""}
              onChange={(e) => handleConfigChange("token", e.target.value)}
            />
          </div>
        )}

        {authType === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Username</label>
              <Input
                placeholder="Username"
                value={authConfig.basic?.username || ""}
                onChange={(e) => handleConfigChange("username", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Password</label>
              <Input
                type="password"
                placeholder="Password"
                value={authConfig.basic?.password || ""}
                onChange={(e) => handleConfigChange("password", e.target.value)}
              />
            </div>
          </div>
        )}

        {authType === "apikey" && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Key</label>
              <Input
                placeholder="API key name"
                value={authConfig.apikey?.key || ""}
                onChange={(e) => handleConfigChange("key", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Value</label>
              <Input
                type="password"
                placeholder="API key value"
                value={authConfig.apikey?.value || ""}
                onChange={(e) => handleConfigChange("value", e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Add to</label>
              <Select
                value={authConfig.apikey?.addTo || "header"}
                onValueChange={(value) => handleConfigChange("addTo", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="query">Query Parameter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {authType === "saved-session" && (
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select Auth Session
            </label>
            <Select
              value={useAuthSession || ""}
              onValueChange={(value) => handleSessionChange(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a saved session" />
              </SelectTrigger>
              <SelectContent>
                {authSessions.length === 0
                  ? null
                  : authSessions.map((session) => {
                      const expired = isAuthSessionExpired(session);
                      return (
                        <SelectItem key={session.id} value={session.id}>
                          <div className="flex items-center gap-2">
                            <span>{session.name || "Unnamed Session"}</span>
                            {expired && (
                              <Badge variant="outline" className="text-xs">
                                Expired
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
              </SelectContent>
            </Select>
            {authSessions.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Create an auth request and execute it to save a session
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
