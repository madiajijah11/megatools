"use client";

import ToolLayout from "@/components/ToolLayout";

import { useState, useEffect, useCallback, useMemo } from "react";
import CopyButton from "@/components/CopyButton";

interface IceCandidateItem {
  id: string;
  ip: string;
  port: number;
  type: "host" | "srflx" | "relay" | "prflx" | "unknown";
  protocol: string;
  isIpv6: boolean;
  isMdns: boolean;
  raw: string;
}

interface HttpIpInfo {
  ip: string;
  loading: boolean;
  error?: string;
}

type LeakStatus = "analyzing" | "shielded" | "secure_tunnel" | "leaked" | "blocked";
function parseCandidate(candidateStr: string): IceCandidateItem | null {
  if (!candidateStr) return null;
  const parts = candidateStr.split(" ");
  if (parts.length < 8) return null;

  const ip = parts[4] || "";
  const port = parseInt(parts[5], 10) || 0;
  const protocol = parts[2]?.toUpperCase() || "UDP";
  const typeIndex = parts.indexOf("typ");
  const rawType = typeIndex !== -1 && parts[typeIndex + 1] ? parts[typeIndex + 1] : "unknown";

  const isMdns = ip.endsWith(".local") || ip.includes("-");
  const isIpv6 = ip.includes(":") && !isMdns;

  return {
    id: candidateStr,
    ip,
    port,
    type: (rawType as IceCandidateItem["type"]),
    protocol,
    isIpv6,
    isMdns,
    raw: candidateStr,
  };
}
export default function WebRTCLeakClient() {
  const [candidates, setCandidates] = useState<IceCandidateItem[]>([]);
  const [probing, setProbing] = useState<boolean>(true);
  const [webrtcSupported, setWebrtcSupported] = useState<boolean>(true);
  const [httpIp, setHttpIp] = useState<HttpIpInfo>({ ip: "", loading: true });
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  // Probe WebRTC ICE Gathering
  const probeWebRTC = useCallback(() => {
    setProbing(true);
    setCandidates([]);

    if (typeof window === "undefined" || !window.RTCPeerConnection) {
      setWebrtcSupported(false);
      setProbing(false);
      return;
    }

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });

      pc.createDataChannel("megatools-leak-probe");

      pc.onicecandidate = (event) => {
        if (event.candidate && event.candidate.candidate) {
          const parsed = parseCandidate(event.candidate.candidate);
          if (parsed) {
            setCandidates((prev) => {
              if (prev.some((c) => c.ip === parsed.ip && c.port === parsed.port)) {
                return prev;
              }
              return [...prev, parsed];
            });
          }
        } else if (!event.candidate) {
          // ICE gathering completed
          setProbing(false);
        }
      };

      pc.onicecandidateerror = () => {
        // Gathering error / blocked by extension
      };

      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .catch(() => {
          setProbing(false);
        });

      // Timeout safety
      setTimeout(() => {
        if (pc.iceGatheringState !== "complete") {
          setProbing(false);
        }
      }, 5000);
    } catch {
      setWebrtcSupported(false);
      setProbing(false);
    }
  }, []);

  // Fetch Public IP via standard HTTP
  const fetchHttpIp = useCallback(async () => {
    setHttpIp({ ip: "", loading: true });
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      setHttpIp({ ip: data.ip || "", loading: false });
    } catch (err: unknown) {
      setHttpIp({
        ip: "",
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch HTTP IP",
      });
    }
  }, []);

  useEffect(() => {
    probeWebRTC();
    fetchHttpIp();
  }, [probeWebRTC, fetchHttpIp]);

  // Evaluate Leak Status
  const leakAnalysis = useMemo(() => {
    if (!webrtcSupported) {
      return {
        status: "blocked" as LeakStatus,
        title: "WEBRTC BLOCKED / DISABLED",
        desc: "WebRTC is entirely disabled in this browser. Maximum anti-leak protection.",
        color: "text-success border-success/40 bg-success/10",
      };
    }

    if (probing || httpIp.loading) {
      return {
        status: "analyzing" as LeakStatus,
        title: "ANALYZING ICE STREAMS...",
        desc: "Probing Google STUN servers and comparing candidates with HTTP egress...",
        color: "text-accent border-accent/40 bg-accent-soft",
      };
    }

    const publicCandidates = candidates.filter((c) => c.type === "srflx" && !c.isMdns);
    const hostCandidates = candidates.filter((c) => c.type === "host");

    // Has public WebRTC IP different from HTTP egress IP -> LEAK!
    if (httpIp.ip && publicCandidates.some((c) => c.ip !== httpIp.ip)) {
      return {
        status: "leaked" as LeakStatus,
        title: "CRITICAL: IP LEAK DETECTED",
        desc: "WebRTC public IP does not match your HTTP browser egress. Your real IP is bypassing your VPN tunnel!",
        color: "text-error border-error/40 bg-error/10",
      };
    }

    // Has public WebRTC IP matching HTTP egress IP
    if (httpIp.ip && publicCandidates.some((c) => c.ip === httpIp.ip)) {
      return {
        status: "secure_tunnel" as LeakStatus,
        title: "WEBRTC TUNNELED (NORMAL)",
        desc: "WebRTC is active but resolves to the same public IP as your web traffic.",
        color: "text-text-primary border-border-subtle bg-bg-card",
      };
    }

    // Only mDNS candidates (modern Chrome/Safari default)
    if (hostCandidates.every((c) => c.isMdns) && publicCandidates.length === 0) {
      return {
        status: "shielded" as LeakStatus,
        title: "SHIELDED (mDNS ANONYMIZED)",
        desc: "Browser concealed local LAN IPs behind randomized mDNS strings. No public STUN leak detected.",
        color: "text-success border-success/40 bg-success/10",
      };
    }

    return {
      status: "shielded" as LeakStatus,
      title: "SHIELDED",
      desc: "No public STUN IP leaks detected during this diagnostic session.",
      color: "text-success border-success/40 bg-success/10",
    };
  }, [webrtcSupported, probing, httpIp, candidates]);

  const stats = (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">WebRTC API:</span>
        <span className={"font-bold " + (webrtcSupported ? "text-accent" : "text-error")}>
          {webrtcSupported ? "AVAILABLE" : "DISABLED"}
        </span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">ICE Candidates:</span>
        <span className="text-text-primary font-bold">{candidates.length} Discovered</span>
      </div>
      <div className="flex justify-between items-center py-1 border-b border-border-subtle">
        <span className="text-text-muted">STUN Server:</span>
        <span className="text-text-primary font-bold">Google (19302)</span>
      </div>
      <div className="flex justify-between items-center py-1">
        <span className="text-text-muted">Verdict:</span>
        <span className={"font-bold " + (leakAnalysis.status === "leaked" ? "text-error" : "text-success")}>
          {leakAnalysis.status.toUpperCase()}
        </span>
      </div>
    </div>
  );
return (
    <ToolLayout toolId="webrtc-leak" stats={stats}>
      <div className="space-y-4 font-mono">
        {/* Status Alert Banner */}
          <div className={"p-5 rounded-lg border font-mono " + leakAnalysis.color}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                <span className="text-sm sm:text-base font-bold tracking-wide">
                  {leakAnalysis.title}
                </span>
              </div>
              <span className="text-[11px] uppercase opacity-80">
                [STATE: {leakAnalysis.status}]
              </span>
            </div>
            <p className="text-xs mt-2 text-text-primary/90 leading-relaxed">
              {leakAnalysis.desc}
            </p>
          </div>

          {/* Comparison Cards: HTTP IP vs WebRTC Public IP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: HTTP IP */}
            <div className="p-4 rounded-lg border border-border-subtle bg-bg-card font-mono">
              <div className="h-8 flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="text-accent">&gt;</span> HTTP BROWSER EGRESS
                </span>
                {httpIp.ip && <CopyButton text={httpIp.ip} label="copy" />}
              </div>
              <div className="p-3 rounded bg-bg-page border border-border-subtle">
                <span className="text-[10px] text-text-muted block">Public IP (Standard Web):</span>
                <span className="text-sm sm:text-base font-bold text-text-primary break-all">
                  {httpIp.loading ? "Querying ipify..." : httpIp.ip || (httpIp.error ? "Error querying" : "Unknown")}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                IP address visible to standard websites via HTTPS requests.
              </p>
            </div>

            {/* Card 2: WebRTC Public IP */}
            <div className="p-4 rounded-lg border border-border-subtle bg-bg-card font-mono">
              <div className="h-8 flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                  <span className="text-accent">&gt;</span> WEBRTC STUN RESOLUTION
                </span>
                {candidates.find((c) => c.type === "srflx")?.ip && (
                  <CopyButton
                    text={candidates.find((c) => c.type === "srflx")?.ip || ""}
                    label="copy"
                  />
                )}
              </div>
              <div className="p-3 rounded bg-bg-page border border-border-subtle">
                <span className="text-[10px] text-text-muted block">WebRTC Public (srflx):</span>
                <span className="text-sm sm:text-base font-bold text-text-primary break-all">
                  {probing
                    ? "Gathering ICE candidates..."
                    : candidates.find((c) => c.type === "srflx")?.ip || "None (Shielded / Blocked)"}
                </span>
              </div>
              <p className="text-[11px] text-text-muted mt-2">
                Public address returned directly by Google STUN server.
              </p>
            </div>
          </div>

          {/* Detailed ICE Candidates Table */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 font-mono">
            <div className="h-8 flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-text-primary flex items-center gap-1.5">
                <span className="text-accent">&gt;</span> DISCOVERED ICE CANDIDATES ({candidates.length})
              </span>
              <span className="text-[11px] text-text-muted">
                {probing ? "Probing active..." : "Gathering complete"}
              </span>
            </div>

            {candidates.length === 0 ? (
              <div className="p-6 rounded bg-bg-page border border-border-subtle text-center text-xs text-text-muted">
                {probing
                  ? "Initiating RTCPeerConnection and collecting SDP candidates..."
                  : "No ICE candidates exposed. Your browser blocked or anonymized STUN queries."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-muted text-[11px]">
                      <th className="py-2 px-2.5">Type</th>
                      <th className="py-2 px-2.5">IP Address / Identifier</th>
                      <th className="py-2 px-2.5">Port</th>
                      <th className="py-2 px-2.5">Protocol</th>
                      <th className="py-2 px-2.5">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle/50">
                    {candidates.map((c, idx) => (
                      <tr key={idx} className="hover:bg-bg-page/50 transition-colors">
                        <td className="py-2 px-2.5">
                          <span
                            className={"text-[10px] font-bold px-1.5 py-0.5 rounded " + (
                              c.type === "srflx"
                                ? "bg-accent-soft text-accent border border-accent/30"
                                : c.isMdns
                                ? "bg-success/15 text-success border border-success/30"
                                : "bg-warning/15 text-warning border border-warning/30"
                            )}
                          >
                            {c.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-text-primary font-bold break-all">
                          {c.ip}
                          {c.isMdns && (
                            <span className="ml-1.5 text-[10px] text-text-muted font-normal">
                              (mDNS)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2.5 text-text-secondary">{c.port}</td>
                        <td className="py-2 px-2.5 text-text-muted">{c.protocol}</td>
                        <td className="py-2 px-2.5">
                          {c.type === "srflx" ? (
                            c.ip === httpIp.ip ? (
                              <span className="text-text-secondary text-[10px]">Tunneled</span>
                            ) : (
                              <span className="text-error font-bold text-[10px]">LEAKED!</span>
                            )
                          ) : c.isMdns ? (
                            <span className="text-success text-[10px]">Anonymized</span>
                          ) : (
                            <span className="text-warning text-[10px]">LAN Exposed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Browser Remediation Guides */}
          <div className="rounded-lg border border-border-subtle bg-bg-card p-4 font-mono text-xs space-y-3">
            <span className="font-semibold text-text-primary block">
              How to Disable WebRTC Leaks in Your Browser:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded bg-bg-page border border-border-subtle space-y-1">
                <span className="font-bold text-accent block">Firefox (Native)</span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Go to <code className="text-text-primary">about:config</code>, search for <code className="text-text-primary">media.peerconnection.enabled</code> and toggle to <code className="text-error">false</code>.
                </p>
              </div>
              <div className="p-3 rounded bg-bg-page border border-border-subtle space-y-1">
                <span className="font-bold text-accent block">Brave Browser</span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Settings → Privacy & Security → WebRTC IP Handling Policy → set to <code className="text-success">Disable Non-Proxied UDP</code>.
                </p>
              </div>
              <div className="p-3 rounded bg-bg-page border border-border-subtle space-y-1">
                <span className="font-bold text-accent block">Chrome / Edge</span>
                <p className="text-text-muted text-[11px] leading-relaxed">
                  Install extensions like <span className="text-text-primary">WebRTC Leak Prevent</span> or <span className="text-text-primary">uBlock Origin</span> with WebRTC IP masking enabled.
                </p>
              </div>
            </div>
          </div>
      </div>
    </ToolLayout>
  );
}