"use client";

import { useState, useMemo, useEffect } from "react";
import ToolLayout from "@/components/ToolLayout";
import CopyButton from "@/components/CopyButton";

interface ParsedUA {
  browser: { name: string; version: string; major: string };
  engine: { name: string; version: string };
  os: { name: string; version: string; platform: string };
  device: { type: "desktop" | "mobile" | "tablet" | "bot" | "tv" | "unknown"; model?: string };
  bot: { isBot: boolean; name?: string };
}

const PRESETS = {
  chromeWin: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  safariIos: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.88 Mobile Safari/537.36",
  macSafari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  gptBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  googleBot: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  claudeBot: "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +https://www.anthropic.com/claudebot)",
};

function parseUserAgentString(ua: string): ParsedUA {
  const lower = ua.toLowerCase();

  // 1. Bot check
  let isBot = false;
  let botName = undefined;
  const botList = [
    { pattern: "gptbot", name: "OpenAI GPTBot" },
    { pattern: "claudebot", name: "Anthropic ClaudeBot" },
    { pattern: "googlebot", name: "Googlebot" },
    { pattern: "bingbot", name: "Bingbot" },
    { pattern: "yandexbot", name: "YandexBot" },
    { pattern: "bytespider", name: "ByteDance ByteSpider" },
    { pattern: "twitterbot", name: "Twitterbot / X Bot" },
    { pattern: "facebookexternalhit", name: "Meta Facebook Crawler" },
    { pattern: "discordbot", name: "DiscordBot" },
    { pattern: "duckduckbot", name: "DuckDuckBot" },
  ];

  for (const b of botList) {
    if (lower.includes(b.pattern)) {
      isBot = true;
      botName = b.name;
      break;
    }
  }

  // 2. OS check
  let osName = "Unknown OS";
  let osVersion = "";
  let osPlatform = "Unknown";

  if (/windows nt 10.0/i.test(ua)) {
    osName = "Windows";
    osVersion = "10 / 11";
  } else if (/windows nt 6.3/i.test(ua)) {
    osName = "Windows";
    osVersion = "8.1";
  } else if (/windows nt 6.1/i.test(ua)) {
    osName = "Windows";
    osVersion = "7";
  } else if (/mac os x ([d_]+)/i.test(ua)) {
    osName = "macOS";
    const m = ua.match(/mac os x ([d_]+)/i);
    osVersion = m ? m[1].replace(/_/g, ".") : "";
  } else if (/android ([d.]+)/i.test(ua)) {
    osName = "Android";
    const m = ua.match(/android ([d.]+)/i);
    osVersion = m ? m[1] : "";
  } else if (/iphone os ([d_]+)/i.test(ua) || /ipad.*os ([d_]+)/i.test(ua)) {
    osName = "iOS";
    const m = ua.match(/(?:iphone|ipad|cpu).*os ([d_]+)/i);
    osVersion = m ? m[1].replace(/_/g, ".") : "";
  } else if (/linux/i.test(ua)) {
    osName = "Linux";
  } else if (/crkey|tizen|smart-tv/i.test(ua)) {
    osName = "Smart TV OS";
  }

  if (/x86_64|win64|x64|amd64/i.test(ua)) osPlatform = "x86_64 (64-bit)";
  else if (/arm64|aarch64/i.test(ua)) osPlatform = "ARM64";
  else if (/armv/i.test(ua)) osPlatform = "ARM";
  else if (/wow64/i.test(ua)) osPlatform = "x86 (32-bit on 64-bit)";

  // 3. Engine check
  let engineName = "Unknown";
  let engineVer = "";
  if (new RegExp("applewebkit/([\\d.]+)", "i").test(ua)) {
    engineName = /chrome|edg|opera|opr/i.test(ua) ? "Blink (WebKit fork)" : "WebKit";
    const m = ua.match(new RegExp("applewebkit/([\\d.]+)", "i"));
    engineVer = m ? m[1] : "";
  } else if (new RegExp("gecko/([\\d.]+)", "i").test(ua)) {
    engineName = "Gecko";
    const m = ua.match(new RegExp("rv:([\\d.]+)", "i"));
    engineVer = m ? m[1] : "";
  } else if (new RegExp("trident/([\\d.]+)", "i").test(ua)) {
    engineName = "Trident";
  }

  // 4. Browser check
  let bName = "Unknown Browser";
  let bVer = "";

  if (new RegExp("edg/([\\d.]+)", "i").test(ua)) {
    bName = "Microsoft Edge";
    const m = ua.match(new RegExp("edg/([\\d.]+)", "i"));
    bVer = m ? m[1] : "";
  } else if (new RegExp("(?:opr|opera)/([\\d.]+)", "i").test(ua)) {
    bName = "Opera";
    const m = ua.match(new RegExp("(?:opr|opera)/([\\d.]+)", "i"));
    bVer = m ? m[1] : "";
  } else if (new RegExp("chrome/([\\d.]+)", "i").test(ua)) {
    bName = "Google Chrome";
    const m = ua.match(new RegExp("chrome/([\\d.]+)", "i"));
    bVer = m ? m[1] : "";
  } else if (new RegExp("firefox/([\\d.]+)", "i").test(ua)) {
    bName = "Mozilla Firefox";
    const m = ua.match(new RegExp("firefox/([\\d.]+)", "i"));
    bVer = m ? m[1] : "";
  } else if (new RegExp("version/([\\d.]+).*safari", "i").test(ua)) {
    bName = "Apple Safari";
    const m = ua.match(new RegExp("version/([\\d.]+)", "i"));
    bVer = m ? m[1] : "";
  }

  const major = bVer.split(".")[0] || "";

  // 5. Device type
  let devType: ParsedUA["device"]["type"] = "desktop";
  if (isBot) devType = "bot";
  else if (/tablet|ipad/i.test(ua)) devType = "tablet";
  else if (/mobile|iphone|android.*mobile/i.test(ua)) devType = "mobile";
  else if (/smart-tv|crkey|googletv/i.test(ua)) devType = "tv";

  return {
    browser: { name: bName, version: bVer, major },
    engine: { name: engineName, version: engineVer },
    os: { name: osName, version: osVersion, platform: osPlatform },
    device: { type: devType },
    bot: { isBot, name: botName },
  };
}

export default function UserAgentParserClient() {
  const [uaInput, setUaInput] = useState<string>("");

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setUaInput(navigator.userAgent || PRESETS.chromeWin);
    }
  }, []);

  const parsed = useMemo(() => {
    return parseUserAgentString(uaInput || "");
  }, [uaInput]);

  const stats = (
    <div className="space-y-1 text-xs font-mono">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Browser:</span>
        <span className="text-accent font-bold">{parsed.browser.name} {parsed.browser.major}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Operating System:</span>
        <span className="text-text-primary">{parsed.os.name} {parsed.os.version}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Device Type:</span>
        <span className="text-success font-bold uppercase">{parsed.device.type}</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle/50">
        <span className="text-text-muted">Crawler Bot:</span>
        <span className={parsed.bot.isBot ? "text-warning font-bold" : "text-text-muted"}>
          {parsed.bot.isBot ? `YES (${parsed.bot.name})` : "NO"}
        </span>
      </div>
    </div>
  );

  return (
    <ToolLayout toolId="user-agent-parser" stats={stats}>
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4 sm:p-5 space-y-5 font-mono">
        {/* Presets Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border-subtle">
          <span className="text-xs text-text-muted">Sample User-Agents:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setUaInput(navigator.userAgent)}
              className="px-2.5 py-1 rounded bg-accent text-bg-page text-xs font-mono font-bold hover:bg-accent-hover transition-colors"
            >
              [My Browser UA]
            </button>
            <button
              type="button"
              onClick={() => setUaInput(PRESETS.safariIos)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent"
            >
              [iPhone 16 iOS]
            </button>
            <button
              type="button"
              onClick={() => setUaInput(PRESETS.chromeAndroid)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent"
            >
              [Galaxy Android]
            </button>
            <button
              type="button"
              onClick={() => setUaInput(PRESETS.gptBot)}
              className="px-2.5 py-1 rounded border border-border-subtle bg-bg-page text-xs font-mono text-text-secondary hover:border-accent hover:text-accent"
            >
              [OpenAI GPTBot]
            </button>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <div className="h-8 flex items-center justify-between text-xs">
            <span className="font-semibold text-text-primary">Raw User-Agent String</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUaInput("")}
                className="text-xs text-text-muted hover:text-error transition-colors px-2 py-0.5 rounded border border-border-subtle"
              >
                [Clear]
              </button>
              <CopyButton text={uaInput} label="Copy UA" />
            </div>
          </div>
          <textarea
            value={uaInput}
            onChange={(e) => setUaInput(e.target.value)}
            placeholder="Paste User-Agent header string to parse..."
            rows={3}
            className="w-full rounded-lg border border-border-subtle bg-bg-page p-3 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none resize-y leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Bot Alert Badge */}
        {parsed.bot.isBot && (
          <div className="p-3 rounded-lg border border-warning/30 bg-warning/10 text-xs text-warning flex items-center justify-between">
            <span className="font-bold">🤖 Search Engine / AI Crawler Bot Detected:</span>
            <span className="text-text-primary font-bold">{parsed.bot.name}</span>
          </div>
        )}

        {/* Breakdown Key-Value Cards */}
        <div className="pt-2 border-t border-border-subtle space-y-3 text-xs">
          <span className="font-semibold text-text-primary block">
            Parsed Device & Client Profile
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page space-y-1">
              <span className="text-text-muted text-[11px] block">Web Browser</span>
              <span className="font-bold text-accent text-sm block">
                {parsed.browser.name} {parsed.browser.version || ""}
              </span>
              <span className="text-text-muted text-[10px]">
                Major Release: v{parsed.browser.major || "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page space-y-1">
              <span className="text-text-muted text-[11px] block">Rendering Engine</span>
              <span className="font-bold text-cyan-300 text-sm block">
                {parsed.engine.name}
              </span>
              <span className="text-text-muted text-[10px]">
                Engine Build: {parsed.engine.version || "standard"}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page space-y-1">
              <span className="text-text-muted text-[11px] block">Operating System</span>
              <span className="font-bold text-text-primary text-sm block">
                {parsed.os.name} {parsed.os.version}
              </span>
              <span className="text-text-muted text-[10px]">
                CPU Arch: {parsed.os.platform}
              </span>
            </div>

            <div className="p-3.5 rounded-lg border border-border-subtle bg-bg-page space-y-1">
              <span className="text-text-muted text-[11px] block">Device Category</span>
              <span className="font-bold text-success text-sm block uppercase">
                {parsed.device.type}
              </span>
              <span className="text-text-muted text-[10px]">
                Form factor profile
              </span>
            </div>
          </div>

          {/* JSON Export */}
          <div className="pt-3 border-t border-border-subtle space-y-2">
            <div className="h-8 flex items-center justify-between text-xs">
              <span className="font-semibold text-text-primary">Parsed JSON Profile</span>
              <CopyButton text={JSON.stringify(parsed, null, 2)} label="Copy JSON" />
            </div>
            <pre className="p-3 rounded-lg border border-border-subtle bg-bg-page font-mono text-xs text-text-primary whitespace-pre-wrap break-all leading-relaxed">
              {JSON.stringify(parsed, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
