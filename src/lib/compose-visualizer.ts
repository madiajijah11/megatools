import { load as yamlLoad, dump as yamlDump } from "js-yaml";

export type AuditSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type AuditCategory = "SECURITY" | "RELIABILITY" | "BEST_PRACTICE" | "RESOURCE";

export interface PortMapping {
  raw: string;
  hostIp?: string;
  hostPort?: string | number;
  containerPort: string | number;
  protocol?: string;
  isWildcard: boolean;
  isDangerousPort: boolean;
}

export interface VolumeMount {
  raw: string;
  source: string;
  target: string;
  type: "bind" | "volume" | "tmpfs";
  isReadOnly: boolean;
  isDockerSocket: boolean;
}

export interface ServiceInfo {
  name: string;
  image?: string;
  imageTag?: string;
  isLatestOrUnpinned: boolean;
  build?: string | { context?: string; dockerfile?: string };
  ports: PortMapping[];
  volumes: VolumeMount[];
  networks: string[];
  dependsOn: string[];
  environment: Record<string, string | null>;
  plainTextSecrets: string[];
  restart?: string;
  hasHealthcheck: boolean;
  privileged: boolean;
  hasResourceLimits: boolean;
  user?: string;
  isRunningAsRoot: boolean;
  readOnlyRootfs: boolean;
  networkMode?: string;
  pidMode?: string;
}

export interface ComposeAuditIssue {
  id: string;
  severity: AuditSeverity;
  category: AuditCategory;
  serviceName?: string;
  title: string;
  description: string;
  remediation: string;
  codeSnippet?: string;
}

export interface ComposeAnalysisResult {
  isValid: boolean;
  error?: string;
  topLevelVersion?: string;
  services: ServiceInfo[];
  networks: string[];
  volumes: string[];
  issues: ComposeAuditIssue[];
  securityScore: number; // 0 - 100
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  mermaidDiagram: string;
  stats: {
    serviceCount: number;
    exposedPortCount: number;
    wildcardPortCount: number;
    volumeCount: number;
    networkCount: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
}

// Sensitive database/backend ports that should not be exposed to 0.0.0.0
const SENSITIVE_PORTS: Record<number, string> = {
  5432: "PostgreSQL",
  3306: "MySQL / MariaDB",
  27017: "MongoDB",
  6379: "Redis",
  9200: "Elasticsearch",
  9300: "Elasticsearch Cluster",
  11211: "Memcached",
  5672: "RabbitMQ AMQP",
  15672: "RabbitMQ Mgmt",
  9092: "Apache Kafka",
  2379: "etcd",
  8500: "Consul",
  8086: "InfluxDB",
  2181: "ZooKeeper",
};

// Common secret/password environment variable patterns
const SECRET_ENV_REGEX = /(?:PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY|AUTH_KEY|ROOT_PASSWORD|PASSWD|CREDENTIALS|ACCESS_KEY)/i;

/**
 * Parses port mapping string or object into structured PortMapping
 */
export function parsePortEntry(entry: string | number | Record<string, unknown>): PortMapping {
  if (typeof entry === "number") {
    const isDangerous = !!SENSITIVE_PORTS[entry];
    return {
      raw: String(entry),
      containerPort: entry,
      hostPort: entry,
      isWildcard: true,
      isDangerousPort: isDangerous,
    };
  }

  if (typeof entry === "object" && entry !== null) {
    const target = (entry.target as number | string) || "";
    const published = (entry.published as number | string) || "";
    const host = (entry.host_ip as string) || "";
    const protocol = (entry.protocol as string) || "tcp";
    const isWildcard = !host || host === "0.0.0.0" || host === "::";
    const portNum = Number(target) || Number(published);
    return {
      raw: `${host ? host + ":" : ""}${published}:${target}/${protocol}`,
      hostIp: host || undefined,
      hostPort: published || undefined,
      containerPort: target,
      protocol,
      isWildcard,
      isDangerousPort: !!SENSITIVE_PORTS[portNum],
    };
  }

  const str = String(entry).trim();
  // Formats:
  // - "80" (just container port)
  // - "80:80" (host:container)
  // - "127.0.0.1:80:80" (ip:host:container)
  // - "127.0.0.1:80:80/udp"
  const parts = str.split(":");
  let hostIp: string | undefined;
  let hostPort: string | undefined;
  let containerPortStr = "";
  let protocol: string | undefined;

  if (parts.length === 1) {
    containerPortStr = parts[0];
  } else if (parts.length === 2) {
    hostPort = parts[0];
    containerPortStr = parts[1];
  } else if (parts.length >= 3) {
    hostIp = parts[0];
    hostPort = parts[1];
    containerPortStr = parts.slice(2).join(":");
  }

  if (containerPortStr.includes("/")) {
    const slashParts = containerPortStr.split("/");
    containerPortStr = slashParts[0];
    protocol = slashParts[1];
  }

  const isWildcard = !hostIp || hostIp === "0.0.0.0" || hostIp === "::";
  const num = parseInt(containerPortStr, 10);
  const isDangerousPort = !isNaN(num) && !!SENSITIVE_PORTS[num];

  return {
    raw: str,
    hostIp,
    hostPort,
    containerPort: containerPortStr,
    protocol,
    isWildcard,
    isDangerousPort,
  };
}

/**
 * Parses volume declaration into structured VolumeMount
 */
export function parseVolumeEntry(entry: string | Record<string, unknown>): VolumeMount {
  if (typeof entry === "object" && entry !== null) {
    const source = (entry.source as string) || "";
    const target = (entry.target as string) || "";
    const type = (entry.type as "bind" | "volume" | "tmpfs") || "volume";
    const readOnly = !!entry.read_only;
    const isDockerSocket = source.includes("docker.sock") || target.includes("docker.sock");
    return {
      raw: `${source}:${target}`,
      source,
      target,
      type,
      isReadOnly: readOnly,
      isDockerSocket,
    };
  }

  const str = String(entry).trim();
  const parts = str.split(":");
  const source = parts[0] || "";
  const target = parts[1] || "";
  const mode = parts[2] || "";

  const isReadOnly = mode.includes("ro");
  const isBind = source.startsWith(".") || source.startsWith("/") || source.startsWith("~");
  const isDockerSocket = source.includes("docker.sock") || target.includes("docker.sock");

  return {
    raw: str,
    source,
    target: target || source,
    type: isBind ? "bind" : "volume",
    isReadOnly,
    isDockerSocket,
  };
}

/**
 * Main Analyzer function that parses Docker Compose YAML and runs comprehensive security & architecture checks.
 */
export function analyzeComposeYaml(rawYaml: string): ComposeAnalysisResult {
  const issues: ComposeAuditIssue[] = [];

  if (!rawYaml || !rawYaml.trim()) {
    return {
      isValid: false,
      error: "Compose file is empty. Please enter or upload valid Docker Compose YAML.",
      services: [],
      networks: [],
      volumes: [],
      issues: [],
      securityScore: 100,
      grade: "A+",
      mermaidDiagram: "",
      stats: {
        serviceCount: 0,
        exposedPortCount: 0,
        wildcardPortCount: 0,
        volumeCount: 0,
        networkCount: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      },
    };
  }

  let doc: Record<string, unknown>;
  try {
    const loaded = yamlLoad(rawYaml);
    if (!loaded || typeof loaded !== "object") {
      throw new Error("YAML parsed to non-object format");
    }
    doc = loaded as Record<string, unknown>;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      error: `YAML Syntax Error: ${errMsg}`,
      services: [],
      networks: [],
      volumes: [],
      issues: [],
      securityScore: 0,
      grade: "F",
      mermaidDiagram: "",
      stats: {
        serviceCount: 0,
        exposedPortCount: 0,
        wildcardPortCount: 0,
        volumeCount: 0,
        networkCount: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
      },
    };
  }

  // Top level version check
  const topLevelVersion = typeof doc.version === "string" ? doc.version : undefined;
  if (topLevelVersion) {
    issues.push({
      id: "deprecated-version-attribute",
      severity: "LOW",
      category: "BEST_PRACTICE",
      title: "Deprecated 'version' attribute",
      description: `Top-level version '${topLevelVersion}' is obsolete in Compose Specification (Compose v2+). Docker Compose now automatically supports the latest spec.`,
      remediation: "Remove the top-level 'version:' line from your docker-compose.yml file.",
    });
  }

  // Parse Services
  const servicesRaw = (doc.services || {}) as Record<string, Record<string, unknown>>;
  const services: ServiceInfo[] = [];

  // Top level defined networks & volumes
  const declaredNetworks = Object.keys((doc.networks || {}) as Record<string, unknown>);
  const declaredVolumes = Object.keys((doc.volumes || {}) as Record<string, unknown>);

  let exposedPortCount = 0;
  let wildcardPortCount = 0;
  let totalVolumeCount = 0;

  for (const [svcName, svcData] of Object.entries(servicesRaw)) {
    if (!svcData || typeof svcData !== "object") continue;

    // Image & Tag
    const image = typeof svcData.image === "string" ? svcData.image : undefined;
    let imageTag: string | undefined;
    let isLatestOrUnpinned = false;

    if (image) {
      if (image.includes(":")) {
        const parts = image.split(":");
        imageTag = parts[parts.length - 1];
        if (imageTag === "latest") {
          isLatestOrUnpinned = true;
        }
      } else {
        isLatestOrUnpinned = true; // Omitting tag implicitly uses :latest
        imageTag = "latest (implicit)";
      }
    }

    // Build context
    const build = svcData.build as string | { context?: string; dockerfile?: string } | undefined;

    // Ports
    const portsRaw = Array.isArray(svcData.ports) ? svcData.ports : [];
    const ports: PortMapping[] = portsRaw.map(parsePortEntry);
    exposedPortCount += ports.length;
    wildcardPortCount += ports.filter((p) => p.isWildcard).length;

    // Volumes
    const volumesRaw = Array.isArray(svcData.volumes) ? svcData.volumes : [];
    const volumes: VolumeMount[] = volumesRaw.map(parseVolumeEntry);
    totalVolumeCount += volumes.length;

    // Networks
    let networks: string[] = [];
    if (Array.isArray(svcData.networks)) {
      networks = svcData.networks.map(String);
    } else if (typeof svcData.networks === "object" && svcData.networks !== null) {
      networks = Object.keys(svcData.networks);
    }

    // Depends on
    let dependsOn: string[] = [];
    if (Array.isArray(svcData.depends_on)) {
      dependsOn = svcData.depends_on.map(String);
    } else if (typeof svcData.depends_on === "object" && svcData.depends_on !== null) {
      dependsOn = Object.keys(svcData.depends_on);
    }

    // Environment & Secrets
    const envMap: Record<string, string | null> = {};
    const plainTextSecrets: string[] = [];

    if (Array.isArray(svcData.environment)) {
      for (const item of svcData.environment) {
        const str = String(item);
        const eqIdx = str.indexOf("=");
        if (eqIdx !== -1) {
          const key = str.slice(0, eqIdx).trim();
          const val = str.slice(eqIdx + 1).trim();
          envMap[key] = val;
          if (SECRET_ENV_REGEX.test(key) && val && !val.startsWith("${") && val !== '""' && val !== "''") {
            plainTextSecrets.push(key);
          }
        } else {
          envMap[str] = null;
        }
      }
    } else if (typeof svcData.environment === "object" && svcData.environment !== null) {
      for (const [k, v] of Object.entries(svcData.environment as Record<string, unknown>)) {
        const valStr = v !== null && v !== undefined ? String(v) : null;
        envMap[k] = valStr;
        if (
          SECRET_ENV_REGEX.test(k) &&
          valStr &&
          !valStr.startsWith("${") &&
          valStr !== '""' &&
          valStr !== "''"
        ) {
          plainTextSecrets.push(k);
        }
      }
    }

    // Security flags
    const privileged = svcData.privileged === true;
    const restart = typeof svcData.restart === "string" ? svcData.restart : undefined;
    const hasHealthcheck = !!svcData.healthcheck && typeof svcData.healthcheck === "object";
    const user = typeof svcData.user === "string" ? svcData.user : undefined;
    const isRunningAsRoot = !user || user === "0" || user === "root";
    const readOnlyRootfs = svcData.read_only === true;
    const networkMode = typeof svcData.network_mode === "string" ? svcData.network_mode : undefined;
    const pidMode = typeof svcData.pid === "string" ? svcData.pid : undefined;

    // Resource limits
    const deploy = (svcData.deploy || {}) as Record<string, unknown>;
    const resources = (deploy.resources || {}) as Record<string, unknown>;
    const limits = (resources.limits || {}) as Record<string, unknown>;
    const hasResourceLimits =
      !!limits.memory ||
      !!limits.cpus ||
      !!svcData.mem_limit ||
      !!svcData.cpus ||
      !!svcData.cpu_shares;

    // Assemble ServiceInfo
    const svcInfo: ServiceInfo = {
      name: svcName,
      image,
      imageTag,
      isLatestOrUnpinned,
      build,
      ports,
      volumes,
      networks,
      dependsOn,
      environment: envMap,
      plainTextSecrets,
      restart,
      hasHealthcheck,
      privileged,
      hasResourceLimits,
      user,
      isRunningAsRoot,
      readOnlyRootfs,
      networkMode,
      pidMode,
    };
    services.push(svcInfo);

    // ==========================================
    // AUDIT RULES PER SERVICE
    // ==========================================

    // 1. Privileged Mode (CRITICAL)
    if (privileged) {
      issues.push({
        id: `privileged-${svcName}`,
        severity: "CRITICAL",
        category: "SECURITY",
        serviceName: svcName,
        title: `Service '${svcName}' runs in privileged mode`,
        description:
          "Enabling 'privileged: true' gives container full root capabilities and unrestricted access to host devices, effectively bypassing Docker container isolation.",
        remediation:
          "Remove 'privileged: true'. Use granular 'cap_add' (e.g. cap_add: [NET_ADMIN]) or device mappings if specific kernel capabilities are needed.",
        codeSnippet: `services:\n  ${svcName}:\n    # REMOVE:\n    # privileged: true\n    cap_drop:\n      - ALL\n    cap_add:\n      - CHOWN`,
      });
    }

    // 2. Docker Socket Mount (CRITICAL)
    const socketMount = volumes.find((v) => v.isDockerSocket);
    if (socketMount) {
      issues.push({
        id: `docker-socket-${svcName}`,
        severity: "CRITICAL",
        category: "SECURITY",
        serviceName: svcName,
        title: `Service '${svcName}' mounts the Docker Daemon Socket`,
        description: `Mounting '/var/run/docker.sock' allows processes inside the container to command the host Docker daemon, which can lead to instant root takeover of the entire host machine.`,
        remediation:
          "Avoid mounting docker.sock. If an agent/CI runner requires it, consider rootless Docker or an isolated Docker-in-Docker (dind) container with read-only socket proxies.",
        codeSnippet: `volumes:\n  - /var/run/docker.sock:/var/run/docker.sock # ⚠️ CRITICAL ESCALATION RISK`,
      });
    }

    // 3. Sensitive Ports bound to 0.0.0.0 (HIGH)
    for (const port of ports) {
      if (port.isDangerousPort && port.isWildcard) {
        issues.push({
          id: `wildcard-db-port-${svcName}-${port.containerPort}`,
          severity: "HIGH",
          category: "SECURITY",
          serviceName: svcName,
          title: `Sensitive port ${port.containerPort} (${SENSITIVE_PORTS[Number(port.containerPort)] || "Database"}) exposed on 0.0.0.0`,
          description: `Port ${port.containerPort} is published without binding to localhost (127.0.0.1). Anyone on the public internet or local network can attempt brute-force or exploit unauthenticated connections.`,
          remediation: `Bind the port explicitly to localhost (e.g. '127.0.0.1:${port.hostPort || port.containerPort}:${port.containerPort}') or remove the host port mapping entirely if only internal services need to communicate via Docker network.`,
          codeSnippet: `ports:\n  # Insecure: "${port.raw}"\n  # Secure:\n  - "127.0.0.1:${port.hostPort || port.containerPort}:${port.containerPort}"`,
        });
      }
    }

    // 4. Plain-text secrets in environment (HIGH)
    if (plainTextSecrets.length > 0) {
      issues.push({
        id: `plain-secrets-${svcName}`,
        severity: "HIGH",
        category: "SECURITY",
        serviceName: svcName,
        title: `Hardcoded plain-text secret in service '${svcName}' (${plainTextSecrets.join(", ")})`,
        description: `Credentials like '${plainTextSecrets.join("', '")}' are declared directly in clear-text. Committing this file to git or sharing logs will leak sensitive production credentials.`,
        remediation:
          "Use environment variable interpolation from a .env file (e.g. ${POSTGRES_PASSWORD}) or use Docker Secrets.",
        codeSnippet: `environment:\n  ${plainTextSecrets[0]}: \${${plainTextSecrets[0]}} # Read from .env instead of hardcoding`,
      });
    }

    // 5. Host PID or Host Network mode (HIGH)
    if (pidMode === "host") {
      issues.push({
        id: `host-pid-${svcName}`,
        severity: "HIGH",
        category: "SECURITY",
        serviceName: svcName,
        title: `Service '${svcName}' shares Host PID namespace`,
        description:
          "'pid: host' allows the container to see and send signals (kill) to all processes running on the host OS.",
        remediation: "Remove 'pid: host' unless explicitly building a host process monitor.",
      });
    }
    if (networkMode === "host") {
      issues.push({
        id: `host-net-${svcName}`,
        severity: "MEDIUM",
        category: "SECURITY",
        serviceName: svcName,
        title: `Service '${svcName}' uses Host Network Mode`,
        description:
          "'network_mode: host' bypasses Docker network isolation, binding container ports directly to host interfaces without firewall filtering.",
        remediation: "Use bridge network with specific port bindings instead of host mode.",
      });
    }

    // 6. Unpinned image tag (:latest) (MEDIUM)
    if (isLatestOrUnpinned && image && !build) {
      issues.push({
        id: `unpinned-image-${svcName}`,
        severity: "MEDIUM",
        category: "RELIABILITY",
        serviceName: svcName,
        title: `Image tag unpinned for '${svcName}' (${image})`,
        description:
          "Using ':latest' or omitting image tags means every 'docker compose pull' could pull breaking upstream updates, leading to unpredictable production outages.",
        remediation: `Pin the exact semver tag or SHA digest (e.g. '${image.split(":")[0]}:1.24-alpine').`,
        codeSnippet: `image: ${image.split(":")[0]}:<EXACT_VERSION_TAG>`,
      });
    }

    // 7. Missing Restart Policy (MEDIUM)
    if (!restart || restart === "no") {
      issues.push({
        id: `missing-restart-${svcName}`,
        severity: "MEDIUM",
        category: "RELIABILITY",
        serviceName: svcName,
        title: `No restart policy defined for '${svcName}'`,
        description:
          "Without a restart policy, the container will stay down permanently if it crashes or if the host machine reboots.",
        remediation: "Add 'restart: unless-stopped' or 'restart: on-failure:5'.",
        codeSnippet: `services:\n  ${svcName}:\n    restart: unless-stopped`,
      });
    }

    // 8. Missing Healthcheck (MEDIUM)
    if (!hasHealthcheck && (ports.length > 0 || dependsOn.length > 0)) {
      issues.push({
        id: `missing-healthcheck-${svcName}`,
        severity: "MEDIUM",
        category: "RELIABILITY",
        serviceName: svcName,
        title: `Service '${svcName}' lacks a healthcheck`,
        description:
          "Without a healthcheck, dependent services can't safely wait for this container to be truly ready, and Docker cannot detect internal application deadlock.",
        remediation:
          "Define a 'healthcheck:' test command (e.g. curl, wget, or pg_isready) with interval and retries.",
        codeSnippet: `healthcheck:\n  test: ["CMD-SHELL", "curl -f http://localhost:80/ || exit 1"]\n  interval: 30s\n  timeout: 10s\n  retries: 3`,
      });
    }

    // 9. Missing Resource Limits (MEDIUM)
    if (!hasResourceLimits) {
      issues.push({
        id: `missing-limits-${svcName}`,
        severity: "MEDIUM",
        category: "RESOURCE",
        serviceName: svcName,
        title: `No memory or CPU limits for '${svcName}'`,
        description:
          "Unbounded containers can consume 100% of host CPU and RAM during memory leaks or denial-of-service spikes, triggering the Linux OOM-killer on essential host services.",
        remediation:
          "Add memory and CPU resource limits under 'deploy.resources.limits' or 'mem_limit'.",
        codeSnippet: `deploy:\n  resources:\n    limits:\n      cpus: '1.0'\n      memory: 512M`,
      });
    }

    // 10. Running as Root (LOW)
    if (isRunningAsRoot && !privileged) {
      issues.push({
        id: `root-user-${svcName}`,
        severity: "LOW",
        category: "SECURITY",
        serviceName: svcName,
        title: `Service '${svcName}' runs as root (UID 0)`,
        description:
          "No non-root user is specified. If an attacker achieves remote code execution in this container, they will hold root capabilities inside the namespace.",
        remediation: "Specify a non-privileged user (e.g. 'user: \"1000:1000\"' or 'user: node').",
        codeSnippet: `services:\n  ${svcName}:\n    user: "1000:1000"`,
      });
    }

    // 11. Writable Root Filesystem (LOW)
    if (!readOnlyRootfs) {
      issues.push({
        id: `writable-rootfs-${svcName}`,
        severity: "LOW",
        category: "BEST_PRACTICE",
        serviceName: svcName,
        title: `Root filesystem is writable for '${svcName}'`,
        description:
          "A writable root filesystem allows malicious scripts or compromised processes to download and persist unauthorized binaries or modify system libraries.",
        remediation:
          "Set 'read_only: true' and mount specific writable directories as tmpfs or named volumes.",
        codeSnippet: `services:\n  ${svcName}:\n    read_only: true\n    tmpfs:\n      - /tmp`,
      });
    }
  }

  // Calculate Statistics
  const criticalCount = issues.filter((i) => i.severity === "CRITICAL").length;
  const highCount = issues.filter((i) => i.severity === "HIGH").length;
  const mediumCount = issues.filter((i) => i.severity === "MEDIUM").length;
  const lowCount = issues.filter((i) => i.severity === "LOW").length;

  // Calculate Security Score (starts at 100, drops per violation)
  let score = 100;
  score -= criticalCount * 30;
  score -= highCount * 15;
  score -= mediumCount * 5;
  score -= lowCount * 2;
  score = Math.max(0, Math.min(100, score));

  // Determine Grade
  let grade: "A+" | "A" | "B" | "C" | "D" | "F" = "F";
  if (score >= 95 && criticalCount === 0 && highCount === 0) grade = "A+";
  else if (score >= 85 && criticalCount === 0 && highCount === 0) grade = "A";
  else if (score >= 70 && criticalCount === 0) grade = "B";
  else if (score >= 50) grade = "C";
  else if (score >= 35) grade = "D";
  else grade = "F";

  // Generate Mermaid Architecture Diagram
  const mermaidDiagram = generateMermaidDiagram(services, declaredNetworks, declaredVolumes);

  return {
    isValid: true,
    topLevelVersion,
    services,
    networks: declaredNetworks,
    volumes: declaredVolumes,
    issues,
    securityScore: score,
    grade,
    mermaidDiagram,
    stats: {
      serviceCount: services.length,
      exposedPortCount,
      wildcardPortCount,
      volumeCount: totalVolumeCount,
      networkCount: declaredNetworks.length,
      criticalIssues: criticalCount,
      highIssues: highCount,
      mediumIssues: mediumCount,
      lowIssues: lowCount,
    },
  };
}

/**
 * Generates clean Mermaid flowchart diagram from analyzed Docker Compose topology
 */
export function generateMermaidDiagram(
  services: ServiceInfo[],
  declaredNetworks: string[],
  declaredVolumes: string[]
): string {
  const lines: string[] = ["graph TD"];

  // Styles
  lines.push("  classDef default fill:#18181b,stroke:#27272a,stroke-width:1px,color:#f4f4f5;");
  lines.push("  classDef serviceNode fill:#09090b,stroke:#10b981,stroke-width:2px,color:#f4f4f5;");
  lines.push("  classDef dbNode fill:#09090b,stroke:#f59e0b,stroke-width:2px,color:#f4f4f5;");
  lines.push("  classDef publicPort fill:#3b82f6,stroke:#2563eb,stroke-width:1px,color:#ffffff;");
  lines.push("  classDef volumeNode fill:#1e1b4b,stroke:#6366f1,stroke-width:1px,color:#e0e7ff;");
  lines.push("  classDef networkNode fill:#064e3b,stroke:#10b981,stroke-width:1px,color:#d1fae5;");

  // Internet / Client Gateway
  const hasExposedPorts = services.some((s) => s.ports.length > 0);
  if (hasExposedPorts) {
    lines.push('  Internet["🌐 Public Internet / Client"]:::publicPort');
  }

  // Services Nodes
  for (const svc of services) {
    const isDb = svc.ports.some((p) => p.isDangerousPort) || /(?:db|postgres|mysql|mongo|redis)/i.test(svc.name);
    const nodeClass = isDb ? "dbNode" : "serviceNode";
    const imageLabel = svc.image ? `<br/><small>${svc.image}</small>` : "";
    lines.push(`  svc_${svc.name}["🐳 ${svc.name}${imageLabel}"]:::${nodeClass}`);

    // Internet connections for exposed ports
    for (const port of svc.ports) {
      if (port.hostPort) {
        const portLabel = port.isWildcard ? `:${port.hostPort} ⚠️` : `127.0.0.1:${port.hostPort}`;
        lines.push(`  Internet -->|${portLabel}| svc_${svc.name}`);
      }
    }

    // Depends_on relationships
    for (const dep of svc.dependsOn) {
      lines.push(`  svc_${svc.name} -.->|depends on| svc_${dep}`);
    }

    // Volumes
    for (const vol of svc.volumes) {
      const volId = `vol_${svc.name}_${vol.target.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const volLabel = vol.type === "bind" ? `📁 ${vol.source}` : `💾 ${vol.source || vol.target}`;
      lines.push(`  ${volId}["${volLabel}"]:::volumeNode`);
      lines.push(`  svc_${svc.name} ---|mounts| ${volId}`);
    }
  }

  // Declared Networks clustering (if any)
  if (declaredNetworks.length > 0) {
    for (const net of declaredNetworks) {
      const netId = `net_${net.replace(/[^a-zA-Z0-9]/g, "_")}`;
      lines.push(`  ${netId}{{"🖧 Network: ${net}"}}:::networkNode`);
      for (const svc of services) {
        if (svc.networks.includes(net)) {
          lines.push(`  svc_${svc.name} --- ${netId}`);
        }
      }
    }
  }

  return lines.join("\n");
}

/**
 * 1-Click Auto-Harden Compose Engine:
 * Reads raw YAML, applies security patches (pinning localhost, resource limits, healthchecks, restart policies)
 * and returns production-grade hardened YAML.
 */
export function hardenComposeYaml(rawYaml: string): string {
  try {
    const loaded = yamlLoad(rawYaml) as Record<string, unknown>;
    if (!loaded || typeof loaded !== "object" || !loaded.services) {
      return rawYaml;
    }

    // Delete deprecated version attribute
    if ("version" in loaded) {
      delete loaded.version;
    }

    const services = loaded.services as Record<string, Record<string, unknown>>;

    for (const [svcName, svc] of Object.entries(services)) {
      if (!svc || typeof svc !== "object") continue;

      // 1. Privileged mode fix
      if (svc.privileged === true) {
        svc.privileged = false;
        if (!svc.cap_drop) {
          svc.cap_drop = ["ALL"];
        }
      }

      // 2. Remove Docker socket mounts
      if (Array.isArray(svc.volumes)) {
        svc.volumes = svc.volumes.filter((v: unknown) => {
          const str = typeof v === "string" ? v : JSON.stringify(v);
          return !str.includes("docker.sock");
        });
      }

      // 3. Bind sensitive wildcard ports to 127.0.0.1
      if (Array.isArray(svc.ports)) {
        svc.ports = svc.ports.map((p: unknown) => {
          if (typeof p === "string" || typeof p === "number") {
            const parsed = parsePortEntry(p);
            if (parsed.isDangerousPort && parsed.isWildcard) {
              return `127.0.0.1:${parsed.hostPort || parsed.containerPort}:${parsed.containerPort}`;
            }
          }
          return p;
        });
      }

      // 4. Default restart policy
      if (!svc.restart || svc.restart === "no") {
        svc.restart = "unless-stopped";
      }

      // 5. Default resource limits
      if (!svc.deploy && !svc.mem_limit) {
        svc.deploy = {
          resources: {
            limits: {
              cpus: "1.0",
              memory: "512M",
            },
          },
        };
      }

      // 6. Suggest healthcheck if completely absent on web/db services
      if (!svc.healthcheck && (svc.ports || /web|api|db|postgres|mysql/i.test(svcName))) {
        if (/postgres/i.test(svcName) || /postgres/i.test(String(svc.image || ""))) {
          svc.healthcheck = {
            test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"],
            interval: "10s",
            timeout: "5s",
            retries: 5,
          };
        } else if (/redis/i.test(svcName) || /redis/i.test(String(svc.image || ""))) {
          svc.healthcheck = {
            test: ["CMD", "redis-cli", "ping"],
            interval: "10s",
            timeout: "3s",
            retries: 3,
          };
        }
      }

      // 7. Replace plain-text environment passwords with env variable references
      if (svc.environment && typeof svc.environment === "object") {
        if (Array.isArray(svc.environment)) {
          svc.environment = svc.environment.map((item: unknown) => {
            const str = String(item);
            const eq = str.indexOf("=");
            if (eq !== -1) {
              const k = str.slice(0, eq);
              const v = str.slice(eq + 1);
              if (SECRET_ENV_REGEX.test(k) && !v.startsWith("${")) {
                return `${k}=\${${k}}`;
              }
            }
            return item;
          });
        } else {
          const envObj = svc.environment as Record<string, unknown>;
          for (const [k, v] of Object.entries(envObj)) {
            const valStr = String(v ?? "");
            if (SECRET_ENV_REGEX.test(k) && !valStr.startsWith("${")) {
              envObj[k] = `\${${k}}`;
            }
          }
        }
      }
    }

    return `# Hardened by MegaTools Docker Compose Security Linter\n` + yamlDump(loaded, { indent: 2 });
  } catch {
    return rawYaml;
  }
}

// ==========================================
// PRESET SAMPLES
// ==========================================

export const SAMPLE_INSECURE_STACK = `version: '3.8'

services:
  web-app:
    image: node:latest
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=superSecretJwtKey9981!
      - DB_HOST=postgres-db
    depends_on:
      - postgres-db
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  postgres-db:
    image: postgres:latest
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=P@ssw0rdProdSecret2026!
      - POSTGRES_DB=production_db
    volumes:
      - pgdata:/var/lib/postgresql/data

  admin-tools:
    image: ubuntu:latest
    privileged: true
    command: sleep infinity

volumes:
  pgdata:
`;

export const SAMPLE_MICROSERVICES_STACK = `services:
  api-gateway:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks:
      - public-net
      - internal-net
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/health"]
      interval: 15s
      timeout: 5s
      retries: 3

  auth-service:
    image: mycompany/auth-service:2.4.1
    restart: unless-stopped
    networks:
      - internal-net
    environment:
      - DB_URL=\${DATABASE_URL}
      - REDIS_HOST=redis-cache
      - JWT_PRIVATE_KEY=\${JWT_PRIVATE_KEY}
    depends_on:
      postgres-db:
        condition: service_healthy
      redis-cache:
        condition: service_started
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M

  postgres-db:
    image: postgres:16.4-alpine
    restart: unless-stopped
    networks:
      - internal-net
    ports:
      - "127.0.0.1:5432:5432"
    environment:
      - POSTGRES_USER=\${DB_USER}
      - POSTGRES_PASSWORD=\${DB_PASSWORD}
      - POSTGRES_DB=auth_db
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USER:-postgres}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G

  redis-cache:
    image: redis:7.4-alpine
    restart: unless-stopped
    networks:
      - internal-net
    volumes:
      - redis-data:/data
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

networks:
  public-net:
    driver: bridge
  internal-net:
    driver: bridge

volumes:
  db-data:
  redis-data:
`;

export const SAMPLE_DEV_FULLSTACK = `services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    restart: on-failure

  backend:
    build:
      context: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
    environment:
      - SECRET_KEY=local_dev_only_key_12345
      - REDIS_URL=redis://cache:6379/0
    depends_on:
      - cache

  cache:
    image: redis:alpine
    ports:
      - "6379:6379"
`;
