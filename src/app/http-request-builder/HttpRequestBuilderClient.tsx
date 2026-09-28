"use client";

import { useMemo, useState } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

type BodyMode = "none" | "json" | "raw" | "form";
type AuthMode = "none" | "bearer" | "basic" | "api-key";
type OutputMode = "curl" | "fetch" | "axios" | "python";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"];
const OUTPUTS: OutputMode[] = ["curl", "fetch", "axios", "python"];

function shellQuote(value: string) {
  return `'${value.replace(/'/g, "'\\''")}'`;
}
function jsQuote(value: string) {
  return JSON.stringify(value);
}
function pyQuote(value: string) {
  return JSON.stringify(value).replace(/\\u2028|\\u2029/g, "");
}

export default function HttpRequestBuilderClient() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("https://api.example.com/users");
  const [query, setQuery] = useState("page=1\nlimit=20");
  const [headers, setHeaders] = useState("Content-Type: application/json");
  const [bodyMode, setBodyMode] = useState<BodyMode>("none");
  const [body, setBody] = useState('{"hello":"world"}');
  const [authMode, setAuthMode] = useState<AuthMode>("none");
  const [authValue, setAuthValue] = useState("");
  const [authUser, setAuthUser] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authKeyName, setAuthKeyName] = useState("X-API-Key");
  const [outputMode, setOutputMode] = useState<OutputMode>("curl");

  const parsed = useMemo(() => {
    const errors: string[] = [];
    const pairs: Array<[string, string]> = [];
    headers.split(/\r?\n/).forEach((line, index) => {
      if (!line.trim()) return;
      const colon = line.indexOf(":");
      if (colon <= 0) { errors.push(`Header line ${index + 1} must use Name: value format.`); return; }
      const name = line.slice(0, colon).trim();
      const value = line.slice(colon + 1).trim();
      if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)) errors.push(`Header line ${index + 1} has an invalid name.`);
      if (/\r|\n/.test(value)) errors.push(`Header line ${index + 1} contains a newline.`);
      if (!value) errors.push(`Header line ${index + 1} is missing a value.`);
      pairs.push([name, value]);
    });
    const queryPairs: Array<[string, string]> = [];
    query.split(/\r?\n/).forEach((line, index) => {
      if (!line.trim()) return;
      const equal = line.indexOf("=");
      if (equal < 1) { errors.push(`Query line ${index + 1} must use key=value format.`); return; }
      queryPairs.push([line.slice(0, equal).trim(), line.slice(equal + 1).trim()]);
    });
    if (!url.trim()) errors.push("A URL is required.");
    else { try { const parsedUrl = new URL(url); if (!["http:", "https:"].includes(parsedUrl.protocol)) errors.push("URL must use http or https."); } catch { errors.push("Enter a valid URL."); } }
    if (bodyMode === "json" && body.trim()) { try { JSON.parse(body); } catch { errors.push("Body is not valid JSON."); } }
    if (authMode === "api-key" && !authKeyName.trim()) errors.push("API key header name is required.");
    const allHeaders = [...pairs];
    if (authMode === "bearer" && authValue) allHeaders.push(["Authorization", `Bearer ${authValue}`]);
    if (authMode === "basic" && (authUser || authPassword)) allHeaders.push(["Authorization", `Basic ${btoa(`${authUser}:${authPassword}`)}`]);
    if (authMode === "api-key" && authValue && authKeyName) allHeaders.push([authKeyName, authValue]);
    return { errors, pairs: allHeaders, queryPairs };
  }, [headers, query, url, bodyMode, body, authMode, authValue, authUser, authPassword, authKeyName]);

  const finalUrl = useMemo(() => {
    if (!url.trim() || !parsed.queryPairs.length) return url;
    const separator = url.includes("?") ? "&" : "?";
    return url + separator + parsed.queryPairs.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  }, [url, parsed.queryPairs]);
  const headerObject = Object.fromEntries(parsed.pairs);
  const hasBody = bodyMode !== "none" && method !== "GET" && method !== "HEAD";
  const output = useMemo(() => {
    const headerFlags = parsed.pairs.map(([key, value]) => ` -H ${shellQuote(`${key}: ${value}`)}`).join("");
    const bodyFlag = hasBody ? ` --data ${shellQuote(body)}` : "";
    if (outputMode === "curl") return `curl -X ${method} ${shellQuote(finalUrl)}${headerFlags}${bodyFlag}`;
    if (outputMode === "fetch") return `fetch(${jsQuote(finalUrl)}, {\n  method: ${jsQuote(method)},\n  headers: ${JSON.stringify(headerObject, null, 2)},${hasBody ? `\n  body: ${jsQuote(body)},` : ""}\n});`;
    if (outputMode === "axios") return `axios({\n  method: ${jsQuote(method)},\n  url: ${jsQuote(finalUrl)},\n  headers: ${JSON.stringify(headerObject, null, 2)},${hasBody ? `\n  data: ${jsQuote(body)},` : ""}\n});`;
    return `import requests\n\nresponse = requests.request(\n    ${pyQuote(method)},\n    ${pyQuote(finalUrl)},\n    headers=${JSON.stringify(headerObject, null, 4).replace(/"([^\"]+)":/g, "'$1':")},${hasBody ? `\n    data=${pyQuote(body)},` : ""}\n)`;
  }, [parsed.pairs, finalUrl, method, hasBody, body, outputMode, headerObject]);

  const stats = <div className="text-xs font-mono space-y-1"><div className="flex justify-between"><span className="text-text-muted">Method</span><b className="text-accent">{method}</b></div><div className="flex justify-between"><span className="text-text-muted">Headers</span><b className="text-text-primary">{parsed.pairs.length}</b></div><div className="flex justify-between"><span className="text-text-muted">Status</span><b className={parsed.errors.length ? "text-error" : "text-success"}>{parsed.errors.length ? `${parsed.errors.length} error(s)` : "Ready"}</b></div></div>;
  const inputClass = "w-full rounded border border-border-subtle bg-bg-page p-2 text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none";
  return <ToolLayout toolId="http-request-builder" stats={stats}><div className="grid gap-4 lg:grid-cols-2 font-mono">
    <section className="space-y-4 rounded-xl border border-border-subtle bg-bg-card p-4">
      <div className="h-8 flex items-center justify-between"><span className="text-xs text-text-secondary">REQUEST</span><span className="text-[10px] text-text-muted">client-side only · never sent</span></div>
      <div className="grid grid-cols-[100px_1fr] gap-2"><select aria-label="HTTP method" value={method} onChange={e => setMethod(e.target.value)} className={inputClass}>{METHODS.map(item => <option key={item}>{item}</option>)}</select><input aria-label="Request URL" value={url} onChange={e => setUrl(e.target.value)} className={inputClass} placeholder="https://example.com/path" /></div>
      <label className="block text-xs text-text-secondary">Query parameters <span className="text-text-muted">(one key=value per line)</span><textarea aria-label="Query parameters" value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} mt-1 h-20`} /></label>
      <label className="block text-xs text-text-secondary">Headers <span className="text-text-muted">(one Name: value per line)</span><textarea aria-label="Headers" value={headers} onChange={e => setHeaders(e.target.value)} className={`${inputClass} mt-1 h-24`} /></label>
      <div><label className="block text-xs text-text-secondary mb-1">Authentication</label><div className="flex gap-2"><select aria-label="Authentication type" value={authMode} onChange={e => setAuthMode(e.target.value as AuthMode)} className={inputClass}>{["none", "bearer", "basic", "api-key"].map(item => <option key={item} value={item}>{item === "none" ? "None" : item === "api-key" ? "API key" : item[0].toUpperCase() + item.slice(1)}</option>)}</select>{authMode === "basic" ? <><input aria-label="Username" value={authUser} onChange={e => setAuthUser(e.target.value)} placeholder="username" className={inputClass} /><input aria-label="Password" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="password" className={inputClass} /></> : authMode === "api-key" ? <><input aria-label="API key header name" value={authKeyName} onChange={e => setAuthKeyName(e.target.value)} className={inputClass} /><input aria-label="API key value" type="password" value={authValue} onChange={e => setAuthValue(e.target.value)} placeholder="key" className={inputClass} /></> : authMode === "bearer" ? <input aria-label="Bearer token" type="password" value={authValue} onChange={e => setAuthValue(e.target.value)} placeholder="token" className={inputClass} /> : null}</div></div>
      <div><label className="block text-xs text-text-secondary mb-1">Body</label><div className="flex gap-1 mb-2">{(["none", "json", "raw", "form"] as BodyMode[]).map(item => <button type="button" key={item} onClick={() => setBodyMode(item)} className={`rounded px-2 py-1 text-[11px] ${bodyMode === item ? "bg-accent text-bg-page" : "border border-border-subtle text-text-secondary"}`}>{item}</button>)}</div>{bodyMode !== "none" && <textarea aria-label="Request body" value={body} onChange={e => setBody(e.target.value)} className={`${inputClass} h-28`} />}</div>
    </section>
    <section className="space-y-3 rounded-xl border border-border-subtle bg-bg-card p-4"><div className="h-8 flex items-center justify-between"><span className="text-xs text-text-secondary">GENERATED CODE</span><CopyButton text={output} label="Copy" className="btn-secondary px-2 py-1 text-xs" /></div><div className="flex gap-1">{OUTPUTS.map(item => <button type="button" key={item} onClick={() => setOutputMode(item)} className={`rounded px-2 py-1 text-[11px] ${outputMode === item ? "bg-accent text-bg-page" : "border border-border-subtle text-text-secondary"}`}>{item}</button>)}</div>{parsed.errors.length > 0 && <div role="alert" className="space-y-1 rounded border border-error/40 bg-error/10 p-2 text-xs text-error">{parsed.errors.map(error => <div key={error}>! {error}</div>)}</div>}<pre className="min-h-64 overflow-auto whitespace-pre-wrap break-words rounded border border-border-subtle bg-bg-page p-3 text-xs leading-5 text-text-primary">{output}</pre><p className="text-[11px] text-text-muted">Preview only. This tool never makes a network request.</p></section>
  </div></ToolLayout>;
}
