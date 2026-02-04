"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExecuteResponse } from "@/types";

interface ResponseHeadersProps {
  response: ExecuteResponse;
}

export function ResponseHeaders({ response }: ResponseHeadersProps) {
  return (
    <div className="flex flex-col h-full p-4 min-h-0">
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-1 pr-4">
          {Object.entries(response.headers).map(([key, value]) => (
            <div key={key} className="flex gap-4 py-2 border-b">
              <div className="font-mono text-sm font-medium w-48">{key}</div>
              <div className="font-mono text-sm flex-1 break-all">{value}</div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {response.cookies && response.cookies.length > 0 && (
        <div className="mt-4 pt-4 border-t shrink-0">
          <h3 className="font-medium mb-2">Cookies</h3>
          <ScrollArea className="max-h-32">
            <div className="space-y-1 pr-4">
              {response.cookies.map((cookie, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{cookie.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    = {cookie.value}
                  </span>
                  {cookie.domain && (
                    <span className="text-muted-foreground text-xs ml-2">
                      (Domain: {cookie.domain})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
