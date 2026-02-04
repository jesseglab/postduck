"use client";

import { useState, useEffect } from "react";
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
import type { AuthExtractionConfig } from "@/types";

export function AuthExtractionConfig() {
  const selectedRequest = useSelectedRequest();
  const { updateRequest: updateRequestStore } = useAppStore();
  const [config, setConfig] = useState<AuthExtractionConfig>({
    enabled: false,
    tokenType: "bearer",
    extractFrom: "body",
    path: "",
    sessionName: "",
  });

  useEffect(() => {
    if (selectedRequest?.authExtraction) {
      setConfig(selectedRequest.authExtraction);
    } else {
      setConfig({
        enabled: false,
        tokenType: "bearer",
        extractFrom: "body",
        path: "",
        sessionName: "",
      });
    }
  }, [selectedRequest]);

  const handleConfigChange = async (updates: Partial<AuthExtractionConfig>) => {
    if (!selectedRequest) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    await updateRequest(selectedRequest.id, { authExtraction: newConfig });
    updateRequestStore(selectedRequest.id, { authExtraction: newConfig });
  };

  if (!selectedRequest) return null;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="auth-extraction-enabled"
          checked={config.enabled}
          onChange={(e) => handleConfigChange({ enabled: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label
          htmlFor="auth-extraction-enabled"
          className="text-sm font-medium cursor-pointer"
        >
          Mark as Auth Request
        </label>
      </div>

      {config.enabled && (
        <>
          <div>
            <label className="text-sm font-medium mb-2 block">Token Type</label>
            <Select
              value={config.tokenType}
              onValueChange={(value: "bearer" | "cookie") =>
                handleConfigChange({ tokenType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bearer">Bearer Token</SelectItem>
                <SelectItem value="cookie">Cookie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Extract From
            </label>
            <Select
              value={config.extractFrom}
              onValueChange={(value: "body" | "header" | "cookie") =>
                handleConfigChange({ extractFrom: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="body">Response Body (JSON)</SelectItem>
                <SelectItem value="header">Response Header</SelectItem>
                <SelectItem value="cookie">Cookie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.extractFrom === "body" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                JSON Path
              </label>
              <Input
                placeholder='e.g., "token", "data.access_token", "result.jwt"'
                value={config.path || ""}
                onChange={(e) => handleConfigChange({ path: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use dot notation to access nested properties
              </p>
            </div>
          )}

          {config.extractFrom === "header" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Header Name
              </label>
              <Input
                placeholder='e.g., "Authorization", "X-Auth-Token"'
                value={config.path || ""}
                onChange={(e) => handleConfigChange({ path: e.target.value })}
              />
            </div>
          )}

          {config.extractFrom === "cookie" && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cookie Name
              </label>
              <Input
                placeholder='e.g., "sessionId", "auth_token"'
                value={config.cookieName || ""}
                onChange={(e) =>
                  handleConfigChange({ cookieName: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">
              Session Name
            </label>
            <Input
              placeholder='e.g., "API Login", "User Session"'
              value={config.sessionName || ""}
              onChange={(e) =>
                handleConfigChange({ sessionName: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1">
              A friendly name to identify this auth session
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="save-as-env"
              checked={!!config.saveAsEnvVariable}
              onChange={(e) =>
                handleConfigChange({
                  saveAsEnvVariable: e.target.checked
                    ? "auth_token"
                    : undefined,
                })
              }
              className="h-4 w-4 rounded border-gray-300"
            />
            <label
              htmlFor="save-as-env"
              className="text-sm font-medium cursor-pointer"
            >
              Also save as environment variable
            </label>
          </div>

          {config.saveAsEnvVariable && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Variable Name
              </label>
              <Input
                placeholder="e.g., auth_token"
                value={config.saveAsEnvVariable || ""}
                onChange={(e) =>
                  handleConfigChange({ saveAsEnvVariable: e.target.value })
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
