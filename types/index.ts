export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type AuthType = "none" | "bearer" | "basic" | "apikey" | "saved-session";

export interface AuthConfig {
  bearer?: {
    token: string;
  };
  basic?: {
    username: string;
    password: string;
  };
  apikey?: {
    key: string;
    value: string;
    addTo: "header" | "query";
  };
}

export interface RequestHeaders {
  [key: string]: string;
}

export interface RequestBody {
  type: "json" | "form-data" | "raw" | "none";
  content?: string;
  formData?: Array<{ key: string; value: string; enabled: boolean }>;
}

export interface Request {
  id: string;
  collectionId: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: RequestHeaders;
  body: RequestBody;
  authType: AuthType;
  authConfig: AuthConfig;
  authExtraction?: AuthExtractionConfig;
  useAuthSession?: string | null;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Environment {
  id: string;
  workspaceId: string;
  name: string;
  isActive: boolean;
  variables: EnvironmentVariable[];
  createdAt: number;
  updatedAt: number;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  isLocal: boolean;
  syncedAt?: number;
}

export interface RequestHistory {
  id: string;
  requestId: string;
  url: string;
  method: HttpMethod;
  statusCode: number;
  duration: number;
  headers: Record<string, string>;
  body: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  executedAt: number;
}

export interface ExecuteRequestParams {
  method: HttpMethod;
  url: string;
  headers: RequestHeaders;
  body?: RequestBody;
  authType: AuthType;
  authConfig: AuthConfig;
}

export interface ExecuteResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  duration: number;
  size: number;
  cookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: string;
  }>;
}

// Auth session stored after successful auth request
export interface AuthSession {
  id: string;
  workspaceId: string;
  name: string;
  requestId: string;
  tokenType: "bearer" | "cookie";
  tokenValue: string;
  expiresAt?: number;
  loginResponseHistoryId?: string; // ID of the request history entry that logged the user in
  createdAt: number;
  updatedAt: number;
}

// Config for extracting auth from response
export interface AuthExtractionConfig {
  enabled: boolean;
  tokenType: "bearer" | "cookie";
  extractFrom: "body" | "header" | "cookie";
  path?: string;
  cookieName?: string;
  sessionName?: string;
  saveAsEnvVariable?: string;
}
