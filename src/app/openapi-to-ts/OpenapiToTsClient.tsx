"use client";

import { useMemo, useState } from "react";
import { load as parseYaml } from "js-yaml";
import CopyButton from "@/components/CopyButton";
import ToolLayout from "@/components/ToolLayout";

type Schema = Record<string, any>;
type Mode = "interface" | "type" | "zod";

const SAMPLE = `openapi: 3.0.0
info:
  title: Demo API
  version: 1.0.0
components:
  schemas:
    User:
      type: object
      required: [id, email]
      properties:
        id: { type: integer }
        email: { type: string, format: email }
        roles: { type: array, items: { type: string } }
        profile: { $ref: '#/components/schemas/Profile' }
    Profile:
      type: object
      properties:
        displayName: { type: string }
        age: { type: integer }`;

function refName(ref: unknown): string | null {
  return typeof ref === "string" ? ref.split("/").pop() || null : null;
}

function safeKey(key: string): string {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
}
function safeIdentifier(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9_$]/g, "_");
  return /^[A-Za-z_$]/.test(cleaned) ? cleaned : `_${cleaned}`;
}

function tsType(schema: Schema = {}): string {
  if (schema.$ref) return safeIdentifier(refName(schema.$ref) || "unknown");
  if (schema.oneOf || schema.anyOf) return (schema.oneOf || schema.anyOf).map((item: Schema) => tsType(item)).join(" | ");
  if (schema.allOf) return schema.allOf.map((item: Schema) => tsType(item)).join(" & ");
  if (schema.enum) return schema.enum.map((value: unknown) => JSON.stringify(value)).join(" | ");
  if (schema.nullable) return `${tsType({ ...schema, nullable: false })} | null`;
  if (schema.type === "array") return `Array<${tsType(schema.items)}>`;
  if (schema.type === "integer" || schema.type === "number") return "number";
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "null") return "null";
  if (schema.format === "binary") return "Blob";
  if (schema.type === "object" || schema.properties) {
    if (schema.properties) {
      const required = new Set<string>(schema.required || []);
      const fields = Object.entries<Schema>(schema.properties).map(([key, value]) => `  ${safeKey(key)}${required.has(key) ? "" : "?"}: ${tsType(value)};`);
      return `{\n${fields.join("\n")}\n}`;
    }
    return schema.additionalProperties && schema.additionalProperties !== true
      ? `Record<string, ${tsType(schema.additionalProperties)}>`
      : "Record<string, unknown>";
  }
  return "string";
}

function zodType(schema: Schema = {}): string {
  if (schema.$ref) return `${safeIdentifier(refName(schema.$ref) || "Unknown")}Schema`;
  if (schema.oneOf || schema.anyOf) {
    const items = schema.oneOf || schema.anyOf;
    return items.length === 1 ? zodType(items[0]) : `z.union([${items.map((item: Schema) => zodType(item)).join(", ")}])`;
  }
  if (schema.allOf) {
    const [first, ...rest] = schema.allOf.map((item: Schema) => zodType(item));
    return rest.reduce((result: string, item: string) => `${result}.and(${item})`, first || "z.unknown()");
  }
  if (schema.enum) {
    const values = schema.enum as unknown[];
    return values.every((value) => typeof value === "string")
      ? `z.enum([${values.map((value) => JSON.stringify(value)).join(", ")}])`
      : values.length === 1 ? `z.literal(${JSON.stringify(values[0])})` : `z.union([${values.map((value) => `z.literal(${JSON.stringify(value)})`).join(", ")}])`;
  }
  if (schema.nullable) return `z.union([${zodType({ ...schema, nullable: false })}, z.null()])`;
  if (schema.type === "array") return `z.array(${zodType(schema.items)})`;
  if (schema.type === "integer" || schema.type === "number") return "z.number()";
  if (schema.type === "boolean") return "z.boolean()";
  if (schema.type === "null") return "z.null()";
  if (schema.format === "email") return "z.string().email()";
  if (schema.format === "uuid") return "z.string().uuid()";
  if (schema.format === "date-time") return "z.string().datetime()";
  if (schema.format === "binary") return "z.instanceof(Blob)";
  if (schema.type === "object" || schema.properties) {
    if (schema.properties) {
      const required = new Set<string>(schema.required || []);
      const fields = Object.entries<Schema>(schema.properties).map(([key, value]) => `  ${safeKey(key)}: ${zodType(value)}${required.has(key) ? "" : ".optional()"},`);
      return `z.object({\n${fields.join("\n")}\n})`;
    }
    return schema.additionalProperties && schema.additionalProperties !== true
      ? `z.record(z.string(), ${zodType(schema.additionalProperties)})`
      : "z.record(z.string(), z.unknown())";
  }
  return "z.string()";
}

function generate(document: Schema, mode: Mode): string {
  const schemas = document.components?.schemas as Record<string, Schema> | undefined;
  if (!schemas || Object.keys(schemas).length === 0) return "// No components.schemas found in this document.";
  let output = mode === "zod" ? 'import { z } from "zod";\n\n' : "";
  for (const [name, schema] of Object.entries(schemas)) {
    if (mode === "zod") {
    const identifier = safeIdentifier(name);
    output += `export const ${identifier}Schema = ${zodType(schema)};\nexport type ${identifier} = z.infer<typeof ${identifier}Schema>;\n\n`;
    } else if (schema.type === "object" || schema.properties) {
      output += `export ${mode} ${name}${mode === "type" ? " =" : ""} {\n`;
      const required = new Set<string>(schema.required || []);
      for (const [key, value] of Object.entries<Schema>(schema.properties || {})) {
        output += `  ${safeKey(key)}${required.has(key) ? "" : "?"}: ${tsType(value)};\n`;
      }
      output += `}${mode === "type" ? ";" : ""}\n\n`;
    } else {
      output += `export ${mode} ${name} = ${tsType(schema)};\n\n`;
    }
  }
  return output.trim();
}

function parseDocument(input: string): Schema {
  const document = parseYaml(input);
  if (!document || typeof document !== "object") throw new Error("Input must be an OpenAPI JSON/YAML object.");
  const version = (document as Schema).openapi || (document as Schema).swagger;
  if (!version) throw new Error("Missing OpenAPI or Swagger version field.");
  if ((document as Schema).swagger) throw new Error("Swagger 2.x is not supported yet. Use an OpenAPI 3.x document.");
  if (!String(version).startsWith("3.")) throw new Error(`Unsupported OpenAPI version: ${version}`);
  return document as Schema;
}

export default function OpenapiToTsClient() {
  const [input, setInput] = useState(SAMPLE);
  const [mode, setMode] = useState<Mode>("interface");
  const result = useMemo(() => {
    if (!input.trim()) return { output: "// Paste an OpenAPI 3.x JSON or YAML document.", error: "" };
    try { return { output: generate(parseDocument(input), mode), error: "" }; }
    catch (error) { return { output: "", error: error instanceof Error ? error.message : "Unable to parse document" }; }
  }, [input, mode]);
  const stats = <div className="space-y-1 text-xs font-mono"><div className="flex justify-between border-b border-border-subtle/50 py-1"><span className="text-text-muted">Input</span><b className="text-accent">{input.length} chars</b></div><div className="flex justify-between py-1"><span className="text-text-muted">Parser</span><b className="text-success">JSON + YAML</b></div></div>;

  return <ToolLayout toolId="openapi-to-ts" stats={stats}><div className="space-y-4 font-mono"><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-text-muted">OpenAPI 3.x schema converter</span><div className="flex gap-1">{(["interface", "type", "zod"] as const).map((item) => <button key={item} type="button" onClick={() => setMode(item)} className={`rounded border px-3 py-1 text-xs ${mode === item ? "border-accent bg-accent-soft text-accent" : "border-border-subtle text-text-muted"}`}>{item === "zod" ? "Zod" : `TS ${item}`}</button>)}</div></div><div className="grid gap-4 lg:grid-cols-2"><Editor title="OpenAPI JSON / YAML" value={input} onChange={setInput} clear /><Editor title={`Generated ${mode}`} value={result.error ? `// ${result.error}` : result.output} readOnly copy /></div></div></ToolLayout>;
}

function Editor({ title, value, onChange, readOnly, clear, copy }: { title: string; value: string; onChange?: (value: string) => void; readOnly?: boolean; clear?: boolean; copy?: boolean }) {
  return <div className="flex flex-col space-y-3 rounded-xl border border-border-subtle bg-bg-card p-4"><div className="h-8 flex items-center justify-between text-xs"><b className="text-text-primary">{title}</b>{copy ? <CopyButton text={value} label="Copy" /> : clear ? <button type="button" onClick={() => onChange?.("")} className="text-text-muted hover:text-error">[Clear]</button> : null}</div><textarea value={value} onChange={(event) => onChange?.(event.target.value)} readOnly={readOnly} spellCheck={false} className="min-h-[440px] w-full resize-none rounded-lg border border-border-subtle bg-bg-page p-3 text-xs leading-relaxed text-text-primary focus:border-accent focus:outline-none" /></div>;
}
