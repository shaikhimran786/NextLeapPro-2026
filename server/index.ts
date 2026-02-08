import { spawn, execSync, type ChildProcess } from "child_process";
import * as net from "net";

const port = parseInt(process.env.PORT || "5000", 10);
const isProduction = process.env.NODE_ENV === "production";

let nextProcess: ChildProcess | null = null;

function killProcessOnPort(targetPort: number): void {
  try {
    const result = execSync(
      `lsof -ti tcp:${targetPort}`,
      { encoding: "utf-8" }
    ).trim();
    if (result) {
      const pids = result.split("\n").filter(Boolean);
      for (const pid of pids) {
        // Don't kill ourselves
        if (pid === String(process.pid)) continue;
        try {
          process.kill(parseInt(pid, 10), "SIGKILL");
          console.log(`Killed stale process ${pid} on port ${targetPort}`);
        } catch {
          // Process may have already exited
        }
      }
    }
  } catch {
    // lsof returns non-zero if no process found — that's fine
  }
}

function isPortInUse(targetPort: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close(() => resolve(false));
    });
    server.listen(targetPort);
  });
}

function gracefulShutdown(signal: string): void {
  console.log(`\nReceived ${signal}, shutting down...`);
  if (nextProcess && !nextProcess.killed) {
    nextProcess.kill("SIGTERM");
    // Force kill after 5 seconds if still alive
    const forceKillTimer = setTimeout(() => {
      if (nextProcess && !nextProcess.killed) {
        console.log("Force killing Next.js process...");
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

async function start(): Promise<void> {
  // Check if port is already in use and kill stale processes
  const portBusy = await isPortInUse(port);
  if (portBusy) {
    console.log(`Port ${port} is in use, killing stale processes...`);
    killProcessOnPort(port);
    // Brief delay to let the OS release the port
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`Starting Next.js in ${isProduction ? "production" : "development"} mode on port ${port}...`);

  const nextArgs = isProduction
    ? ["next", "start", "-p", port.toString()]
    : ["next", "dev", "--webpack", "-p", port.toString()];

  nextProcess = spawn("npx", nextArgs, {
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
