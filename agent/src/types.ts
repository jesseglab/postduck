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
