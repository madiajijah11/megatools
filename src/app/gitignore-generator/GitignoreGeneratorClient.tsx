"use client";

import { useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type Preset = { category: string; rules: string[] };

const PRESETS: Record<string, Preset> = {
  "Next.js": { category: "Frameworks", rules: ["node_modules/", ".next/", "out/", ".env*", "*.log"] },
  React: { category: "Frameworks", rules: ["node_modules/", "build/", ".env*", "*.log"] },
  Node: { category: "Languages & runtimes", rules: ["node_modules/", ".env*", "*.log", "coverage/"] },
  Python: { category: "Languages & runtimes", rules: ["__pycache__/", "*.py[cod]", ".venv/", ".env", ".pytest_cache/", "*.egg-info/"] },
  Rust: { category: "Languages & runtimes", rules: ["target/", ".env"] },
  Go: { category: "Languages & runtimes", rules: ["bin/", "*.test", ".env"] },
  macOS: { category: "Operating systems", rules: [".DS_Store", ".AppleDouble", ".LSOverride"] },
  Windows: { category: "Operating systems", rules: ["Thumbs.db", "ehthumbs.db", "Desktop.ini"] },
  "VS Code": { category: "Editors", rules: [".vscode/*", "!.vscode/settings.json"] },
  JetBrains: { category: "Editors", rules: [".idea/", "*.iml", "*.iws"] },
  Docker: { category: "Containers", rules: ["*.log", ".env", ".docker/"] },
};

const PRESET_NAMES = Object.keys(PRESETS);
const CATEGORIES = [...new Set(PRESET_NAMES.map((name) => PRESETS[name].category))];

function cleanRules(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function isRule(line: string) {
  return !line.startsWith("#");
}

export default function GitignoreGeneratorClient() {
  const [selected, setSelected] = useState<string[]>(["Next.js"]);
  const [custom, setCustom] = useState("");
  const sections = useMemo(() => {
    const seen = new Set<string>();
    return [
      ...PRESET_NAMES.filter((name) => selected.includes(name)).map((name) => ({
        title: name,
        rules: PRESETS[name].rules.filter((rule) => {
          if (seen.has(rule)) return false;
          seen.add(rule);
          return true;
        }),
      })),
      ...(() => {
        const rules = cleanRules(custom).filter((rule) => {
          if (isRule(rule) && seen.has(rule)) return false;
          if (isRule(rule)) seen.add(rule);
          return true;
        });
        return rules.length ? [{ title: "Custom patterns", rules }] : [];
      })(),
    ];
  }, [custom, selected]);
  const output = useMemo(
    () => sections.map(({ title, rules }) => [`# ${title}`, ...rules].join("\n")).join("\n\n") + (sections.length ? "\n" : ""),
    [sections],
  );
  const ruleCount = sections.reduce((count, section) => count + section.rules.filter(isRule).length, 0);
  const download = () => {
    const url = URL.createObjectURL(new Blob([output], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = ".gitignore";
    link.click();
    URL.revokeObjectURL(url);
  };
  const toggle = (name: string) => setSelected((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  const stats = <div className="text-xs font-mono space-y-1"><div className="flex justify-between"><span className="text-text-muted">Active rules</span><b className="text-accent">{ruleCount}</b></div><div className="flex justify-between"><span className="text-text-muted">Presets</span><b className="text-accent">{selected.length}</b></div><div className="flex justify-between"><span className="text-text-muted">Execution</span><b className="text-success">100% Client-Side</b></div></div>;

  return <ToolLayout toolId="gitignore-generator" stats={stats}>
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between gap-3"><p className="text-xs text-text-muted">Select presets to compose a clean, project-ready .gitignore.</p><button onClick={() => { setSelected([]); setCustom(""); }} className="btn-secondary text-xs">Reset</button></div>
      <div className="space-y-3">{CATEGORIES.map((category) => <div key={category}><div className="mb-2 text-[10px] uppercase tracking-wider text-text-muted">{category}</div><div className="flex flex-wrap gap-2">{PRESET_NAMES.filter((name) => PRESETS[name].category === category).map((name) => { const active = selected.includes(name); const count = PRESETS[name].rules.filter(isRule).length; return <button key={name} onClick={() => toggle(name)} aria-pressed={active} className={`rounded border px-3 py-1 text-xs ${active ? "border-accent bg-accent-soft text-accent" : "border-border-subtle text-text-muted"}`}>{name} <span className="opacity-60">({count})</span></button>; })}</div></div>)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-3"><div className="h-8 flex items-center justify-between text-xs"><b>Custom patterns</b><span className="text-text-muted">Optional</span></div><textarea value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="# Project-specific rules\nsecrets/" className="min-h-48 w-full resize-y rounded border border-border-subtle bg-bg-page p-3 text-xs text-text-primary outline-none focus:border-accent" spellCheck={false} /></div><div className="rounded-xl border border-border-subtle bg-bg-card p-4 space-y-3"><div className="h-8 flex items-center justify-between text-xs"><b>Generated .gitignore</b><div className="flex gap-2"><button onClick={download} disabled={!output} className="btn-secondary text-xs disabled:opacity-50">Download</button><CopyButton text={output} label="Copy" className="btn-secondary text-xs" /></div></div><textarea readOnly value={output} className="min-h-48 w-full resize-y rounded border border-border-subtle bg-bg-page p-3 text-xs text-text-primary outline-none" aria-label="Generated .gitignore" /></div></div>
    </div>
  </ToolLayout>;
}
