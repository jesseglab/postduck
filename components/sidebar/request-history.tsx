"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/local";
import { Scroller } from "@/components/ui/scroller";
import type { RequestHistory } from "@/types";
import { Badge } from "@/components/ui/badge";

interface RequestHistoryProps {
  onHistoryItemClick?: (historyItem: RequestHistory) => void;
}

export function RequestHistory({ onHistoryItemClick }: RequestHistoryProps) {
  const history = useLiveQuery(
    () => db.requestHistory.orderBy("executedAt").reverse().limit(50).toArray(),
    []
  ) as RequestHistory[] | undefined;

  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No request history yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[200px]">
      <div className="text-xs font-medium text-muted-foreground mb-2 px-4 pt-2">
        History
      </div>
      <Scroller className="flex-1" hideScrollbar size={20}>
        <div className="space-y-1 px-2 pb-2">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => onHistoryItemClick?.(item)}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-sidebar-accent cursor-pointer rounded text-sm"
            >
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${
                  item.statusCode >= 200 && item.statusCode < 300
                    ? "border-green-500 text-green-500"
                    : item.statusCode >= 400
                    ? "border-red-500 text-red-500"
                    : ""
                }`}
              >
                {item.statusCode}
              </Badge>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.method}
              </span>
              <span className="flex-1 truncate text-xs">{item.url}</span>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.duration}ms
              </span>
            </div>
          ))}
        </div>
      </Scroller>
    </div>
  );
}
