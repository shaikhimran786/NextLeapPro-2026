import { spawn } from "child_process";

const port = parseInt(process.env.PORT || "5000", 10);
const isProduction = process.env.NODE_ENV === "production";

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
