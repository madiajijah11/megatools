"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function sanitizeKey(k: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)) {
    return k;
  }
  return `"${k.replace(/"/g, '\\"')}"`;
}

function inferTypeTs(value: unknown, rootName: string, interfaces: Map<string, string>, isType = false): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  const type = typeof value;
  if (type === "string") return "string";
  if (type === "number") return "number";
  if (type === "boolean") return "boolean";

  if (Array.isArray(value)) {
    if (value.length === 0) return "unknown[]";
    const itemTypes = Array.from(
      new Set(value.map((item) => inferTypeTs(item, `${rootName}Item`, interfaces, isType)))
    );
    if (itemTypes.length === 1) return `${itemTypes[0]}[]`;
    return `(${itemTypes.join(" | ")})[]`;
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>;
    const lines: string[] = [];

    for (const [key, val] of Object.entries(obj)) {
      const nestedName = `${rootName}${capitalize(key)}`;
      const fieldType = inferTypeTs(val, nestedName, interfaces, isType);
      lines.push(`  ${sanitizeKey(key)}: ${fieldType};`);
    }

    const decl = isType
      ? `export type ${rootName} = {\n${lines.join("\n")}\n};`
      : `export interface ${rootName} {\n${lines.join("\n")}\n}`;

    interfaces.set(rootName, decl);
    return rootName;
  }

  return "unknown";
}

function generateZodSchema(value: unknown, schemaName: string, schemas: Map<string, string>): string {
  if (value === null) return "z.null()";
  if (value === undefined) return "z.undefined()";

  const type = typeof value;
  if (type === "string") return "z.string()";
  if (type === "number") return "z.number()";
  if (type === "boolean") return "z.boolean()";

  if (Array.isArray(value)) {
    if (value.length === 0) return "z.array(z.unknown())";
    const inner = generateZodSchema(value[0], `${schemaName}Item`, schemas);
    return `z.array(${inner})`;
  }

  if (type === "object") {
    const obj = value as Record<string, unknown>;
    const lines: string[] = [];

    for (const [key, val] of Object.entries(obj)) {
      const nestedName = `${schemaName}${capitalize(key)}`;
      const fieldSchema = generateZodSchema(val, nestedName, schemas);
      lines.push(`  ${sanitizeKey(key)}: ${fieldSchema},`);
    }

    const decl = `export const ${schemaName}Schema = z.object({\n${lines.join("\n")}\n});\n\nexport type ${schemaName} = z.infer<typeof ${schemaName}Schema>;`;
    schemas.set(schemaName, decl);
    return `${schemaName}Schema`;
  }

  return "z.unknown()";
}

const SAMPLE_JSON = JSON.stringify(
  {
    id: "usr_99812",
    username: "alex_dev",
    email: "alex@example.com",
    isActive: true,
    profile: {
      fullName: "Alex Rivera",
      avatarUrl: "https://avatar.example.com/alex.png",
      bio: "Fullstack developer & terminal enthusiast.",
      followersCount: 1420,
    },
    roles: ["admin", "editor"],
    metadata: {
      lastLogin: "2026-03-30T14:22:00Z",
      ipAddress: "192.168.1.1",
    },
  },
  null,
  2
);

export default function JsonToTsClient() {
  const [jsonInput, setJsonInput] = useState(SAMPLE_JSON);
  const [rootName, setRootName] = useState("UserResponse");
  const [outputMode, setOutputMode] = useState<"interface" | "type" | "zod">("interface");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const result = useMemo(() => {
    if (!jsonInput.trim()) return { code: "// Paste JSON to generate types", error: null };

    try {
      const parsed = JSON.parse(jsonInput);
      const cleanRoot = rootName.trim() || "RootObject";

      if (outputMode === "zod") {
        const schemas = new Map<string, string>();
        generateZodSchema(parsed, cleanRoot, schemas);
        const code = `import { z } from "zod";\n\n` + Array.from(schemas.values()).reverse().join("\n\n");
        return { code, error: null };
      } else {
        const interfaces = new Map<string, string>();
        const isType = outputMode === "type";
        inferTypeTs(parsed, cleanRoot, interfaces, isType);
        const code = Array.from(interfaces.values()).reverse().join("\n\n");
        return { code, error: null };
      }
    } catch (err) {
      return { code: "", error: (err as Error).message };
    }
  }, [jsonInput, rootName, outputMode]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">JSON Status</p>
        <p className={`font-mono font-bold ${result.error ? "text-error" : "text-success"}`}>
          {result.error ? "SYNTAX ERR" : "VALID"}
        </p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Target Format</p>
        <p className="text-accent font-mono uppercase text-xs">{outputMode}</p>
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
              <span className="gradient-text">JSON to TypeScript & Zod Schema</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Infer strong TypeScript interfaces, type definitions, or Zod validation schemas from JSON data.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-bg-page rounded-lg border border-border-subtle">
            <div className="flex items-center gap-2">
              <label className="text-xs font-mono text-text-muted">Root Name:</label>
              <input
                type="text"
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="RootType"
                className="px-2 py-1 text-xs font-mono rounded bg-bg-card border border-border-subtle text-accent focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-bg-card p-1 rounded-lg border border-border-subtle">
              {(
                [
                  { id: "interface", label: "TS Interface" },
                  { id: "type", label: "TS Type" },
                  { id: "zod", label: "Zod Schema" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOutputMode(tab.id)}
                  className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                    outputMode === tab.id
                      ? "bg-accent-soft text-accent font-semibold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Output Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Input JSON */}
            <div>
              <div className="h-8 flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  JSON Input:
                </label>
                <button
                  type="button"
                  onClick={() => setJsonInput(SAMPLE_JSON)}
                  className="text-xs text-text-muted hover:text-accent font-mono transition-colors px-2 py-1 rounded border border-border-subtle/60 hover:border-accent/40 bg-bg-page/60"
                >
                  [Reset Example]
                </button>
              </div>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste JSON here..."
                className={`w-full h-[320px] rounded-lg bg-bg-page border p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:outline-none resize-none ${
                  result.error ? "border-error" : "border-border-subtle focus:border-accent"
                }`}
                spellCheck={false}
              />
              {result.error && (
                <p className="mt-1 text-xs font-mono text-error truncate">{result.error}</p>
              )}
            </div>

            {/* Generated Code */}
            <div>
              <div className="h-8 flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary">
                  Generated Output:
                </label>
                <CopyButton
                  text={result.code}
                  className="text-xs font-mono px-2 py-1 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                />
              </div>
              <div className="relative rounded-lg bg-bg-page border border-border-subtle p-3 font-mono text-xs text-text-primary overflow-x-auto h-[320px] overflow-y-auto">
                <pre className="whitespace-pre">{result.code}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info Sidebar */}
        <div className="hidden lg:block">
          <InfoPanel toolId="json-to-ts" stats={stats} />
        </div>
      </div>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="json-to-ts" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
