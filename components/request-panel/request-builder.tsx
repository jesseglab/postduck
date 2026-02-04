"use client";

import { useState } from "react";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import {
  updateRequest,
  createAuthSession,
  updateEnvironment,
} from "@/hooks/use-local-db";
import { UrlBar } from "./url-bar";
import { PathParamsEditor } from "./path-params-editor";
import { Button } from "@/components/ui/button";
import { Send, Save } from "lucide-react";
import { AuthStatusIndicator } from "./auth-status-indicator";
import { useActiveEnvironment } from "@/hooks/use-environment";
import {
  interpolateRequest,
  interpolateVariables,
} from "@/lib/variable-interpolation";
import { replacePathParams } from "@/lib/path-params";
import { extractAuthToken, getActiveAuthSession } from "@/lib/auth-extraction";
import { db } from "@/lib/db/local";
import type {
  ExecuteRequestParams,
  ExecuteResponse,
  HttpMethod,
  AuthSession,
} from "@/types";

interface RequestBuilderProps {
  onExecute: (response: ExecuteResponse) => void;
  isExecuting: boolean;
  setIsExecuting: (value: boolean) => void;
  method: HttpMethod;
  url: string;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onOpenLoginResponse?: (response: ExecuteResponse) => void;
}

export function RequestBuilder({
  onExecute,
  isExecuting,
  setIsExecuting,
  method: localMethod,
  url: localUrl,
  onMethodChange: setLocalMethod,
  onUrlChange: setLocalUrl,
  onOpenLoginResponse,
}: RequestBuilderProps) {
  const selectedRequest = useSelectedRequest();
  const {
    updateRequest: updateRequestStore,
    workspace,
    authSessions,
    addAuthSession,
    updateAuthSession,
  } = useAppStore();
  const activeEnvironment = useActiveEnvironment();
  const [pathParams, setPathParams] = useState<Record<string, string>>({});

  const handleSave = async () => {
    if (!selectedRequest) return;
    const updates = {
      url: localUrl,
      method: localMethod,
    };
    await updateRequest(selectedRequest.id, updates);
    updateRequestStore(selectedRequest.id, updates);
  };

  const handleExecute = async () => {
    if (!selectedRequest) return;

    setIsExecuting(true);
    try {
      // Replace path parameters first
      let urlWithPathParams = localUrl;
      if (Object.keys(pathParams).length > 0) {
        urlWithPathParams = replacePathParams(localUrl, pathParams);
      }

      // Interpolate variables
      const interpolated = interpolateRequest(
        urlWithPathParams,
        selectedRequest.headers,
        selectedRequest.body.type !== "none"
          ? selectedRequest.body.content
          : undefined,
        activeEnvironment
      );

      // Prepare body with interpolation
      const body = { ...selectedRequest.body };
      if (body.type === "json" || body.type === "raw") {
        body.content = interpolated.body;
      }

      // Prepare headers with auth
      const headers = { ...interpolated.headers };

      // Global auth session OVERRIDES all request-specific auth settings
      // Priority: Global active session > Request-specific auth
      const globalSession = getActiveAuthSession(
        authSessions
      ) as AuthSession | null;

      if (globalSession) {
        // Global session overrides everything
        if (globalSession.tokenType === "bearer") {
          headers["Authorization"] = `Bearer ${globalSession.tokenValue}`;
        } else if (globalSession.tokenType === "cookie") {
          headers["Cookie"] = globalSession.tokenValue;
        }
      } else {
        // No global session, use request-specific auth
        if (
          selectedRequest.authType === "saved-session" &&
          selectedRequest.useAuthSession
        ) {
          const session = authSessions.find(
            (s) => s.id === selectedRequest.useAuthSession
          );
          if (session) {
            if (session.tokenType === "bearer") {
              headers["Authorization"] = `Bearer ${session.tokenValue}`;
            } else if (session.tokenType === "cookie") {
              headers["Cookie"] = session.tokenValue;
            }
          }
        } else if (
          selectedRequest.authType === "bearer" &&
          selectedRequest.authConfig.bearer
        ) {
          const token = interpolateVariables(
            selectedRequest.authConfig.bearer.token,
            activeEnvironment
          );
          headers["Authorization"] = `Bearer ${token}`;
        } else if (
          selectedRequest.authType === "basic" &&
          selectedRequest.authConfig.basic
        ) {
          const username = interpolateVariables(
            selectedRequest.authConfig.basic.username,
            activeEnvironment
          );
          const password = interpolateVariables(
            selectedRequest.authConfig.basic.password,
            activeEnvironment
          );
          const credentials = btoa(`${username}:${password}`);
          headers["Authorization"] = `Basic ${credentials}`;
        } else if (
          selectedRequest.authType === "apikey" &&
          selectedRequest.authConfig.apikey
        ) {
          const { key, value, addTo } = selectedRequest.authConfig.apikey;
          const interpolatedKey = interpolateVariables(key, activeEnvironment);
          const interpolatedValue = interpolateVariables(
            value,
            activeEnvironment
          );
          if (addTo === "header") {
            headers[interpolatedKey] = interpolatedValue;
          }
        }
      }

      const params: ExecuteRequestParams = {
        method: localMethod,
        url: interpolated.url,
        headers,
        body,
        authType: selectedRequest.authType,
        authConfig: selectedRequest.authConfig,
      };

      const response = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data: ExecuteResponse = await response.json();

      // Save to history
      let historyId: string | undefined;
      if (selectedRequest) {
        historyId = `hist_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        await db.requestHistory.add({
          id: historyId,
          requestId: selectedRequest.id,
          url: interpolated.url,
          method: localMethod,
          statusCode: data.statusCode,
          duration: data.duration,
          headers: selectedRequest.headers,
          body: body.type !== "none" ? body.content || "" : "",
          responseHeaders: data.headers,
          responseBody: data.body,
          executedAt: Date.now(),
        });
      }

      // Extract and save auth token if this is an auth request and response is successful
      if (
        selectedRequest.authExtraction?.enabled &&
        data.statusCode >= 200 &&
        data.statusCode < 300 &&
        workspace
      ) {
        const token = extractAuthToken(data, selectedRequest.authExtraction);
        if (token) {
          const sessionName =
            selectedRequest.authExtraction.sessionName ||
            selectedRequest.name ||
            "Auth Session";

          // Check if session already exists for this request
          const existingSession = await db.authSessions
            .where("requestId")
            .equals(selectedRequest.id)
            .first();

          if (existingSession) {
            // Update existing session
            await db.authSessions.update(existingSession.id, {
              tokenValue: token,
              loginResponseHistoryId: historyId,
              updatedAt: Date.now(),
            });
            updateAuthSession(existingSession.id, {
              tokenValue: token,
              loginResponseHistoryId: historyId,
              updatedAt: Date.now(),
            });
          } else {
            // Create new session
            const sessionId = await createAuthSession({
              workspaceId: workspace.id,
              name: sessionName,
              requestId: selectedRequest.id,
              tokenType: selectedRequest.authExtraction.tokenType,
              tokenValue: token,
              loginResponseHistoryId: historyId,
            });
            const newSession = await db.authSessions.get(sessionId);
            if (newSession) {
              addAuthSession(newSession);
            }
          }

          // Optionally save as environment variable
          if (
            selectedRequest.authExtraction.saveAsEnvVariable &&
            activeEnvironment
          ) {
            const envVarName = selectedRequest.authExtraction.saveAsEnvVariable;
            const existingVar = activeEnvironment.variables.find(
              (v) => v.key === envVarName
            );

            if (existingVar) {
              // Update existing variable
              const updatedVars = activeEnvironment.variables.map((v) =>
                v.id === existingVar.id ? { ...v, value: token } : v
              );
              await updateEnvironment(activeEnvironment.id, {
                variables: updatedVars,
              });
            } else {
              // Add new variable
              const newVar = {
                id: `var_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`,
                key: envVarName,
                value: token,
                isSecret: true,
              };
              await updateEnvironment(activeEnvironment.id, {
                variables: [...activeEnvironment.variables, newVar],
              });
            }
          }
        }
      }

      onExecute(data);
    } catch (error) {
      console.error("Failed to execute request:", error);
      onExecute({
        statusCode: 0,
        headers: {},
        body: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        duration: 0,
        size: 0,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!selectedRequest) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select a request or create a new one
      </div>
    );
  }

  return (
    <div className="p-4 border-b space-y-4">
      <div className="flex gap-2 items-center">
        <UrlBar
          method={localMethod}
          url={localUrl}
          onMethodChange={setLocalMethod}
          onUrlChange={setLocalUrl}
        />
        <Button onClick={handleExecute} disabled={isExecuting}>
          <Send className="h-4 w-4 mr-2" />
          {isExecuting ? "Sending..." : "Send"}
        </Button>
        {onOpenLoginResponse && (
          <AuthStatusIndicator onOpenLoginResponse={onOpenLoginResponse} />
        )}
        <Button variant="outline" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
      <PathParamsEditor url={localUrl} onParamsChange={setPathParams} />
    </div>
  );
}
