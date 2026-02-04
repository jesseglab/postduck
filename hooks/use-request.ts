import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { Request } from "@/types";

export function useSelectedRequest(): Request | null {
  const { requests, selectedRequestId } = useAppStore();

  return useMemo(() => {
    if (!selectedRequestId) return null;
    return requests.find((r) => r.id === selectedRequestId) || null;
  }, [requests, selectedRequestId]);
}
