"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InfoPanel from "@/components/InfoPanel";
import MobileInfoDrawer from "@/components/MobileInfoDrawer";
import CopyButton from "@/components/CopyButton";

const SAMPLE_COMMANDS = [
  {
    name: "Nginx with Port & Volume",
    cmd: "docker run -d --name my-web-server -p 8080:80 -v /var/www/html:/usr/share/nginx/html:ro --restart always nginx:alpine",
  },
  {
    name: "PostgreSQL Database",
    cmd: "docker run -d --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=app_db -p 5432:5432 -v pgdata:/var/lib/postgresql/data --restart unless-stopped postgres:16",
  },
  {
    name: "Redis Cache with Memory Limit",
    cmd: "docker run -d --name redis-cache -p 6379:6379 -m 512m --cpus 1.5 --network backend redis:latest redis-server --appendonly yes",
  },
];

interface ParsedService {
  name: string;
  image: string;
  command?: string;
  container_name?: string;
  restart?: string;
  ports?: string[];
  volumes?: string[];
  environment?: string[];
  networks?: string[];
  workdir?: string;
  user?: string;
  entrypoint?: string;
  privileged?: boolean;
  hostname?: string;
  labels?: string[];
  deploy?: {
    resources?: {
      limits?: {
        cpus?: string;
        memory?: string;
      };
    };
  };
}

function parseDockerRun(rawCommand: string): { composeYaml: string; serviceCount: number; error: string | null } {
  const cleanCmd = rawCommand
    .split("\n")
    .map((l) => l.trim().replace(/\\$/, "").trim())
    .filter(Boolean)
    .join(" ");

  if (!cleanCmd.trim()) {
    return { composeYaml: "", serviceCount: 0, error: null };
  }

  // Tokenize preserving quotes
  const tokens: string[] = [];
  const regex = /(?:[^\s"']+|"[^"]*"|'[^']*')+/g;
  let match;
  while ((match = regex.exec(cleanCmd)) !== null) {
    let token = match[0];
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
      token = token.slice(1, -1);
    }
    tokens.push(token);
  }

  if (tokens.length === 0) {
    return { composeYaml: "", serviceCount: 0, error: "Empty command." };
  }

  // Check if starts with docker run
  let idx = 0;
  if (tokens[0] === "docker") idx++;
  if (tokens[idx] === "run") idx++;

  const service: ParsedService = {
    name: "app",
    image: "",
  };

  const ports: string[] = [];
  const volumes: string[] = [];
  const environment: string[] = [];
  const networks: string[] = [];
  const labels: string[] = [];
  const commandArgs: string[] = [];
  let cpusLimit = "";
  let memoryLimit = "";

  while (idx < tokens.length) {
    const token = tokens[idx];

    if (token === "-d" || token === "--detach" || token === "--rm" || token === "-it" || token === "-i" || token === "-t") {
      idx++;
    } else if (token === "--name" && idx + 1 < tokens.length) {
      service.name = tokens[idx + 1].replace(/[^a-zA-Z0-9_-]/g, "_");
      service.container_name = tokens[idx + 1];
      idx += 2;
    } else if ((token === "-p" || token === "--publish") && idx + 1 < tokens.length) {
      ports.push(tokens[idx + 1]);
      idx += 2;
    } else if ((token === "-v" || token === "--volume") && idx + 1 < tokens.length) {
      volumes.push(tokens[idx + 1]);
      idx += 2;
    } else if ((token === "-e" || token === "--env") && idx + 1 < tokens.length) {
      environment.push(tokens[idx + 1]);
      idx += 2;
    } else if (token === "--restart" && idx + 1 < tokens.length) {
      service.restart = tokens[idx + 1];
      idx += 2;
    } else if (token === "--network" || token === "--net") {
      if (idx + 1 < tokens.length) {
        networks.push(tokens[idx + 1]);
        idx += 2;
      }
    } else if ((token === "-w" || token === "--workdir") && idx + 1 < tokens.length) {
      service.workdir = tokens[idx + 1];
      idx += 2;
    } else if ((token === "-u" || token === "--user") && idx + 1 < tokens.length) {
      service.user = tokens[idx + 1];
      idx += 2;
    } else if (token === "--entrypoint" && idx + 1 < tokens.length) {
      service.entrypoint = tokens[idx + 1];
      idx += 2;
    } else if (token === "--hostname" && idx + 1 < tokens.length) {
      service.hostname = tokens[idx + 1];
      idx += 2;
    } else if ((token === "-l" || token === "--label") && idx + 1 < tokens.length) {
      labels.push(tokens[idx + 1]);
      idx += 2;
    } else if (token === "--privileged") {
      service.privileged = true;
      idx++;
    } else if (token === "-m" || token === "--memory") {
      if (idx + 1 < tokens.length) {
        memoryLimit = tokens[idx + 1];
        idx += 2;
      }
    } else if (token === "--cpus") {
      if (idx + 1 < tokens.length) {
        cpusLimit = tokens[idx + 1];
        idx += 2;
      }
    } else if (!service.image) {
      // First non-flag token is the image
      service.image = token;
      idx++;
    } else {
      // Remaining tokens are commands
      commandArgs.push(token);
      idx++;
    }
  }

  if (!service.image) {
    return {
      composeYaml: "",
      serviceCount: 0,
      error: "No docker image found in the command.",
    };
  }

  // Construct YAML
  let yaml = `services:\n  ${service.name}:\n    image: ${service.image}\n`;

  if (service.container_name) {
    yaml += `    container_name: ${service.container_name}\n`;
  }
  if (service.restart) {
    yaml += `    restart: ${service.restart}\n`;
  }
  if (service.privileged) {
    yaml += `    privileged: true\n`;
  }
  if (service.hostname) {
    yaml += `    hostname: ${service.hostname}\n`;
  }
  if (service.workdir) {
    yaml += `    working_dir: ${service.workdir}\n`;
  }
  if (service.user) {
    yaml += `    user: "${service.user}"\n`;
  }
  if (service.entrypoint) {
    yaml += `    entrypoint: ${service.entrypoint}\n`;
  }

  if (ports.length > 0) {
    yaml += `    ports:\n`;
    ports.forEach((p) => {
      yaml += `      - "${p}"\n`;
    });
  }

  if (environment.length > 0) {
    yaml += `    environment:\n`;
    environment.forEach((env) => {
      if (env.includes("=")) {
        const [k, ...v] = env.split("=");
        yaml += `      - ${k}=${v.join("=")}\n`;
      } else {
        yaml += `      - ${env}\n`;
      }
    });
  }

  if (volumes.length > 0) {
    yaml += `    volumes:\n`;
    volumes.forEach((v) => {
      yaml += `      - ${v}\n`;
    });
  }

  if (networks.length > 0) {
    yaml += `    networks:\n`;
    networks.forEach((n) => {
      yaml += `      - ${n}\n`;
    });
  }

  if (labels.length > 0) {
    yaml += `    labels:\n`;
    labels.forEach((l) => {
      yaml += `      - "${l}"\n`;
    });
  }

  if (cpusLimit || memoryLimit) {
    yaml += `    deploy:\n      resources:\n        limits:\n`;
    if (cpusLimit) yaml += `          cpus: "${cpusLimit}"\n`;
    if (memoryLimit) yaml += `          memory: ${memoryLimit}\n`;
  }

  if (commandArgs.length > 0) {
    yaml += `    command: ${commandArgs.join(" ")}\n`;
  }

  return {
    composeYaml: yaml,
    serviceCount: 1,
    error: null,
  };
}

export default function DockerComposeConverterClient() {
  const [inputCommand, setInputCommand] = useState(SAMPLE_COMMANDS[0].cmd);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { composeYaml, serviceCount, error } = useMemo(() => {
    return parseDockerRun(inputCommand);
  }, [inputCommand]);

  const stats = (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-text-muted text-xs">Services</p>
        <p className="text-accent font-mono text-xs font-bold">{serviceCount}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs">Format</p>
        <p className="text-text-primary font-mono text-xs">Compose Spec</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link
        href="/"
        className="text-sm text-text-secondary hover:text-accent transition-colors mb-6 inline-flex items-center gap-1 font-mono"
      >
        $ cd ../
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Left: Main Workspace */}
        <div className="card p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold">
              <span className="gradient-text">Docker Run to Docker Compose Converter</span>
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Transform single or multi-line `docker run` commands into clean, indented `docker-compose.yml` specs.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="mb-4">
            <label className="text-xs font-mono text-text-secondary block mb-1.5">Load Examples:</label>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_COMMANDS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => setInputCommand(sample.cmd)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-bg-page border border-border-subtle hover:border-accent text-text-secondary hover:text-text-primary transition-colors"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Left: Input Docker Run Command */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  Docker Run Command:
                </label>
                <button
                  type="button"
                  onClick={() => setInputCommand("")}
                  className="text-[11px] font-mono text-text-muted hover:text-error transition-colors"
                >
                  Clear
                </button>
              </div>
              <textarea
                value={inputCommand}
                onChange={(e) => setInputCommand(e.target.value)}
                placeholder="docker run -d --name my-app -p 8080:80 -v /data:/data nginx:latest"
                rows={12}
                className="w-full p-3.5 rounded-xl bg-bg-page border border-border-subtle font-mono text-xs text-text-primary focus:border-accent focus:outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Right: Output docker-compose.yml */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-text-secondary font-bold uppercase">
                  docker-compose.yml:
                </label>
                {composeYaml && <CopyButton text={composeYaml} />}
              </div>

              {error ? (
                <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error font-mono text-xs h-[280px]">
                  ⚠ {error}
                </div>
              ) : (
                <div className="relative rounded-xl bg-bg-page border border-border-subtle p-3.5 font-mono text-xs text-text-primary overflow-x-auto h-[280px] overflow-y-auto">
                  <pre className="whitespace-pre">{composeYaml || "# Compose configuration will appear here..."}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: InfoPanel */}
        <div className="hidden lg:block">
          <InfoPanel toolId="docker-compose-converter" stats={stats} />
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="fixed bottom-6 right-6 z-30 lg:hidden w-12 h-12 rounded-full bg-accent text-bg-page shadow-lg flex items-center justify-center text-xl font-bold hover:bg-accent-hover transition-colors"
      >
        ?
      </button>

      <MobileInfoDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <InfoPanel toolId="docker-compose-converter" stats={stats} />
      </MobileInfoDrawer>
    </div>
  );
}
