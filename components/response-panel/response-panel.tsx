"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseBody } from "./response-body";
import { ResponseHeaders } from "./response-headers";
import { ResponseTiming } from "./response-timing";
import { ResponseCurlPreview } from "./response-curl-preview";
import type { ExecuteResponse } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
                <Badge className="bg-gray-500">{response.statusCode}</Badge>
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
          <Badge className={getStatusColor(response.statusCode)}>
            {response.statusCode}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {response.duration}ms
          </span>
          <span className="text-sm text-muted-foreground">
            {formatSize(response.size)}
          </span>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResponseCurlPreview response={response} />
        </div>
      </div>
    </motion.div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
