import { spawn } from "child_process";
import { rmSync, existsSync } from "fs";
import { join } from "path";

const port = parseInt(process.env.PORT || "5000", 10);
const isProduction = process.env.NODE_ENV === "production";

if (!isProduction) {
  const nextCacheDir = join(process.cwd(), ".next");
  if (existsSync(nextCacheDir)) {
    console.log("Cleaning .next cache for fresh build...");
    rmSync(nextCacheDir, { recursive: true, force: true });
    console.log("Cache cleaned successfully.");
  }
}

console.log(`Starting Next.js in ${isProduction ? "production" : "development"} mode on port ${port}...`);

const nextArgs = isProduction
  ? ["next", "start", "-p", port.toString()]
  : ["next", "dev", "--webpack", "-p", port.toString()];

const next = spawn("npx", nextArgs, {
  cwd: process.cwd(),
  stdio: "inherit",
  env: { ...process.env },
});

next.on("error", (err) => {
  console.error("Failed to start Next.js:", err);
  process.exit(1);
});

next.on("exit", (code) => {
  console.log(`Next.js exited with code ${code}`);
  process.exit(code || 0);
});
