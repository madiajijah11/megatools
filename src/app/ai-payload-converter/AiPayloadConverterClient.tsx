"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

type TargetProvider = "openai" | "anthropic" | "gemini" | "ollama" | "vercel-ai" | "python";

export default function AiPayloadConverterClient() {
  const [systemPrompt, setSystemPrompt] = useState<string>(
    "You are a Senior Cyber Security Researcher. Analyze code vulnerabilities and provide remediation."
  );
  const [userPrompt, setUserPrompt] = useState<string>(
    "Audit this Solidity function for reentrancy vulnerabilities:\n\nfunction withdraw() public {\n  (bool s, ) = msg.sender.call{value: balances[msg.sender]}(\"\");\n  balances[msg.sender] = 0;\n}"
  );
  const [modelName, setModelName] = useState<string>("gpt-4o");
  const [temperature, setTemperature] = useState<number>(0.7);
  const [maxTokens, setMaxTokens] = useState<number>(4096);
  const [jsonMode, setJsonMode] = useState<boolean>(false);
  const [target, setTarget] = useState<TargetProvider>("openai");
  const outputCode = useMemo(() => {
    switch (target) {
      case "openai": {
        const payload = {
          model: modelName || "gpt-4o",
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
        };
        return JSON.stringify(payload, null, 2);
      }

      case "anthropic": {
        const payload = {
          model: modelName.startsWith("claude") ? modelName : "claude-3-7-sonnet-20250219",
          max_tokens: maxTokens,
          temperature,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages: [{ role: "user", content: userPrompt }],
        };
        return JSON.stringify(payload, null, 2);
      }

      case "gemini": {
        const payload = {
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          ...(systemPrompt
            ? {
                systemInstruction: {
                  parts: [{ text: systemPrompt }],
                },
              }
            : {}),
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(jsonMode ? { responseMimeType: "application/json" } : {}),
          },
        };
        return JSON.stringify(payload, null, 2);
      }

      case "ollama": {
        const payload = {
          model: modelName.includes(":") ? modelName : "deepseek-r1:8b",
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: userPrompt },
          ],
          options: {
            temperature,
            num_predict: maxTokens,
          },
          stream: false,
        };
        return `curl http://localhost:11434/api/chat -d '${JSON.stringify(payload)}'`;
      }

      case "vercel-ai": {
        return `import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const result = streamText({
    model: openai('${modelName || "gpt-4o"}'),
    system: ${JSON.stringify(systemPrompt)},
    prompt: ${JSON.stringify(userPrompt)},
    temperature: ${temperature},
    maxTokens: ${maxTokens},
  });

  return result.toDataStreamResponse();
}`;
      }

      case "python": {
        return `import requests

url = "https://api.openai.com/v1/chat/completions"
headers = {
    "Authorization": "Bearer $OPENAI_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "model": "${modelName || "gpt-4o"}",
    "messages": [
        {"role": "system", "content": ${JSON.stringify(systemPrompt)}},
        {"role": "user", "content": ${JSON.stringify(userPrompt)}}
    ],
    "temperature": ${temperature},
    "max_tokens": ${maxTokens}
}

response = requests.post(url, headers=headers, json=payload)
print(response.json()["choices"][0]["message"]["content"])`;
      }

      default:
        return "";
    }
  }, [target, systemPrompt, userPrompt, modelName, temperature, maxTokens, jsonMode]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Target Format</p>
        <p className="text-accent font-mono text-xs font-bold uppercase">{target}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">JSON Mode</p>
        <p className="text-text-primary font-mono text-xs">{jsonMode ? "ENABLED" : "OFF"}</p>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="ai-payload-converter" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-4 font-mono">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Inputs & Parameters */}
            <div className="space-y-4">
              <div>
                <div className="h-8 flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                    System Prompt:
                  </label>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are an AI assistant..."
                  rows={3}
                  className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div>
                <div className="h-8 flex items-center justify-between mb-1">
                  <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                    User Prompt / Message:
                  </label>
                </div>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Enter user prompt here..."
                  rows={4}
                  className="w-full p-2.5 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">Model Name:</label>
                  <input
                    type="text"
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full p-2 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">Temperature ({temperature}):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-text-muted block mb-1">Max Tokens:</label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 font-mono text-xs text-text-secondary">
                <input
                  type="checkbox"
                  id="jsonMode"
                  checked={jsonMode}
                  onChange={(e) => setJsonMode(e.target.checked)}
                  className="rounded border-border-subtle text-accent focus:ring-accent"
                />
                <label htmlFor="jsonMode" className="cursor-pointer">
                  Enforce JSON Mode (Structured Output)
                </label>
              </div>
            </div>

            {/* Right: Output Payload */}
            <div className="flex flex-col space-y-2">
              <div className="h-8 flex flex-wrap items-center justify-between gap-1">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  Generated Payload / SDK:
                </label>
                <CopyButton
                  text={outputCode}
                  className="text-xs font-mono px-2 py-1 rounded border border-border-subtle/80 bg-bg-page/80 text-text-primary hover:border-accent/50 hover:bg-accent-soft transition-colors cursor-pointer"
                />
              </div>

              {/* Target Format Tabs */}
              <div className="flex flex-wrap gap-1 font-mono text-xs">
                {(
                  [
                    { id: "openai", label: "OpenAI / DeepSeek" },
                    { id: "anthropic", label: "Anthropic Claude" },
                    { id: "gemini", label: "Google Gemini" },
                    { id: "ollama", label: "Ollama cURL" },
                    { id: "vercel-ai", label: "Vercel AI SDK" },
                    { id: "python", label: "Python Requests" },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTarget(t.id)}
                    className={`px-2 py-1 rounded transition-colors ${
                      target === t.id
                        ? "bg-accent text-bg-page font-bold"
                        : "border border-border-subtle bg-bg-page/60 text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="relative rounded-xl bg-bg-page border border-border-subtle p-3.5 font-mono text-xs text-accent overflow-x-auto h-[320px] overflow-y-auto select-all">
                <pre className="whitespace-pre">{outputCode}</pre>
              </div>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}