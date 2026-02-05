import type { ExecuteRequestParams } from "@/types";

const AGENT_URL = "http://localhost:19199";

export async function checkAgentStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(`${AGENT_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    return false;
  }
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export async function proxyViaAgent(
  params: ExecuteRequestParams
): Promise<Response> {
  return fetch(`${AGENT_URL}/proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
