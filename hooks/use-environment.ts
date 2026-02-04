import { useMemo } from "react";
import { useAppStore } from "@/lib/store";
import type { Environment } from "@/types";

export function useActiveEnvironment(): Environment | null {
  const { environments, activeEnvironmentId } = useAppStore();

  return useMemo(() => {
    if (!activeEnvironmentId) {
      // Return first active environment or first environment
      return environments.find((e) => e.isActive) || environments[0] || null;
    }
    return environments.find((e) => e.id === activeEnvironmentId) || null;
  }, [environments, activeEnvironmentId]);
}
