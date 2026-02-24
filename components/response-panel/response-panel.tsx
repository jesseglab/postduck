"use client";

import { useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseBody } from "./response-body";
import { ResponseHeaders } from "./response-headers";
import { ResponseTiming } from "./response-timing";
import { ResponseCurlPreview } from "./response-curl-preview";
import type { ExecuteResponse } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Loader2, Copy, Bug } from "lucide-react";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusCodeInfo, getStatusText } from "@/lib/http-status-codes";
import { useSelectedRequest } from "@/hooks/use-request";
import { useAppStore } from "@/lib/store";
import { useActiveEnvironment } from "@/hooks/use-environment";
import { generateCurlCode } from "@/components/request-panel/code-generators";

interface ResponsePanelProps {
  response: ExecuteResponse | null;
  isExecuting?: boolean;
  isExpanded?: boolean;
  onExpand?: () => void;
  onCollapse?: () => void;
}

export function ResponsePanel({
  response,
  isExecuting = false,
  isExpanded = false,
  onExpand,
  onCollapse,
}: ResponsePanelProps) {
  const selectedRequest = useSelectedRequest();
  const { authSessions } = useAppStore();
  const activeEnvironment = useActiveEnvironment();

  // Debug logging
  useEffect(() => {
    console.log("ResponsePanel received:", {
      hasResponse: !!response,
      statusCode: response?.statusCode,
      bodyType: typeof response?.body,
      bodyLength: response?.body?.length ?? 0,
      bodyPreview: response?.body?.substring?.(0, 50),
    });
  }, [response]);

  // Generate curl command for debug copy
  const curlCommand = useMemo(() => {
    if (!selectedRequest || !response) return "";
    
    try {
      return generateCurlCode({
        request: selectedRequest,
        method: selectedRequest.method,
        url: selectedRequest.url,
        authSessions,
        environment: activeEnvironment,
      });
    } catch (error) {
      console.error("Failed to generate curl command:", error);
      return "";
    }
  }, [selectedRequest, authSessions, activeEnvironment, response]);

  // Format response output for debug copy
  const responseOutput = useMemo(() => {
    if (!response) return "";

    const lines: string[] = [];

    // Status line
    lines.push(
      `HTTP/1.1 ${response.statusCode} ${getStatusText(response.statusCode)}`
    );
    lines.push("");

    // Headers (sorted for consistency)
    const sortedHeaders = Object.entries(response.headers || {}).sort(([a], [b]) =>
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    sortedHeaders.forEach(([key, value]) => {
      if (key && value) {
        lines.push(`${key}: ${value}`);
      }
    });

    // Cookies if present
    if (response.cookies && response.cookies.length > 0) {
      const cookieValues = response.cookies
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");
      lines.push(`Set-Cookie: ${cookieValues}`);
    }

    // Empty line before body
    lines.push("");

    // Body
    const responseBody = response.body ?? "";
    if (responseBody) {
      // Try to format JSON if applicable
      const contentType =
        response.headers?.["content-type"] ||
        response.headers?.["Content-Type"] ||
        "";
      if (contentType.includes("application/json")) {
        try {
          const parsed = JSON.parse(responseBody);
          const formatted = JSON.stringify(parsed, null, 2);
          lines.push(formatted);
        } catch (e) {
          lines.push(responseBody);
        }
      } else {
        lines.push(responseBody);
      }
    } else {
      lines.push("(empty body)");
    }

    return lines.join("\n");
  }, [response]);

  // Handle copy debug info
  const handleCopyDebug = async () => {
    if (!responseOutput) return;

    let debugContent: string;
    if (curlCommand) {
      debugContent = `Request:
${curlCommand}
gives me this error:
${responseOutput}`;
    } else {
      // Fallback: just copy the response if no curl command available
      debugContent = `Response:
${responseOutput}`;
    }

    try {
      await navigator.clipboard.writeText(debugContent);
      // You could add a toast notification here if you have one
    } catch (error) {
      console.error("Failed to copy debug info:", error);
    }
  };

  if (!response && !isExecuting) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground border-t">
        No response yet. Send a request to see the response here.
      </div>
    );
  }

  // Show loader when executing
  if (isExecuting) {
    return (
      <div className="flex-1 flex flex-col border-t overflow-hidden relative">
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              Loading response...
            </span>
          </div>
        </div>
        {response && (
          <div className="opacity-30 pointer-events-none">
            {/* Show previous response dimmed while loading */}
            <div className="px-4 py-2 border-b flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <StatusCodeBadge statusCode={response.statusCode} />
                <span className="text-sm text-muted-foreground">
                  {response.duration}ms
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatSize(response.size)}
                </span>
              </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="flex-[2] flex flex-col overflow-hidden">
                <Tabs
                  defaultValue="body"
                  className="flex-1 flex flex-col overflow-hidden"
                >
                  <TabsList className="mx-4 mt-2">
                    <TabsTrigger value="body">Body</TabsTrigger>
                    <TabsTrigger value="headers">Headers</TabsTrigger>
                    <TabsTrigger value="timing">Timing</TabsTrigger>
                  </TabsList>
                  <TabsContent
                    value="body"
                    className="flex-1 overflow-hidden m-0"
                  >
                    <ResponseBody response={response} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-yellow-500";
    if (status >= 400) return "bg-red-500";
    return "bg-gray-500";
  };

  // TypeScript doesn't narrow after the early returns above
  if (!response) return null;

  return (
    <motion.div
      layout
      className={`flex flex-col border-t overflow-hidden ${
        isExpanded
          ? "absolute left-0 right-0 z-50 bg-background shadow-lg"
          : "flex-1 relative"
      }`}
      initial={false}
      animate={
        isExpanded
          ? {
              top: "20vh",
              height: "80vh",
            }
          : {
              top: undefined,
              height: undefined,
            }
      }
      transition={{
        layout: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
        default: {
          type: "spring",
          stiffness: 300,
          damping: 30,
        },
      }}
      style={{
        ...(isExpanded && {
          position: "absolute",
        }),
      }}
    >
      <div
        className="px-4 py-2 border-b flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => {
          if (isExpanded && onCollapse) {
            onCollapse();
          } else if (!isExpanded && onExpand) {
            onExpand();
          }
        }}
      >
        <div className="flex items-center gap-2 flex-1">
          <StatusCodeBadge statusCode={response.statusCode} />
          <span className="text-sm text-muted-foreground">
            {response.duration}ms
          </span>
          <span className="text-sm text-muted-foreground">
            {formatSize(response.size)}
          </span>
          {responseOutput && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyDebug();
                    }}
                    disabled={!curlCommand}
                  >
                    <Bug className="h-3.5 w-3.5 mr-1.5" />
                    Copy Debug
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {curlCommand
                    ? "Copy request and response for debugging"
                    : "Select a request to enable debug copy"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-[2] flex flex-col overflow-hidden">
          <Tabs
            defaultValue="body"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
            </TabsList>

            <TabsContent value="body" className="flex-1 overflow-hidden m-0">
              <ResponseBody response={response} />
            </TabsContent>

            <TabsContent value="headers" className="flex-1 overflow-hidden m-0">
              <ResponseHeaders response={response} />
            </TabsContent>

            <TabsContent value="timing" className="flex-1 overflow-hidden m-0">
              <ResponseTiming response={response} />
            </TabsContent>
          </Tabs>
        </div>
        {response && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <ResponseCurlPreview response={response} />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface StatusCodeBadgeProps {
  statusCode: number;
}

function StatusCodeBadge({ statusCode }: StatusCodeBadgeProps) {
  const statusInfo = getStatusCodeInfo(statusCode);
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-yellow-500";
    if (status >= 400) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Badge className={getStatusColor(statusCode)}>
              {statusCode}
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">
              {statusInfo.text}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="max-w-xs px-3 py-2 text-sm"
          sideOffset={8}
        >
          <div className="font-semibold mb-1">
            {statusCode} {statusInfo.text}
          </div>
          <div className="text-muted-foreground">{statusInfo.explanation}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
