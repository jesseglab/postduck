"use client";

import type { ExecuteResponse } from "@/types";

interface ResponseTimingProps {
  response: ExecuteResponse;
}

export function ResponseTiming({ response }: ResponseTimingProps) {
  // For now, we only have total duration
  // In a real implementation, you'd capture DNS, connect, TLS, TTFB, download times
  const totalDuration = response.duration;

  return (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">Total Duration</div>
          <div className="text-2xl font-mono">{totalDuration}ms</div>
        </div>

        <div className="text-sm text-muted-foreground">
          Detailed timing breakdown will be available in future updates.
        </div>
      </div>
    </div>
  );
}
