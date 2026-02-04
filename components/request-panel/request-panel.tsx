"use client";

import { useState, useEffect } from "react";
import { RequestBuilder } from "./request-builder";
import { useSelectedRequest } from "@/hooks/use-request";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HeadersEditor } from "./headers-editor";
import { BodyEditor } from "./body-editor";
import { AuthConfig } from "./auth-config";
import { AuthExtractionConfig } from "./auth-extraction-config";
import { CurlPreview } from "./curl-preview";
import { useCanEdit, useCanExecute } from "@/hooks/use-team";
import { useAppStore } from "@/lib/store";
import type { ExecuteResponse, HttpMethod } from "@/types";
import { motion } from "framer-motion";

interface RequestPanelProps {
  onExecute: (response: ExecuteResponse) => void;
  isExecuting: boolean;
  setIsExecuting: (value: boolean) => void;
  onOpenLoginResponse?: (response: ExecuteResponse) => void;
  isResponseExpanded?: boolean;
  onCollapseResponse?: () => void;
}

export function RequestPanel({
  onExecute,
  isExecuting,
  setIsExecuting,
  onOpenLoginResponse,
  isResponseExpanded = false,
  onCollapseResponse,
}: RequestPanelProps) {
  const selectedRequest = useSelectedRequest();
  const { workspace } = useAppStore();
  const [localUrl, setLocalUrl] = useState("");
  const [localMethod, setLocalMethod] = useState<HttpMethod>("GET");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setCurrentUserId(data.id);
        }
      })
      .catch(() => {});

    if (workspace && (workspace as any).teamId) {
      setTeamId((workspace as any).teamId);
    } else {
      setTeamId(null);
    }
  }, [workspace]);

  const canEdit = useCanEdit(teamId, currentUserId);
  const canExecuteRequest = useCanExecute(teamId, currentUserId);
  const isReadOnly = teamId !== null && !canEdit;

  useEffect(() => {
    if (selectedRequest) {
      setLocalUrl(selectedRequest.url);
      setLocalMethod(selectedRequest.method);
    }
  }, [selectedRequest]);

  return (
    <motion.div
      className="flex-1 flex flex-col overflow-hidden border-b"
      animate={{
        opacity: isResponseExpanded ? 0.5 : 1,
        pointerEvents: isResponseExpanded ? "none" : "auto",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      onClick={() => {
        if (isResponseExpanded && onCollapseResponse) {
          onCollapseResponse();
        }
      }}
    >
      <RequestBuilder
        onExecute={onExecute}
        isExecuting={isExecuting}
        setIsExecuting={setIsExecuting}
        method={localMethod}
        url={localUrl}
        onMethodChange={setLocalMethod}
        onUrlChange={setLocalUrl}
        onOpenLoginResponse={onOpenLoginResponse}
        readOnly={isReadOnly}
        canExecute={canExecuteRequest}
      />

      {selectedRequest && (
        <div className="flex-1 flex overflow-hidden">
          {/* Section 1: Headers and Auth */}
          <div className="flex-1 flex flex-col overflow-hidden border-r">
            <Tabs
              defaultValue="headers"
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="mx-4 mt-2">
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="auth">Auth</TabsTrigger>
                <TabsTrigger value="auth-extraction">
                  Auth Extraction
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="headers"
                className="flex-1 overflow-hidden m-0"
              >
                <HeadersEditor readOnly={isReadOnly} />
              </TabsContent>

              <TabsContent value="auth" className="flex-1 overflow-hidden m-0">
                <AuthConfig readOnly={isReadOnly} />
              </TabsContent>

              <TabsContent
                value="auth-extraction"
                className="flex-1 overflow-hidden m-0"
              >
                <AuthExtractionConfig readOnly={isReadOnly} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Section 2: Body */}
          <div className="flex-[2] flex flex-col overflow-hidden border-r">
            <div className="px-4 py-2 border-b">
              <h3 className="text-sm font-medium">Body</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <BodyEditor />
            </div>
          </div>

          {/* Section 3: Raw Format (cURL) */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <CurlPreview method={localMethod} url={localUrl} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
