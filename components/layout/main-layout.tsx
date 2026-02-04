"use client";

import { Sidebar } from "@/components/sidebar/sidebar";
import { RequestPanel } from "@/components/request-panel/request-panel";
import { ResponsePanel } from "@/components/response-panel/response-panel";
import { useState } from "react";
import type { ExecuteResponse, RequestHistory } from "@/types";
import { useAppStore } from "@/lib/store";
import { db } from "@/lib/db/local";

export function MainLayout() {
  const [response, setResponse] = useState<ExecuteResponse | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isResponseExpanded, setIsResponseExpanded] = useState(false);
  const { setSelectedRequest, requests } = useAppStore();

  const handleHistoryItemClick = async (historyItem: RequestHistory) => {
    // Convert history item to ExecuteResponse format
    const executeResponse: ExecuteResponse = {
      statusCode: historyItem.statusCode,
      headers: historyItem.responseHeaders,
      body: historyItem.responseBody,
      duration: historyItem.duration,
      size: new Blob([historyItem.responseBody]).size,
    };

    // Restore the original request if it exists
    const originalRequest = requests.find(
      (r) => r.id === historyItem.requestId
    );
    if (originalRequest) {
      setSelectedRequest(originalRequest.id);
    } else {
      // Try to load from database in case it's not in the store
      const requestFromDb = await db.requests.get(historyItem.requestId);
      if (requestFromDb) {
        setSelectedRequest(requestFromDb.id);
      }
    }

    // Set the response and expand the panel
    setResponse(executeResponse);
    setIsResponseExpanded(true);
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      <Sidebar onHistoryItemClick={handleHistoryItemClick} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Clickable overlay for top 20% when response is expanded */}
        {isResponseExpanded && (
          <div
            className="absolute top-0 left-0 right-0 h-[20%] z-40 cursor-pointer"
            onClick={() => setIsResponseExpanded(false)}
            aria-label="Collapse response panel"
          />
        )}
        <RequestPanel
          onExecute={(response) => {
            setResponse(response);
            // Auto-expand response panel when request completes
            setIsResponseExpanded(true);
          }}
          isExecuting={isExecuting}
          setIsExecuting={setIsExecuting}
          onOpenLoginResponse={(response) => setResponse(response)}
          isResponseExpanded={isResponseExpanded}
          onCollapseResponse={() => setIsResponseExpanded(false)}
        />
        <ResponsePanel
          response={response}
          isExecuting={isExecuting}
          isExpanded={isResponseExpanded}
          onExpand={() => setIsResponseExpanded(true)}
          onCollapse={() => setIsResponseExpanded(false)}
        />
      </div>
    </div>
  );
}
