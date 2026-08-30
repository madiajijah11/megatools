"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

interface StatusCode {
  code: number;
  phrase: string;
  category: "1xx" | "2xx" | "3xx" | "4xx" | "5xx";
  summary: string;
  detail: string;
  rfc: string;
  commonCause?: string;
}

interface HttpHeader {
  name: string;
  type: "Request" | "Response" | "Both";
  summary: string;
  example: string;
  rfc: string;
}

const STATUS_CODES: StatusCode[] = [
  // 1xx
  { code: 100, phrase: "Continue", category: "1xx", summary: "Server received request headers and client should proceed to send the body.", detail: "Sent in response to an Expect: 100-continue request header.", rfc: "RFC 9110, 15.2.1" },
  { code: 101, phrase: "Switching Protocols", category: "1xx", summary: "Server is switching protocols to the one requested in Upgrade header.", detail: "Commonly used for WebSocket upgrade handshakes.", rfc: "RFC 9110, 15.2.2" },
  { code: 102, phrase: "Processing", category: "1xx", summary: "Server has received and is processing the request, but no response is available yet.", detail: "WebDAV extension to prevent client timeout on long operations.", rfc: "RFC 2518" },
  { code: 103, phrase: "Early Hints", category: "1xx", summary: "Used to return headers before final HTTP message to preload critical assets.", detail: "Helps browsers preload stylesheets and scripts before the main HTML finishes rendering.", rfc: "RFC 8297" },

  // 2xx
  { code: 200, phrase: "OK", category: "2xx", summary: "Standard response for successful HTTP requests.", detail: "Actual response depends on the request method (GET returns representation, POST returns action result).", rfc: "RFC 9110, 15.3.1" },
  { code: 201, phrase: "Created", category: "2xx", summary: "Request succeeded and led to the creation of a new resource.", detail: "Usually sent following POST/PUT requests with a Location header pointing to the new resource.", rfc: "RFC 9110, 15.3.2" },
  { code: 202, phrase: "Accepted", category: "2xx", summary: "Request has been accepted for processing, but processing is not completed.", detail: "Used for asynchronous or batch background processing tasks.", rfc: "RFC 9110, 15.3.3" },
  { code: 204, phrase: "No Content", category: "2xx", summary: "Server successfully processed request and is not returning any content.", detail: "Common for DELETE requests or PUT actions that don't need a response body.", rfc: "RFC 9110, 15.3.5" },
  { code: 206, phrase: "Partial Content", category: "2xx", summary: "Server is delivering only part of the resource due to Range header.", detail: "Used for video/audio streaming and resumeable multi-part downloads.", rfc: "RFC 9110, 15.3.7" },

  // 3xx
  { code: 301, phrase: "Moved Permanently", category: "3xx", summary: "Resource has been assigned a new permanent URI.", detail: "Search engines update URLs and transfer SEO ranking. Clients should use new URI in Location header.", rfc: "RFC 9110, 15.4.2" },
  { code: 302, phrase: "Found", category: "3xx", summary: "Resource resides temporarily under a different URI.", detail: "Historical redirect status code. Often changes method to GET in browsers.", rfc: "RFC 9110, 15.4.3" },
  { code: 304, phrase: "Not Modified", category: "3xx", summary: "Resource has not been modified since version specified in request headers.", detail: "Client can use cached version (If-Modified-Since or If-None-Match conditional headers).", rfc: "RFC 9110, 15.4.5" },
  { code: 307, phrase: "Temporary Redirect", category: "3xx", summary: "Temporary redirect that guarantees the HTTP method will not change.", detail: "If request was POST, subsequent redirected request must also be POST.", rfc: "RFC 9110, 15.4.8" },
  { code: 308, phrase: "Permanent Redirect", category: "3xx", summary: "Permanent redirect that guarantees the HTTP method will not change.", detail: "Permanent counterpart of 307; method must not change from POST to GET.", rfc: "RFC 9110, 15.4.9" },

  // 4xx
  { code: 400, phrase: "Bad Request", category: "4xx", summary: "Server cannot or will not process request due to perceived client error.", detail: "Malformed syntax, invalid request framing, or deceptive routing.", commonCause: "Invalid JSON syntax, missing required fields, schema validation failure.", rfc: "RFC 9110, 15.5.1" },
  { code: 401, phrase: "Unauthorized", category: "4xx", summary: "Authentication is required and has failed or not yet been provided.", detail: "Response must include a WWW-Authenticate header field.", commonCause: "Missing Bearer token, expired JWT, invalid API credentials.", rfc: "RFC 9110, 15.5.2" },
  { code: 403, phrase: "Forbidden", category: "4xx", summary: "Server understood request but refuses to authorize it.", detail: "Unlike 401, authenticating will not help. User does not have sufficient permissions.", commonCause: "RBAC failure, CORS origin rejected, IP blocked by WAF.", rfc: "RFC 9110, 15.5.4" },
  { code: 404, phrase: "Not Found", category: "4xx", summary: "Origin server did not find a current representation for target resource.", detail: "Requested endpoint or ID does not exist in the routing table or database.", commonCause: "Typo in URL path, deleted resource, missing route handler.", rfc: "RFC 9110, 15.5.5" },
  { code: 405, phrase: "Method Not Allowed", category: "4xx", summary: "Request method is known by server but not supported by target resource.", detail: "Response MUST include an Allow header containing valid methods.", commonCause: "Sending POST to a read-only GET endpoint.", rfc: "RFC 9110, 15.5.6" },
  { code: 408, phrase: "Request Timeout", category: "4xx", summary: "Server did not receive complete request within its timeout period.", detail: "Client may repeat request without modifications at any later time.", commonCause: "Slow network, interrupted stream upload.", rfc: "RFC 9110, 15.5.9" },
  { code: 409, phrase: "Conflict", category: "4xx", summary: "Request could not be completed due to a conflict with resource state.", detail: "Common in optimistic locking, duplicate unique database constraint violation.", commonCause: "Email already registered, concurrent edit collision.", rfc: "RFC 9110, 15.5.10" },
  { code: 410, phrase: "Gone", category: "4xx", summary: "Target resource is no longer available at origin server and no forwarding address is known.", detail: "Unlike 404, this condition is expected to be permanent.", commonCause: "Purged API v1 endpoint, deleted user account.", rfc: "RFC 9110, 15.5.11" },
  { code: 413, phrase: "Payload Too Large", category: "4xx", summary: "Request entity is larger than limits defined by server.", detail: "Server may close connection to prevent client from continuing request.", commonCause: "File upload exceeds Nginx / Vercel body size limit.", rfc: "RFC 9110, 15.5.14" },
  { code: 418, phrase: "I'm a teapot", category: "4xx", summary: "Server refuses attempt to brew coffee with a teapot (HTCPCP).", detail: "Defined in 1998 April Fools' RFC 2324 / RFC 7168.", commonCause: "Easter egg implementation.", rfc: "RFC 2324" },
  { code: 422, phrase: "Unprocessable Content", category: "4xx", summary: "Request syntax is valid, but server was unable to process contained instructions.", detail: "Standard for semantic validation errors (e.g. Zod / Pydantic validation errors).", commonCause: "Field type mismatch, semantic validator rejected parameters.", rfc: "RFC 9110, 15.5.21" },
  { code: 429, phrase: "Too Many Requests", category: "4xx", summary: "User has sent too many requests in a given amount of time (rate limiting).", detail: "Response should include Retry-After header indicating how long to wait.", commonCause: "Rate limit exceeded, API token quota reached.", rfc: "RFC 6585, Section 4" },

  // 5xx
  { code: 500, phrase: "Internal Server Error", category: "5xx", summary: "Server encountered an unexpected condition that prevented it from fulfilling request.", detail: "Generic catch-all error when an unhandled exception occurs in application code.", commonCause: "Unhandled exception, uncaught null pointer, DB connection crash.", rfc: "RFC 9110, 15.6.1" },
  { code: 501, phrase: "Not Implemented", category: "5xx", summary: "Server does not support the functionality required to fulfill request.", detail: "Appropriate when server does not recognize the request method.", commonCause: "HTTP method unsupported across the entire server.", rfc: "RFC 9110, 15.6.2" },
  { code: 502, phrase: "Bad Gateway", category: "5xx", summary: "Server acting as gateway/proxy received an invalid response from inbound server.", detail: "Common when reverse proxy (Nginx, Cloudflare) cannot communicate with upstream app.", commonCause: "Node.js / Python backend crashed or exited.", rfc: "RFC 9110, 15.6.3" },
  { code: 503, phrase: "Service Unavailable", category: "5xx", summary: "Server is currently unable to handle request due to temporary overload or maintenance.", detail: "Implies a temporary condition that will be resolved after some delay.", commonCause: "Server restart, CPU exhaustion, maintenance mode.", rfc: "RFC 9110, 15.6.4" },
  { code: 504, phrase: "Gateway Timeout", category: "5xx", summary: "Server acting as gateway/proxy did not receive timely response from upstream server.", detail: "Reverse proxy timed out waiting for backend to reply.", commonCause: "Long-running DB query, serverless function timed out.", rfc: "RFC 9110, 15.6.5" },
];

const HTTP_HEADERS: HttpHeader[] = [
  { name: "Authorization", type: "Request", summary: "Contains credentials to authenticate user agent with server.", example: "Bearer eyJhbGciOi...", rfc: "RFC 9110" },
  { name: "Cache-Control", type: "Both", summary: "Directives for caching mechanisms in requests and responses.", example: "public, max-age=3600, immutable", rfc: "RFC 9111" },
  { name: "Content-Type", type: "Both", summary: "Indicates original media type of the resource before content encoding.", example: "application/json; charset=utf-8", rfc: "RFC 9110" },
  { name: "Content-Security-Policy", type: "Response", summary: "Restricts resources (scripts, images, frames) browser is allowed to load.", example: "default-src 'self'; script-src 'self'", rfc: "W3C CSP Level 3" },
  { name: "Strict-Transport-Security", type: "Response", summary: "Forces browser to communicate only over secure HTTPS connections (HSTS).", example: "max-age=31536000; includeSubDomains; preload", rfc: "RFC 6797" },
  { name: "Access-Control-Allow-Origin", type: "Response", summary: "Indicates whether response can be shared with requesting origin (CORS).", example: "* or https://example.com", rfc: "W3C CORS" },
  { name: "ETag", type: "Response", summary: "Identifier for specific version of resource used for web cache validation.", example: 'W/"33a64df551425fcc55e4d42a148795d9f25f89d4"', rfc: "RFC 9111" },
  { name: "User-Agent", type: "Request", summary: "Characteristic string that lets network protocol peers identify origin agent.", example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...", rfc: "RFC 9110" },
  { name: "RateLimit-Remaining", type: "Response", summary: "Number of remaining requests allowed in current time window.", example: "98", rfc: "IETF Draft" },
  { name: "Retry-After", type: "Response", summary: "Indicates how long user agent should wait before making a follow-up request.", example: "120 or Wed, 21 Oct 2026 07:28:00 GMT", rfc: "RFC 9110" },
];

export default function HttpStatusClient() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "1xx" | "2xx" | "3xx" | "4xx" | "5xx" | "headers">("all");
  const [selectedCode, setSelectedCode] = useState<StatusCode | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredCodes = useMemo(() => {
    const q = search.toLowerCase().trim();
    return STATUS_CODES.filter((s) => {
      const matchTab = activeTab === "all" || s.category === activeTab;
      if (!matchTab) return false;
      if (!q) return true;
      return (
        s.code.toString().includes(q) ||
        s.phrase.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        (s.commonCause && s.commonCause.toLowerCase().includes(q))
      );
    });
  }, [search, activeTab]);

  const filteredHeaders = useMemo(() => {
    const q = search.toLowerCase().trim();
    return HTTP_HEADERS.filter((h) => {
      if (!q) return true;
      return (
        h.name.toLowerCase().includes(q) ||
        h.summary.toLowerCase().includes(q) ||
        h.type.toLowerCase().includes(q)
      );
    });
  }, [search]);

  const getCategoryColor = (cat: StatusCode["category"]) => {
    switch (cat) {
      case "1xx":
        return "text-text-secondary border-text-secondary/30 bg-text-secondary/10";
      case "2xx":
        return "text-success border-success/30 bg-success/10";
      case "3xx":
        return "text-accent border-accent/30 bg-accent-soft";
      case "4xx":
        return "text-warning border-warning/30 bg-warning/10";
      case "5xx":
        return "text-error border-error/30 bg-error/10";
    }
  };

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Total Codes</p>
        <p className="text-accent font-mono font-bold">{STATUS_CODES.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Headers Indexed</p>
        <p className="text-text-primary font-mono">{HTTP_HEADERS.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Filtered Results</p>
        <p className="text-text-secondary font-mono">{activeTab === "headers" ? filteredHeaders.length : filteredCodes.length}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Specification</p>
        <p className="text-text-muted font-mono text-xs">RFC 9110 Standard</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">HTTP Status Codes & Headers Explorer</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Instant search directory for HTTP status codes (100–599), RFC definitions, causes, and standard headers.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search status code (e.g. 404, 502, unauthorized, cache-control)..."
              className="w-full rounded-lg bg-bg-page border border-border-subtle p-4 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 mb-6 bg-bg-page p-1 rounded-lg border border-border-subtle">
            {(
              [
                { id: "all", label: "All Codes" },
                { id: "1xx", label: "1xx Informational" },
                { id: "2xx", label: "2xx Success" },
                { id: "3xx", label: "3xx Redirection" },
                { id: "4xx", label: "4xx Client Error" },
                { id: "5xx", label: "5xx Server Error" },
                { id: "headers", label: "Common Headers" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedCode(null);
                }}
                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors ${
                  activeTab === tab.id
                    ? "bg-accent-soft text-accent font-semibold"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Details Modal / Box if selected */}
          {selectedCode && (
            <div className="mb-6 p-5 rounded-lg bg-bg-page border border-accent/40 shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-base font-mono font-bold rounded border ${getCategoryColor(selectedCode.category)}`}>
                    {selectedCode.code}
                  </span>
                  <h2 className="text-xl font-bold text-text-primary">{selectedCode.phrase}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCode(null)}
                  className="text-xs font-mono text-text-muted hover:text-text-primary"
                >
                  [Close ✕]
                </button>
              </div>

              <p className="mt-3 text-sm text-text-primary">{selectedCode.summary}</p>
              <p className="mt-2 text-xs text-text-secondary">{selectedCode.detail}</p>

              {selectedCode.commonCause && (
                <div className="mt-3 p-3 bg-bg-card rounded border border-border-subtle">
                  <p className="text-[11px] font-mono uppercase text-warning font-semibold">Common Causes & Triggers:</p>
                  <p className="text-xs text-text-secondary mt-1">{selectedCode.commonCause}</p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-text-muted font-mono pt-2 border-t border-border-subtle">
                <span>Spec: {selectedCode.rfc}</span>
                <CopyButton text={`HTTP/1.1 ${selectedCode.code} ${selectedCode.phrase}`} label="Copy Status Line" />
              </div>
            </div>
          )}

          {/* Content List */}
          {activeTab === "headers" ? (
            <div className="space-y-3">
              {filteredHeaders.map((header) => (
                <div
                  key={header.name}
                  className="p-4 rounded-lg bg-bg-page border border-border-subtle hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-accent text-sm">{header.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle text-text-muted">
                        {header.type}
                      </span>
                    </div>
                    <CopyButton text={`${header.name}: ${header.example}`} />
                  </div>
                  <p className="text-xs text-text-secondary mt-2">{header.summary}</p>
                  <div className="mt-2 text-xs font-mono text-text-muted bg-bg-card p-2 rounded border border-border-subtle">
                    <span className="text-text-muted select-none">Example: </span>
                    <span className="text-text-primary">{header.name}: {header.example}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredCodes.map((item) => (
                <div
                  key={item.code}
                  onClick={() => setSelectedCode(item)}
                  className="p-4 rounded-lg bg-bg-page border border-border-subtle hover:border-accent cursor-pointer transition-all hover:bg-bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${getCategoryColor(item.category)}`}>
                      {item.code}
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">{item.rfc}</span>
                  </div>
                  <h3 className="font-semibold text-text-primary text-sm mt-2">{item.phrase}</h3>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{item.summary}</p>
                </div>
              ))}
            </div>
          )}

          {filteredCodes.length === 0 && activeTab !== "headers" && (
            <p className="text-center text-xs font-mono text-text-muted py-8">
              No status codes matching query &quot;{search}&quot;.
            </p>
          )}
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="http-status" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="http-status" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
