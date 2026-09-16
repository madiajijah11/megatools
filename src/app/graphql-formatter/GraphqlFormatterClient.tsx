"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

const PRESETS = {
  userQuery: `query GetUserProfile($userId: ID!, $limit: Int = 10) {
  user(id: $userId) {
    id
    username
    email
    profile {
      avatarUrl
      bio
    }
    posts(limit: $limit) {
      id
      title
      slug
      createdAt
    }
  }
}`,
  mutation: `mutation CreateOrganization($input: CreateOrgInput!) {
  createOrg(input: $input) {
    org {
      id
      name
      slug
      tier
      memberCount
    }
    errors {
      field
      message
    }
  }
}`,
  subscription: `subscription OnChatMessageReceived($channelId: ID!) {
  messageAdded(channelId: $channelId) {
    id
    content
    sender {
      id
      name
      avatar
    }
    timestamp
  }
}`,
};

function formatGraphQL(query: string, indent = 2): string {
  const lines = query.split("\n");
  let depth = 0;
  const result: string[] = [];

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // decrease indent if line starts with closing brace
    if (line.startsWith("}")) {
      depth = Math.max(0, depth - 1);
    }

    const pad = " ".repeat(depth * indent);
    result.push(pad + line);

    // increase indent if line ends with opening brace
    if (line.endsWith("{")) {
      depth++;
    } else {
      // count net braces on this line
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      depth += openCount - closeCount;
      if (depth < 0) depth = 0;
    }
  }

  return result.join("\n");
}

function minifyGraphQL(query: string): string {
  return query
    .replace(/#[^\n]*/g, "") // remove comments
    .replace(/\s+/g, " ")
    .replace(/\s*([{}():,=])\s*/g, "$1")
    .trim();
}

function inspectGraphQLAst(query: string): {
  operationType: string;
  operationName: string;
  variables: string[];
  fields: string[];
} {
  const trimmed = query.trim();
  let operationType = "query";
  let operationName = "Anonymous";
  const variables: string[] = [];
  const fields: string[] = [];

  const opMatch = trimmed.match(/^(query|mutation|subscription)\s*([a-zA-Z0-9_]*)/i);
  if (opMatch) {
    operationType = opMatch[1].toLowerCase();
    operationName = opMatch[2] || "Anonymous";
  }

  // Extract variables e.g. $userId: ID!
  const varMatches = [...trimmed.matchAll(/\$([a-zA-Z0-9_]+)\s*:\s*([a-zA-Z0-9_![\]]+)/g)];
  varMatches.forEach((m) => {
    variables.push(`$${m[1]}: ${m[2]}`);
  });

  // Extract top-level root fields inside first {
  const firstBrace = trimmed.indexOf("{");
  if (firstBrace !== -1) {
    const inner = trimmed.slice(firstBrace + 1);
    const rootFieldMatches = [...inner.matchAll(/\b([a-zA-Z0-9_]+)\s*(?:\(|\{)/g)];
    rootFieldMatches.slice(0, 5).forEach((m) => {
      if (!["query", "mutation", "subscription", "fragment"].includes(m[1])) {
        fields.push(m[1]);
      }
    });
  }

  return {
    operationType,
    operationName,
    variables,
    fields: Array.from(new Set(fields)),
  };
}

export default function GraphqlFormatterClient() {
  const [query, setQuery] = useState<string>(PRESETS.userQuery);
  const [variablesJson, setVariablesJson] = useState<string>('{\n  "userId": "usr_9981",\n  "limit": 5\n}');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<"formatted" | "payload">("formatted");

  const formattedQuery = useMemo(() => {
    if (!query.trim()) return "";
    return formatGraphQL(query, indentSize);
  }, [query, indentSize]);

  const minifiedQuery = useMemo(() => {
    if (!query.trim()) return "";
    return minifyGraphQL(query);
  }, [query]);

  const astInfo = useMemo(() => {
    return inspectGraphQLAst(query);
  }, [query]);

  const payloadBundle = useMemo(() => {
    let varsObj: unknown = {};
    try {
      if (variablesJson.trim()) varsObj = JSON.parse(variablesJson);
    } catch {
      varsObj = { _parse_error: "Invalid JSON in variables" };
    }

    return JSON.stringify(
      {
        query: minifiedQuery,
        variables: varsObj,
      },
      null,
      2
    );
  }, [minifiedQuery, variablesJson]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Operation Type:</span>
        <span className="text-accent font-bold uppercase">{astInfo.operationType}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Operation Name:</span>
        <span className="text-text-primary font-bold">{astInfo.operationName}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Declared Variables:</span>
        <span className="text-success font-bold">{astInfo.variables.length} vars</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="graphql-formatter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle text-xs">
          <span className="text-text-muted">GraphQL Presets:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setQuery(PRESETS.userQuery)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [User Query + Vars]
            </button>
            <button
              type="button"
              onClick={() => setQuery(PRESETS.mutation)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Mutation Payload]
            </button>
            <button
              type="button"
              onClick={() => setQuery(PRESETS.subscription)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent transition-colors"
            >
              [Subscription]
            </button>
          </div>
        </div>

        {/* Input Query Editor */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">GraphQL Document Source</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={query} label="Copy" />
            </div>
          </div>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paste GraphQL query, mutation, or fragment..."
            rows={8}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Query Variables Box */}
        <div className="space-y-2 pt-2 border-t border-border-subtle">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Query Variables (JSON)</span>
            <span className="text-[10px] text-text-muted font-mono">
              {astInfo.variables.length ? `Detected: ${astInfo.variables.join(", ")}` : "No variables"}
            </span>
          </div>
          <textarea
            value={variablesJson}
            onChange={(e) => setVariablesJson(e.target.value)}
            placeholder='{"key": "value"}'
            rows={3}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-2.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Formatting Actions & Indent Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("formatted")}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === "formatted" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Formatted Query
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payload")}
              className={`px-3 py-1 rounded font-bold transition-colors ${
                activeTab === "payload" ? "bg-accent text-bg-page" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              HTTP POST Payload
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-text-muted">Indent:</span>
            {[2, 4].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setIndentSize(size)}
                className={`px-2 py-0.5 rounded border text-xs font-mono transition-colors ${
                  indentSize === size
                    ? "border-accent text-accent bg-accent/10 font-bold"
                    : "border-border-subtle text-text-muted hover:text-text-secondary"
                }`}
              >
                {size} spaces
              </button>
            ))}
          </div>
        </div>

        {/* Output Area */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">
              {activeTab === "formatted" ? "Prettified GraphQL Output" : "Bundled JSON Payload for fetch()"}
            </span>
            <div className="flex items-center gap-2">
              <CopyButton
                text={activeTab === "formatted" ? formattedQuery : payloadBundle}
                label="Copy Output"
              />
            </div>
          </div>

          <pre className="p-3.5 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all max-h-72 overflow-y-auto leading-relaxed">
            {activeTab === "formatted" ? formattedQuery : payloadBundle}
          </pre>
        </div>
      </div>
    </ToolLayout>
  );
}
