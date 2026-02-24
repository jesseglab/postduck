/**
 * HTTP Status Code definitions with explanations
 */

export interface StatusCodeInfo {
  code: number;
  text: string;
  explanation: string;
  category: "success" | "redirect" | "client-error" | "server-error" | "informational";
}

/**
 * Get status code information including text and explanation
 */
export function getStatusCodeInfo(code: number): StatusCodeInfo {
  const info = STATUS_CODES[code];
  if (info) {
    return info;
  }

  // Fallback for unknown codes
  const category = getStatusCodeCategory(code);
  return {
    code,
    text: "Unknown",
    explanation: `HTTP ${code} - This status code is not commonly used or recognized.`,
    category,
  };
}

/**
 * Get the category of a status code
 */
export function getStatusCodeCategory(code: number): StatusCodeInfo["category"] {
  if (code >= 100 && code < 200) return "informational";
  if (code >= 200 && code < 300) return "success";
  if (code >= 300 && code < 400) return "redirect";
  if (code >= 400 && code < 500) return "client-error";
  if (code >= 500) return "server-error";
  return "informational";
}

/**
 * Get status text for a status code
 */
export function getStatusText(code: number): string {
  return getStatusCodeInfo(code).text;
}

/**
 * Get explanation for a status code
 */
export function getStatusExplanation(code: number): string {
  return getStatusCodeInfo(code).explanation;
}

/**
 * Comprehensive HTTP status codes database
 */
const STATUS_CODES: Record<number, StatusCodeInfo> = {
  // 1xx Informational
  100: {
    code: 100,
    text: "Continue",
    explanation: "The server has received the request headers and the client should proceed to send the request body.",
    category: "informational",
  },
  101: {
    code: 101,
    text: "Switching Protocols",
    explanation: "The server is switching protocols as requested by the client.",
    category: "informational",
  },
  102: {
    code: 102,
    text: "Processing",
    explanation: "The server has received and is processing the request, but no response is available yet.",
    category: "informational",
  },
  103: {
    code: 103,
    text: "Early Hints",
    explanation: "Used to return some response headers before final HTTP response.",
    category: "informational",
  },

  // 2xx Success
  200: {
    code: 200,
    text: "OK",
    explanation: "The request succeeded. The result meaning of 'success' depends on the HTTP method.",
    category: "success",
  },
  201: {
    code: 201,
    text: "Created",
    explanation: "The request succeeded and a new resource was created as a result.",
    category: "success",
  },
  202: {
    code: 202,
    text: "Accepted",
    explanation: "The request has been accepted for processing, but the processing has not been completed.",
    category: "success",
  },
  203: {
    code: 203,
    text: "Non-Authoritative Information",
    explanation: "The request was successful but the enclosed payload has been modified by a transforming proxy.",
    category: "success",
  },
  204: {
    code: 204,
    text: "No Content",
    explanation: "The server successfully processed the request and is not returning any content.",
    category: "success",
  },
  205: {
    code: 205,
    text: "Reset Content",
    explanation: "The server successfully processed the request, asks that the requester reset its document view.",
    category: "success",
  },
  206: {
    code: 206,
    text: "Partial Content",
    explanation: "The server is delivering only part of the resource due to a range header sent by the client.",
    category: "success",
  },
  207: {
    code: 207,
    text: "Multi-Status",
    explanation: "Conveys information about multiple resources, for situations where multiple status codes might be appropriate.",
    category: "success",
  },
  208: {
    code: 208,
    text: "Already Reported",
    explanation: "Used inside a DAV: propstat response element to avoid repeatedly enumerating the internal members of multiple bindings to the same collection.",
    category: "success",
  },
  226: {
    code: 226,
    text: "IM Used",
    explanation: "The server has fulfilled a GET request for the resource, and the response is a representation of the result of one or more instance-manipulations applied to the current instance.",
    category: "success",
  },

  // 3xx Redirection
  300: {
    code: 300,
    text: "Multiple Choices",
    explanation: "The request has more than one possible response. The user agent or user should choose one of them.",
    category: "redirect",
  },
  301: {
    code: 301,
    text: "Moved Permanently",
    explanation: "The URL of the requested resource has been changed permanently. The new URL is given in the response.",
    category: "redirect",
  },
  302: {
    code: 302,
    text: "Found",
    explanation: "The URL of the requested resource has been changed temporarily. The new URL is given in the response.",
    category: "redirect",
  },
  303: {
    code: 303,
    text: "See Other",
    explanation: "The server sent this response to direct the client to get the requested resource at another URL with a GET request.",
    category: "redirect",
  },
  304: {
    code: 304,
    text: "Not Modified",
    explanation: "Used for caching purposes. It tells the client that the response has not been modified, so the client can continue to use the same cached version of the response.",
    category: "redirect",
  },
  305: {
    code: 305,
    text: "Use Proxy",
    explanation: "Defined in a previous version of the HTTP specification to indicate that a requested response must be accessed by a proxy.",
    category: "redirect",
  },
  307: {
    code: 307,
    text: "Temporary Redirect",
    explanation: "The server sends this response to direct the client to get the requested resource at another URL with the same method that was used in the prior request.",
    category: "redirect",
  },
  308: {
    code: 308,
    text: "Permanent Redirect",
    explanation: "This means that the resource is now permanently located at another URL, specified by the Location: HTTP Response header.",
    category: "redirect",
  },

  // 4xx Client Errors
  400: {
    code: 400,
    text: "Bad Request",
    explanation: "The server cannot or will not process the request due to an apparent client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing).",
    category: "client-error",
  },
  401: {
    code: 401,
    text: "Unauthorized",
    explanation: "The client must authenticate itself to get the requested response. This status code is similar to 403, but in this case, authentication is possible.",
    category: "client-error",
  },
  402: {
    code: 402,
    text: "Payment Required",
    explanation: "Reserved for future use. The original intention was that this code might be used as part of some form of digital cash or micropayment scheme.",
    category: "client-error",
  },
  403: {
    code: 403,
    text: "Forbidden",
    explanation: "The client does not have access rights to the content; that is, it is unauthorized, so the server is refusing to give the requested resource.",
    category: "client-error",
  },
  404: {
    code: 404,
    text: "Not Found",
    explanation: "The server cannot find the requested resource. In the browser, this means the URL is not recognized. In an API, this can also mean that the endpoint is valid but the resource itself does not exist.",
    category: "client-error",
  },
  405: {
    code: 405,
    text: "Method Not Allowed",
    explanation: "The request method is known by the server but is not supported by the target resource.",
    category: "client-error",
  },
  406: {
    code: 406,
    text: "Not Acceptable",
    explanation: "The server cannot produce a response matching the list of acceptable values defined in the request's proactive content negotiation headers.",
    category: "client-error",
  },
  407: {
    code: 407,
    text: "Proxy Authentication Required",
    explanation: "This is similar to 401 Unauthorized but authentication is needed to be done by a proxy.",
    category: "client-error",
  },
  408: {
    code: 408,
    text: "Request Timeout",
    explanation: "The server would like to shut down this unused connection. It is sent on an idle connection by some servers, even without any previous request by the client.",
    category: "client-error",
  },
  409: {
    code: 409,
    text: "Conflict",
    explanation: "This response is sent when a request conflicts with the current state of the server.",
    category: "client-error",
  },
  410: {
    code: 410,
    text: "Gone",
    explanation: "This response is sent when the requested content has been permanently deleted from server, with no forwarding address.",
    category: "client-error",
  },
  411: {
    code: 411,
    text: "Length Required",
    explanation: "Server rejected the request because the Content-Length header field is not defined and the server requires it.",
    category: "client-error",
  },
  412: {
    code: 412,
    text: "Precondition Failed",
    explanation: "The client has indicated preconditions in its headers which the server does not meet.",
    category: "client-error",
  },
  413: {
    code: 413,
    text: "Payload Too Large",
    explanation: "Request entity is larger than limits defined by server. The server might close the connection or return a Retry-After header field.",
    category: "client-error",
  },
  414: {
    code: 414,
    text: "URI Too Long",
    explanation: "The URI requested by the client is longer than the server is willing to interpret.",
    category: "client-error",
  },
  415: {
    code: 415,
    text: "Unsupported Media Type",
    explanation: "The media format of the requested data is not supported by the server, so the server is rejecting the request.",
    category: "client-error",
  },
  416: {
    code: 416,
    text: "Range Not Satisfiable",
    explanation: "The range specified by the Range header field in the request cannot be fulfilled. It's possible that the range is outside the size of the target URI's data.",
    category: "client-error",
  },
  417: {
    code: 417,
    text: "Expectation Failed",
    explanation: "This response code means the expectation indicated by the Expect request header field cannot be met by the server.",
    category: "client-error",
  },
  418: {
    code: 418,
    text: "I'm a teapot",
    explanation: "The server refuses the attempt to brew coffee with a teapot. This is a reference to the Hyper Text Coffee Pot Control Protocol.",
    category: "client-error",
  },
  421: {
    code: 421,
    text: "Misdirected Request",
    explanation: "The request was directed at a server that is not able to produce a response. This can be sent by a server that is not configured to produce responses for the combination of scheme and authority that are included in the request URI.",
    category: "client-error",
  },
  422: {
    code: 422,
    text: "Unprocessable Entity",
    explanation: "The request was well-formed but was unable to be followed due to semantic errors.",
    category: "client-error",
  },
  423: {
    code: 423,
    text: "Locked",
    explanation: "The resource that is being accessed is locked.",
    category: "client-error",
  },
  424: {
    code: 424,
    text: "Failed Dependency",
    explanation: "The request failed because it depended on another request and that request failed.",
    category: "client-error",
  },
  425: {
    code: 425,
    text: "Too Early",
    explanation: "Indicates that the server is unwilling to risk processing a request that might be replayed.",
    category: "client-error",
  },
  426: {
    code: 426,
    text: "Upgrade Required",
    explanation: "The server refuses to perform the request using the current protocol but might be willing to do so after the client upgrades to a different protocol.",
    category: "client-error",
  },
  428: {
    code: 428,
    text: "Precondition Required",
    explanation: "The origin server requires the request to be conditional.",
    category: "client-error",
  },
  429: {
    code: 429,
    text: "Too Many Requests",
    explanation: "The user has sent too many requests in a given amount of time ('rate limiting').",
    category: "client-error",
  },
  431: {
    code: 431,
    text: "Request Header Fields Too Large",
    explanation: "The server is unwilling to process the request because its header fields are too large.",
    category: "client-error",
  },
  451: {
    code: 451,
    text: "Unavailable For Legal Reasons",
    explanation: "The user agent requested a resource that cannot legally be provided, such as a web page censored by a government.",
    category: "client-error",
  },

  // 5xx Server Errors
  500: {
    code: 500,
    text: "Internal Server Error",
    explanation: "The server has encountered a situation it doesn't know how to handle.",
    category: "server-error",
  },
  501: {
    code: 501,
    text: "Not Implemented",
    explanation: "The request method is not supported by the server and cannot be handled.",
    category: "server-error",
  },
  502: {
    code: 502,
    text: "Bad Gateway",
    explanation: "The server, while acting as a gateway or proxy, received an invalid response from an upstream server.",
    category: "server-error",
  },
  503: {
    code: 503,
    text: "Service Unavailable",
    explanation: "The server is not ready to handle the request. Common causes are a server that is down for maintenance or that is overloaded.",
    category: "server-error",
  },
  504: {
    code: 504,
    text: "Gateway Timeout",
    explanation: "The server, while acting as a gateway or proxy, did not get a response in time from the upstream server that it needed in order to complete the request.",
    category: "server-error",
  },
  505: {
    code: 505,
    text: "HTTP Version Not Supported",
    explanation: "The HTTP version used in the request is not supported by the server.",
    category: "server-error",
  },
  506: {
    code: 506,
    text: "Variant Also Negotiates",
    explanation: "The server has an internal configuration error: the chosen variant resource is configured to engage in transparent content negotiation itself.",
    category: "server-error",
  },
  507: {
    code: 507,
    text: "Insufficient Storage",
    explanation: "The method could not be performed on the resource because the server is unable to store the representation needed to successfully complete the request.",
    category: "server-error",
  },
  508: {
    code: 508,
    text: "Loop Detected",
    explanation: "The server detected an infinite loop while processing the request.",
    category: "server-error",
  },
  510: {
    code: 510,
    text: "Not Extended",
    explanation: "Further extensions to the request are required for the server to fulfill it.",
    category: "server-error",
  },
  511: {
    code: 511,
    text: "Network Authentication Required",
    explanation: "The client needs to authenticate to gain network access.",
    category: "server-error",
  },
};
