import { spawn, type ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";

const isProduction = process.env.NODE_ENV === "production";
const requestedPort = parseInt(process.env.PORT || "5000", 10);
const isMacOS = process.platform === "darwin";

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

async function isPortAvailable(targetPort: number): Promise<boolean> {
  const net = await import("net");

  return await new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(false);
        return;
      }
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(targetPort, "::");
  });
}

async function resolvePort(): Promise<number> {
  if (isProduction) {
    return requestedPort;
  }

  const requestedPortAvailable = await isPortAvailable(requestedPort);
  if (requestedPortAvailable) {
    return requestedPort;
  }

  const pids = findPidsOnPort(requestedPort);
  if (pids.length > 0) {
    console.log(`Port ${requestedPort} is in use, killing stale processes...`);
    killProcessOnPort(requestedPort);

    const availableAfterCleanup = await isPortAvailable(requestedPort);
    if (availableAfterCleanup) {
      return requestedPort;
    }
  }

  if (isMacOS) {
    for (let fallbackPort = requestedPort + 1; fallbackPort < requestedPort + 20; fallbackPort++) {
      if (await isPortAvailable(fallbackPort)) {
        console.log(`Port ${requestedPort} is busy on macOS, using local fallback port ${fallbackPort} instead.`);
        return fallbackPort;
      }
    }
  }

  return requestedPort;
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

async function start(): Promise<void> {
  const port = await resolvePort();
  console.log(`Starting Next.js in ${isProduction ? "production" : "development"} mode on port ${port}...`);

  const nextBin = resolveNextBin();
  const useNpx = nextBin === "npx";

  const nextArgs = isProduction
    ? (useNpx ? ["next", "start", "-p", port.toString()] : ["start", "-p", port.toString()])
    : (useNpx ? ["next", "dev", "-p", port.toString()] : ["dev", "-p", port.toString()]);

  nextProcess = spawn(nextBin, nextArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      PORT: port.toString(),
      ...(isProduction
        ? {}
        : {
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`,
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || `http://localhost:${port}`,
          }),
    },
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

void start();
