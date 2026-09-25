"use client";

import { useState, useMemo } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface ColumnDef {
  name: string;
  rawType: string;
  tsType: string;
  zodType: string;
  isNullable: boolean;
  isPrimary: boolean;
}

interface TableDef {
  name: string;
  interfaceName: string;
  columns: ColumnDef[];
}

function toPascalCase(str: string): string {
  let clean = str.replace(/["`']/g, "");
  if (clean.endsWith("s") && !clean.endsWith("ss")) {
    clean = clean.slice(0, -1);
  }
  return clean
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function mapSqlType(sqlType: string): { ts: string; zod: string } {
  const clean = sqlType.toLowerCase().trim();

  if (/^(bigserial|serial|int|integer|smallint|tinyint|mediumint)/.test(clean)) {
    return { ts: "number", zod: "z.number()" };
  }
  if (/^bigint/.test(clean)) {
    return { ts: "bigint", zod: "z.bigint()" };
  }
  if (/^(float|real|double|decimal|numeric)/.test(clean)) {
    return { ts: "number", zod: "z.number()" };
  }
  if (/^(bool|boolean)/.test(clean)) {
    return { ts: "boolean", zod: "z.boolean()" };
  }
  if (/^(uuid)/.test(clean)) {
    return { ts: "string", zod: "z.string().uuid()" };
  }
  if (/^(varchar|char|text|citext|tinytext|mediumtext|longtext|enum)/.test(clean)) {
    return { ts: "string", zod: "z.string()" };
  }
  if (/^(timestamp|timestamptz|datetime|date|time)/.test(clean)) {
    return { ts: "Date", zod: "z.date()" };
  }
  if (/^(json|jsonb)/.test(clean)) {
    return { ts: "Record<string, unknown>", zod: "z.record(z.string(), z.unknown())" };
  }
  if (/^(bytea|blob|binary|varbinary)/.test(clean)) {
    return { ts: "Uint8Array", zod: "z.instanceof(Uint8Array)" };
  }
  if (clean.endsWith("[]")) {
    const base = clean.slice(0, -2);
    const mappedBase = mapSqlType(base);
    return { ts: `${mappedBase.ts}[]`, zod: `z.array(${mappedBase.zod})` };
  }

  return { ts: "unknown", zod: "z.unknown()" };
}

function parseSqlDdl(sql: string): TableDef[] {
  const tables: TableDef[] = [];

  const cleanedSql = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:([a-zA-Z0-9_"`]+)\.)?([a-zA-Z0-9_"`]+)\s*\(([\s\S]*?)\);/gi;
  let match: RegExpExecArray | null;

  while ((match = tableRegex.exec(cleanedSql)) !== null) {
    const rawTableName = match[2].replace(/["`']/g, "");
    const body = match[3];

    const lines: string[] = [];
    let current = "";
    let parenDepth = 0;

    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (char === "(") parenDepth++;
      else if (char === ")") parenDepth--;

      if (char === "," && parenDepth === 0) {
        if (current.trim()) lines.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    if (current.trim()) lines.push(current.trim());

    const columns: ColumnDef[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (
        /^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK|KEY|INDEX)\b/i.test(trimmed)
      ) {
        continue;
      }

      const colMatch = trimmed.match(/^([a-zA-Z0-9_"`]+)\s+([a-zA-Z0-9_()]+)(\[\])?([\s\S]*)$/i);
      if (colMatch) {
        const colName = colMatch[1].replace(/["`']/g, "");
        const colType = colMatch[2] + (colMatch[3] || "");
        const modifiers = (colMatch[4] || "").toUpperCase();

        const isPrimary = modifiers.includes("PRIMARY KEY") || /serial/i.test(colType);
        const isNotNull = modifiers.includes("NOT NULL") || isPrimary;
        const isNullable = !isNotNull;

        const mapped = mapSqlType(colType);

        columns.push({
          name: colName,
          rawType: colType,
          tsType: mapped.ts,
          zodType: mapped.zod,
          isNullable,
          isPrimary,
        });
      }
    }

    if (columns.length > 0) {
      tables.push({
        name: rawTableName,
        interfaceName: toPascalCase(rawTableName),
        columns,
      });
    }
  }

  return tables;
}

const PRESETS = [
  {
    name: "E-Commerce",
    sql: `CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id INT NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(32) NOT NULL,
  tags TEXT[],
  placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);`,
  },
  {
    name: "Auth & Sessions",
    sql: `CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  provider VARCHAR(64) NOT NULL,
  provider_account_id VARCHAR(128) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INT,
  token_type VARCHAR(32)
);

CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL
);`,
  },
  {
    name: "Blog & Content",
    sql: `CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(200) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  published BOOLEAN DEFAULT FALSE NOT NULL,
  view_count INT DEFAULT 0 NOT NULL,
  author_id INT NOT NULL,
  published_at TIMESTAMP
);

CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  article_id INT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);`,
  },
];

export default function SqlToTsClient() {
  const [sqlInput, setSqlInput] = useState(PRESETS[0].sql);
  const [outputMode, setOutputMode] = useState<"interface" | "type" | "zod">("interface");
  const [casing, setCasing] = useState<"preserve" | "camel">("preserve");
  const [nullableStyle, setNullableStyle] = useState<"union" | "optional">("union");

  const tables = useMemo(() => parseSqlDdl(sqlInput), [sqlInput]);

  const generatedCode = useMemo(() => {
    if (tables.length === 0) {
      return "// No valid CREATE TABLE statements detected.\n// Please check SQL syntax and ensure statements end with semicolon ';'.";
    }

    if (outputMode === "zod") {
      let code = 'import { z } from "zod";\n\n';

      for (const t of tables) {
        const schemaName = toCamelCase(t.name) + "Schema";
        code += `export const ${schemaName} = z.object({\n`;
        for (const col of t.columns) {
          const propName = casing === "camel" ? toCamelCase(col.name) : col.name;
          let zodDef = col.zodType;
          if (col.isNullable) {
            zodDef += nullableStyle === "optional" ? ".optional()" : ".nullable()";
          }
          code += `  ${propName}: ${zodDef},\n`;
        }
        code += "});\n\n";
        code += `export type ${t.interfaceName} = z.infer<typeof ${schemaName}>;\n\n`;
      }
      return code.trim();
    }

    let code = "";
    for (const t of tables) {
      if (outputMode === "interface") {
        code += `export interface ${t.interfaceName} {\n`;
      } else {
        code += `export type ${t.interfaceName} = {\n`;
      }

      for (const col of t.columns) {
        const propName = casing === "camel" ? toCamelCase(col.name) : col.name;
        let typeStr = col.tsType;
        let optSign = "";

        if (col.isNullable) {
          if (nullableStyle === "optional") {
            optSign = "?";
          } else {
            typeStr += " | null";
          }
        }

        code += `  ${propName}${optSign}: ${typeStr};\n`;
      }

      code += "}\n\n";
    }

    return code.trim();
  }, [tables, outputMode, casing, nullableStyle]);

  const totalCols = tables.reduce((acc, t) => acc + t.columns.length, 0);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Detected Tables:</span>
        <span className="text-accent font-bold">{tables.length}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Total Columns:</span>
        <span className="text-text-primary font-bold">{totalCols}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Format:</span>
        <span className="text-success font-bold uppercase">{outputMode}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Execution:</span>
        <span className="text-success font-bold">100% Client-Side</span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="sql-to-ts" stats={stats}>
      <div className="space-y-6 font-mono">
        {/* Presets & Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-text-muted">Schema Presets:</span>
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setSqlInput(p.sql)}
                className="text-xs px-2.5 py-1 rounded border border-border-subtle bg-bg-card hover:border-accent hover:text-accent transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>

          {/* Parsed Tables Pills */}
          {tables.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-text-muted">Parsed:</span>
              {tables.map((t) => (
                <span
                  key={t.name}
                  className="px-2 py-0.5 rounded bg-bg-card border border-border-subtle text-accent font-semibold"
                >
                  {t.name} ({t.columns.length} cols)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Global Configuration Controls Card */}
        <div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-3 text-xs">
          <div className="text-text-primary font-semibold border-b border-border-subtle/50 pb-2 flex items-center justify-between">
            <span className="text-accent">Output Generation Settings</span>
            <span className="text-text-muted text-[11px]">Choose target schema and naming style</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Target Output Format */}
            <div className="space-y-1.5">
              <label className="text-text-muted text-[11px] font-semibold">Format:</label>
              <div className="flex items-center rounded-lg border border-border-subtle bg-bg-page p-1">
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
                    className={`flex-1 py-1 text-xs rounded transition-colors text-center ${
                      outputMode === tab.id
                        ? "bg-accent-soft text-accent font-bold"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Casing Style */}
            <div className="space-y-1.5">
              <label className="text-text-muted text-[11px] font-semibold">Property Casing:</label>
              <div className="flex items-center rounded-lg border border-border-subtle bg-bg-page p-1">
                <button
                  type="button"
                  onClick={() => setCasing("preserve")}
                  className={`flex-1 py-1 text-xs rounded transition-colors text-center ${
                    casing === "preserve"
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  snake_case
                </button>
                <button
                  type="button"
                  onClick={() => setCasing("camel")}
                  className={`flex-1 py-1 text-xs rounded transition-colors text-center ${
                    casing === "camel"
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  camelCase
                </button>
              </div>
            </div>

            {/* Nullable Style */}
            <div className="space-y-1.5">
              <label className="text-text-muted text-[11px] font-semibold">Nullable Fields:</label>
              <div className="flex items-center rounded-lg border border-border-subtle bg-bg-page p-1">
                <button
                  type="button"
                  onClick={() => setNullableStyle("union")}
                  className={`flex-1 py-1 text-xs rounded transition-colors text-center ${
                    nullableStyle === "union"
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  | null (Union)
                </button>
                <button
                  type="button"
                  onClick={() => setNullableStyle("optional")}
                  className={`flex-1 py-1 text-xs rounded transition-colors text-center ${
                    nullableStyle === "optional"
                      ? "bg-accent-soft text-accent font-bold"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                >
                  ?: (Optional)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Input & Output Editor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* SQL Input Panel */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 flex flex-col">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">SQL DDL (CREATE TABLE)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSqlInput("")}
                  className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
                >
                  [Clear]
                </button>
                <CopyButton text={sqlInput} label="Copy SQL" />
              </div>
            </div>

            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              placeholder="Paste PostgreSQL, MySQL, or SQLite CREATE TABLE statements here..."
              rows={18}
              className="w-full flex-1 min-h-[440px] rounded-lg border border-border-subtle bg-bg-page p-3.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:border-accent focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Generated Code Output Panel */}
          <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-3 flex flex-col">
            <div className="h-8 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-accent uppercase">
                  {outputMode === "zod" ? "Zod Schema" : `TS ${outputMode}`}
                </span>
                <span className="text-[11px] text-text-muted">
                  ({casing} · {nullableStyle === "optional" ? "optional" : "null union"})
                </span>
              </div>
              <CopyButton text={generatedCode} label="Copy Output" />
            </div>

            <textarea
              readOnly
              value={generatedCode}
              rows={18}
              className="w-full flex-1 min-h-[440px] rounded-lg border border-border-subtle bg-bg-page p-3.5 text-xs text-text-primary focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
