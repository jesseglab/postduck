import type {
  HttpMethod,
  RequestBody,
  RequestHeaders,
  AuthType,
  AuthConfig,
} from "@/types";

// Postman v2.1.0 Collection Schema Types
interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
}

interface PostmanUrl {
  raw?: string;
  protocol?: string;
  host?: string[] | string;
  path?: string[];
  query?: Array<{ key: string; value: string; disabled?: boolean }>;
}

interface PostmanBody {
  mode?: "raw" | "urlencoded" | "formdata" | "file" | "graphql";
  raw?: string;
  urlencoded?: Array<{ key: string; value: string; disabled?: boolean }>;
  formdata?: Array<{
    key: string;
    value?: string;
    type?: string;
    disabled?: boolean;
  }>;
  options?: {
    raw?: {
      language?: string;
    };
  };
}

interface PostmanAuth {
  type?: "bearer" | "basic" | "apikey" | "noauth";
  bearer?: Array<{ key: string; value: string; type?: string }>;
  basic?: Array<{ key: string; value: string; type?: string }>;
  apikey?: Array<{ key: string; value: string; type?: string }>;
}

interface PostmanRequest {
  method?: string;
  header?: PostmanHeader[];
  body?: PostmanBody;
  url?: PostmanUrl | string;
  auth?: PostmanAuth;
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[];
  auth?: PostmanAuth;
}

interface PostmanCollection {
  info: {
    name: string;
    schema?: string;
  };
  item: PostmanItem[];
  auth?: PostmanAuth;
}

export interface ParsedCollection {
  name: string;
  collections: Array<{
    id: string; // Temporary ID for mapping
    name: string;
    parentId: string | null;
    order: number;
  }>;
  requests: Array<{
    name: string;
    collectionId: string; // References collection.id
    method: HttpMethod;
    url: string;
    headers: RequestHeaders;
    body: RequestBody;
    authType: AuthType;
    authConfig: AuthConfig;
    order: number;
  }>;
}

/**
 * Convert Postman header array to key-value object
 */
function parseHeaders(headers?: PostmanHeader[]): RequestHeaders {
  if (!headers) return {};
  const result: RequestHeaders = {};
  headers.forEach((header) => {
    if (!header.disabled && header.key) {
      result[header.key] = header.value || "";
    }
  });
  return result;
}

/**
 * Parse Postman URL object or string to URL string
 */
function parseUrl(url?: PostmanUrl | string): string {
  if (!url) return "";
  if (typeof url === "string") return url;
  if (url.raw) return url.raw;

  // Build URL from parts
  const protocol = url.protocol || "https";
  const host = Array.isArray(url.host) ? url.host.join(".") : url.host || "";
  const path = url.path ? `/${url.path.join("/")}` : "";
  const query = url.query
    ?.filter((q) => !q.disabled && q.key)
    .map((q) => `${q.key}=${encodeURIComponent(q.value || "")}`)
    .join("&");
  const queryString = query ? `?${query}` : "";

  return `${protocol}://${host}${path}${queryString}`;
}

/**
 * Parse Postman body to RequestBody
 */
function parseBody(body?: PostmanBody): RequestBody {
  if (!body || !body.mode || body.mode === "file" || body.mode === "graphql") {
    return { type: "none" };
  }

  if (body.mode === "raw") {
    const content = body.raw || "";
    // Try to detect JSON
    const isJson =
      body.options?.raw?.language === "json" ||
      content.trim().startsWith("{") ||
      content.trim().startsWith("[");
    return {
      type: isJson ? "json" : "raw",
      content,
    };
  }

  if (body.mode === "formdata" && body.formdata) {
    return {
      type: "form-data",
      formData: body.formdata
        .filter((item) => !item.disabled && item.key)
        .map((item) => ({
          key: item.key,
          value: item.value || "",
          enabled: true,
        })),
    };
  }

  if (body.mode === "urlencoded" && body.urlencoded) {
    // Convert urlencoded to form-data format
    return {
      type: "form-data",
      formData: body.urlencoded
        .filter((item) => !item.disabled && item.key)
        .map((item) => ({
          key: item.key,
          value: item.value || "",
          enabled: true,
        })),
    };
  }

  return { type: "none" };
}

/**
 * Parse Postman auth to AuthType and AuthConfig
 */
function parseAuth(auth?: PostmanAuth): {
  authType: AuthType;
  authConfig: AuthConfig;
} {
  if (!auth || auth.type === "noauth" || !auth.type) {
    return { authType: "none", authConfig: {} };
  }

  if (auth.type === "bearer" && auth.bearer) {
    const tokenItem = auth.bearer.find((item) => item.key === "token");
    return {
      authType: "bearer",
      authConfig: {
        bearer: {
          token: tokenItem?.value || "",
        },
      },
    };
  }

  if (auth.type === "basic" && auth.basic) {
    const usernameItem = auth.basic.find((item) => item.key === "username");
    const passwordItem = auth.basic.find((item) => item.key === "password");
    return {
      authType: "basic",
      authConfig: {
        basic: {
          username: usernameItem?.value || "",
          password: passwordItem?.value || "",
        },
      },
    };
  }

  if (auth.type === "apikey" && auth.apikey) {
    const keyItem = auth.apikey.find((item) => item.key === "key");
    const valueItem = auth.apikey.find((item) => item.key === "value");
    const inItem = auth.apikey.find((item) => item.key === "in");
    const addTo = inItem?.value === "header" ? "header" : "query";
    return {
      authType: "apikey",
      authConfig: {
        apikey: {
          key: keyItem?.value || "",
          value: valueItem?.value || "",
          addTo,
        },
      },
    };
  }

  return { authType: "none", authConfig: {} };
}

/**
 * Normalize HTTP method string to HttpMethod type
 */
function normalizeMethod(method?: string): HttpMethod {
  const upperMethod = (method || "GET").toUpperCase();
  const validMethods: HttpMethod[] = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];
  return validMethods.includes(upperMethod as HttpMethod)
    ? (upperMethod as HttpMethod)
    : "GET";
}

/**
 * Parse a Postman collection JSON and return structured data
 */
export function parsePostmanCollection(json: string): ParsedCollection {
  let collection: PostmanCollection;
  try {
    collection = JSON.parse(json);
  } catch (error) {
    throw new Error("Invalid JSON format");
  }

  if (!collection.info || !collection.item) {
    throw new Error("Invalid Postman collection format");
  }

  const result: ParsedCollection = {
    name: collection.info.name || "Imported Collection",
    collections: [],
    requests: [],
  };

  // Track collection IDs as we create them
  const collectionIdMap = new Map<string, string>();
  let collectionCounter = 0;
  let requestCounter = 0;

  // Collection-level auth (inherited by requests without their own auth)
  const collectionAuth = collection.auth;

  /**
   * Recursively process items (folders and requests)
   */
  function processItems(
    items: PostmanItem[],
    parentId: string | null,
    order: number
  ): number {
    let currentOrder = order;

    for (const item of items) {
      if (item.item) {
        // This is a folder (collection)
        const collectionId = `col_${collectionCounter++}`;
        collectionIdMap.set(item.name, collectionId);
        result.collections.push({
          id: collectionId,
          name: item.name,
          parentId,
          order: currentOrder++,
        });

        // Process nested items
        currentOrder = processItems(item.item, collectionId, 0);
      } else if (item.request) {
        // This is a request
        const request = item.request;
        const auth = request.auth || item.auth || collectionAuth;
        const { authType, authConfig } = parseAuth(auth);

        // Determine which collection this request belongs to
        const collectionId = parentId || "root";

        result.requests.push({
          name: item.name,
          collectionId,
          method: normalizeMethod(request.method),
          url: parseUrl(request.url),
          headers: parseHeaders(request.header),
          body: parseBody(request.body),
          authType,
          authConfig,
          order: requestCounter++,
        });
      }
    }

    return currentOrder;
  }

  // Process root-level items
  processItems(collection.item, null, 0);

  return result;
}
