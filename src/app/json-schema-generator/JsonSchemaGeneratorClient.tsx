"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

const SAMPLE_JSON = `{
  "id": 101,
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "isActive": true,
  "registeredAt": "2026-08-15T08:30:00Z",
  "website": "https://megatools-tau.vercel.app",
  "roles": ["admin", "editor"],
  "profile": {
    "age": 28,
    "bio": "Full-stack software engineer.",
    "location": {
      "city": "San Francisco",
      "country": "USA"
    }
  }
}`;

function inferJsonSchema(
  value: unknown,
  includeRequired = true,
  schemaDraft = "draft-07"
): Record<string, unknown> {
  const schemaUri =
    schemaDraft === "2020-12"
      ? "https://json-schema.org/draft/2020-12/schema"
      : "http://json-schema.org/draft-07/schema#";

  function parseNode(val: unknown): Record<string, unknown> {
    if (val === null) {
      return { type: "null" };
    }
    if (typeof val === "boolean") {
      return { type: "boolean" };
    }
    if (typeof val === "number") {
      return { type: Number.isInteger(val) ? "integer" : "number" };
    }
    if (typeof val === "string") {
      const node: Record<string, unknown> = { type: "string" };
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(val)) {
        node.format = "date-time";
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        node.format = "email";
      } else if (/^https?:\/\/[^\s]+$/.test(val)) {
        node.format = "uri";
      }
      return node;
    }
    if (Array.isArray(val)) {
      const node: Record<string, unknown> = { type: "array" };
      if (val.length > 0) {
        node.items = parseNode(val[0]);
      } else {
        node.items = {};
      }
      return node;
    }
    if (typeof val === "object") {
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        properties[k] = parseNode(v);
        if (includeRequired) {
          required.push(k);
        }
      }

      const node: Record<string, unknown> = {
        type: "object",
        properties,
      };
      if (includeRequired && required.length > 0) {
        node.required = required;
      }
      return node;
    }
    return {};
  }

  const root = parseNode(value);
  return {
    $schema: schemaUri,
    title: "GeneratedSchema",
    ...root,
  };
}

export default function JsonSchemaGeneratorClient() {
  const [inputJson, setInputJson] = useState(SAMPLE_JSON);
  const [includeRequired, setIncludeRequired] = useState(true);
  const [schemaDraft, setSchemaDraft] = useState<"draft-07" | "2020-12">("draft-07");
  const [indentSize, setIndentSize] = useState<number>(2);
  const { outputSchema, error, propertiesCount } = useMemo(() => {
    if (!inputJson.trim()) {
      return { outputSchema: "", error: null, propertiesCount: 0 };
    }
    try {
      const parsed = JSON.parse(inputJson);
      const schema = inferJsonSchema(parsed, includeRequired, schemaDraft);
      const str = JSON.stringify(schema, null, indentSize);

      let propCount = 0;
      if (typeof parsed === "object" && parsed !== null) {
        propCount = Object.keys(parsed).length;
      }

      return { outputSchema: str, error: null, propertiesCount: propCount };
    } catch (err) {
      return {
        outputSchema: "",
        error: (err as Error).message,
        propertiesCount: 0,
      };
    }
  }, [inputJson, includeRequired, schemaDraft, indentSize]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Draft Version</p>
        <p className="text-accent font-mono text-xs font-bold">{schemaDraft.toUpperCase()}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Root Props</p>
        <p className="text-text-primary font-mono text-xs">{propertiesCount}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="json-schema-generator" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        {/* Options Bar */}
          <div className="mb-4 p-3 rounded-xl bg-bg-page border border-border-subtle flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-mono text-text-secondary">Schema Standard:</label>
                <select
                  value={schemaDraft}
                  onChange={(e) => setSchemaDraft(e.target.value as "draft-07" | "2020-12")}
                  className="bg-bg-card border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value="draft-07">Draft-07</option>
                  <option value="2020-12">2020-12</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-mono text-text-secondary">Indent:</label>
                <select
                  value={indentSize}
                  onChange={(e) => setIndentSize(Number(e.target.value))}
                  className="bg-bg-card border border-border-subtle rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-accent focus:outline-none"
                >
                  <option value={2}>2 Spaces</option>
                  <option value={4}>4 Spaces</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRequired}
                  onChange={(e) => setIncludeRequired(e.target.checked)}
                  className="accent-accent"
                />
                Require all properties
              </label>
            </div>

            <button
              type="button"
              onClick={() => setInputJson(SAMPLE_JSON)}
              className="text-xs font-mono text-text-muted hover:text-accent transition-colors"
            >
              Reset Sample
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Input JSON */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  JSON Sample Payload:
                </label>
                <button
                  type="button"
                  onClick={() => setInputJson("")}
                  className="text-[11px] font-mono text-text-muted hover:text-error transition-colors"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                placeholder='{"id": 1, "name": "sample"}'
                rows={14}
                className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Right: Output JSON Schema */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  Generated JSON Schema:
                </label>
                {outputSchema && <CopyButton text={outputSchema} />}
              </div>

              {error ? (
                <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs h-[300px]">
                  ⚠ Invalid JSON Syntax: {error}
                </div>
              ) : (
                <div className="relative rounded-xl bg-bg-page border border-border-subtle p-3.5 font-mono text-xs text-text-primary overflow-x-auto h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre">{outputSchema || "{\n  /* Schema will be generated here */\n}"}</pre>
                </div>
              )}
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}