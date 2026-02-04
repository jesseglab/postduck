"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseBody } from "@/components/response-panel/response-body";
import { ResponseHeaders } from "@/components/response-panel/response-headers";
import { ResponseTiming } from "@/components/response-panel/response-timing";
import { Badge } from "@/components/ui/badge";
import type { ExecuteResponse } from "@/types";

interface LoginResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: ExecuteResponse | null;
  sessionName?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function LoginResponseDialog({
  open,
  onOpenChange,
  response,
  sessionName,
}: LoginResponseDialogProps) {
  if (!response) return null;

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-yellow-500";
    if (status >= 400) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[95vw] min-w-[95vw] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <span>Login Response</span>
            {sessionName && (
              <span className="text-sm font-normal text-muted-foreground">
                ({sessionName})
              </span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-4 mt-2">
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
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs
            defaultValue="body"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="mx-6 mt-4 shrink-0">
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="headers">Headers</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
            </TabsList>

            <TabsContent
              value="body"
              className="flex-1 overflow-hidden m-0 mt-4 min-h-0"
            >
              <ResponseBody response={response} />
            </TabsContent>

            <TabsContent
              value="headers"
              className="flex-1 overflow-hidden m-0 mt-4 min-h-0"
            >
              <ResponseHeaders response={response} />
            </TabsContent>

            <TabsContent
              value="timing"
              className="flex-1 overflow-hidden m-0 mt-4 min-h-0"
            >
              <ResponseTiming response={response} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
