import { spawn, type ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";

const port = parseInt(process.env.PORT || "5000", 10);
const isProduction = process.env.NODE_ENV === "production";

let nextProcess: ChildProcess | null = null;

function findPidsOnPort(targetPort: number): number[] {
  const hexPort = targetPort.toString(16).toUpperCase().padStart(4, "0");
  const inodes = new Set<string>();

  for (const procFile of ["/proc/net/tcp", "/proc/net/tcp6"]) {
    let content: string;
    try {
      content = fs.readFileSync(procFile, "utf-8");
    } catch {
      continue;
    }
    const lines = content.trim().split("\n");
    for (let i = 1; i < lines.length; i++) {
      const fields = lines[i].trim().split(/\s+/);
      if (fields.length < 10) continue;
      const localAddr = fields[1];
      const state = fields[3];
      const portHex = localAddr.split(":")[1];
      if (portHex && portHex.toUpperCase() === hexPort && state === "0A") {
        inodes.add(fields[9]);
      }
    }
  }

  if (inodes.size === 0) return [];

  const pids: number[] = [];
  let procEntries: string[];
  try {
    procEntries = fs.readdirSync("/proc");
  } catch {
    return [];
  }

  for (const entry of procEntries) {
    const pid = parseInt(entry, 10);
    if (isNaN(pid) || pid === process.pid) continue;

    const fdDir = path.join("/proc", entry, "fd");
    let fds: string[];
    try {
      fds = fs.readdirSync(fdDir);
    } catch {
      continue;
    }

    for (const fd of fds) {
      let link: string;
      try {
        link = fs.readlinkSync(path.join(fdDir, fd));
      } catch {
        continue;
      }
      const match = link.match(/^socket:\[(\d+)\]$/);
      if (match && inodes.has(match[1])) {
        pids.push(pid);
        break;
      }
    }
  }

  return pids;
}

function killProcessOnPort(targetPort: number): void {
  const pids = findPidsOnPort(targetPort);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGKILL");
      console.log(`Killed stale process ${pid} on port ${targetPort}`);
    } catch {
    }
  }
}

function gracefulShutdown(signal: string): void {
  console.log(`\nReceived ${signal}, shutting down...`);
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGTERM");
    const forceKillTimer = setTimeout(() => {
      if (nextProcess && !nextProcess.killed) {
        nextProcess.kill("SIGKILL");
      }
    }, 5000);
    forceKillTimer.unref();
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

function resolveNextBin(): string {
  try {
    const localBin = path.resolve("node_modules", ".bin", "next");
    if (fs.existsSync(localBin)) return localBin;
  } catch {}
  return "npx";
}

function start(): void {
  if (!isProduction) {
    const pids = findPidsOnPort(port);
    if (pids.length > 0) {
      console.log(`Port ${port} is in use, killing stale processes...`);
      killProcessOnPort(port);
    }
  }

  console.log(`Starting Next.js in ${isProduction ? "production" : "development"} mode on port ${port}...`);

  const nextBin = resolveNextBin();
  const useNpx = nextBin === "npx";

  const nextArgs = isProduction
    ? (useNpx ? ["next", "start", "-p", port.toString()] : ["start", "-p", port.toString()])
    : (useNpx ? ["next", "dev", "--webpack", "-p", port.toString()] : ["dev", "--webpack", "-p", port.toString()]);

  nextProcess = spawn(nextBin, nextArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: { ...process.env },
  });

  nextProcess.on("error", (err) => {
    console.error("Failed to start Next.js:", err);
    process.exit(1);
  });

  nextProcess.on("exit", (code) => {
    console.log(`Next.js exited with code ${code}`);
    nextProcess = null;
    process.exit(code || 0);
  });
}

start();
