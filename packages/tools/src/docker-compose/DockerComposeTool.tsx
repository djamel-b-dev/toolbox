import { useState } from "react";
import { CopyButton, Icon } from "@toolbox/ui";

function tokenize(cmd: string): string[] {
  const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(cmd))) tokens.push(m[1] ?? m[2] ?? m[3]);
  return tokens;
}

interface Parsed {
  name: string;
  image: string;
  ports: string[];
  envs: string[];
  volumes: string[];
  network: string;
  workdir: string;
  restart: string;
  command: string[];
}

function parseDockerRun(cmd: string): Parsed {
  const tokens = tokenize(cmd.trim());
  if (tokens[0] === "docker") tokens.shift();
  if (tokens[0] === "run") tokens.shift();

  const result: Parsed = { name: "", image: "", ports: [], envs: [], volumes: [], network: "", workdir: "", restart: "", command: [] };

  const setters: Record<string, (v: string) => void> = {
    "--name": (v) => (result.name = v),
    "-p": (v) => result.ports.push(v),
    "--publish": (v) => result.ports.push(v),
    "-e": (v) => result.envs.push(v),
    "--env": (v) => result.envs.push(v),
    "-v": (v) => result.volumes.push(v),
    "--volume": (v) => result.volumes.push(v),
    "--network": (v) => (result.network = v),
    "-w": (v) => (result.workdir = v),
    "--workdir": (v) => (result.workdir = v),
    "--restart": (v) => (result.restart = v),
  };
  const noValueFlags = new Set(["-d", "--detach", "--rm", "-it", "-i", "-t"]);

  let i = 0;
  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok in setters) {
      setters[tok](tokens[i + 1] ?? "");
      i += 2;
      continue;
    }
    const eqMatch = tok.match(/^(--[a-z-]+)=(.*)$/);
    if (eqMatch && setters[eqMatch[1]]) {
      setters[eqMatch[1]](eqMatch[2]);
      i += 1;
      continue;
    }
    if (noValueFlags.has(tok)) {
      i += 1;
      continue;
    }
    if (tok.startsWith("-")) {
      i += 1;
      continue;
    }
    if (!result.image) {
      result.image = tok;
      i += 1;
      continue;
    }
    result.command.push(tok);
    i += 1;
  }
  return result;
}

function toCompose(r: Parsed): string {
  const serviceName = r.name || "app";
  const lines: string[] = ["services:", `  ${serviceName}:`, `    image: ${r.image || "?"}`];
  if (r.name) lines.push(`    container_name: ${r.name}`);
  if (r.ports.length) {
    lines.push("    ports:");
    r.ports.forEach((p) => lines.push(`      - "${p}"`));
  }
  if (r.envs.length) {
    lines.push("    environment:");
    r.envs.forEach((e) => lines.push(`      - ${e}`));
  }
  if (r.volumes.length) {
    lines.push("    volumes:");
    r.volumes.forEach((v) => lines.push(`      - ${v}`));
  }
  if (r.network) {
    lines.push("    networks:");
    lines.push(`      - ${r.network}`);
  }
  if (r.workdir) lines.push(`    working_dir: ${r.workdir}`);
  if (r.restart) lines.push(`    restart: ${r.restart}`);
  if (r.command.length) lines.push(`    command: ${r.command.join(" ")}`);
  return lines.join("\n") + "\n";
}

export function DockerComposeTool() {
  const [input, setInput] = useState(
    "docker run -d --name my-app -p 8080:80 -e NODE_ENV=production -v ./data:/app/data --restart unless-stopped nginx:latest",
  );

  const output = input.trim() ? toCompose(parseDockerRun(input)) : "";

  return (
    <div className="bench">
      <div className="panel">
        <div className="panel-head">
          <span className="label">Commande docker run</span>
        </div>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} />
      </div>
      <div className="rail-connector">
        <Icon name="arrow-right" />
      </div>
      <div className="panel">
        <div className="panel-head">
          <span className="label">docker-compose.yml</span>
        </div>
        <pre>{output}</pre>
        <div className="panel-tools">
          <CopyButton getText={() => output} />
        </div>
      </div>
    </div>
  );
}
