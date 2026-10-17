#!/usr/bin/env node

import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const action = process.argv[2] || "status";

// Helper to determine whether to run via Windows docker or wsl -e docker
function getDockerCommand() {
  try {
    execSync("docker --version", { stdio: "ignore" });
    return { isWsl: false, base: "docker" };
  } catch (e) {
    // Check if wsl has docker
    try {
      execSync("wsl -e docker --version", { stdio: "ignore" });
      return { isWsl: true, base: "wsl -e docker" };
    } catch (e2) {
      console.error("\x1b[31m%s\x1b[0m", "Error: Docker not found on Windows or WSL!");
      console.error("Please install Docker in Ubuntu WSL: sudo apt install docker.io docker-compose-v2");
      process.exit(1);
    }
  }
}

const { isWsl } = getDockerCommand();

function runCommand(cmdArgs, interactive = false) {
  let fullCmd = "";
  if (isWsl) {
    // When executing inside WSL, convert current Windows path to WSL path if needed
    // or run docker compose from current directory using WSL
    const wslPath = rootDir.replace(/^([a-zA-Z]):\\/, (_, drive) => `/mnt/${drive.toLowerCase()}/`).replace(/\\/g, "/");
    fullCmd = `wsl -d Ubuntu-26.04 --cd "${wslPath}" docker compose ${cmdArgs}`;
  } else {
    fullCmd = `docker compose ${cmdArgs}`;
  }

  console.log("\x1b[36m%s\x1b[0m", `Executing: ${fullCmd}\n`);

  if (interactive) {
    const child = spawn(fullCmd, { shell: true, stdio: "inherit" });
    child.on("exit", (code) => process.exit(code || 0));
  } else {
    try {
      execSync(fullCmd, { stdio: "inherit", cwd: rootDir });
    } catch (err) {
      process.exit(1);
    }
  }
}

switch (action) {
  case "up":
    console.log("\x1b[32m%s\x1b[0m", "Starting Production-Tuned PostgreSQL in WSL Docker...");
    runCommand("up -d postgres");
    console.log("\x1b[32m%s\x1b[0m", "\n✔ PostgreSQL is running on localhost:5432!");
    console.log("Connection URL: postgres://postgres:postgres@localhost:5432/devtool_monetize\n");
    break;

  case "down":
    console.log("\x1b[33m%s\x1b[0m", "Stopping PostgreSQL Docker container...");
    runCommand("down");
    break;

  case "status":
    console.log("\x1b[34m%s\x1b[0m", "Checking WSL Docker PostgreSQL Status:");
    runCommand("ps");
    break;

  case "logs":
    console.log("\x1b[34m%s\x1b[0m", "Viewing PostgreSQL Logs (Ctrl+C to exit):");
    runCommand("logs -f postgres", true);
    break;

  case "reset":
    console.log("\x1b[31m%s\x1b[0m", "Wiping database volume and re-initializing from schema.sql...");
    runCommand("down -v");
    runCommand("up -d postgres");
    console.log("\x1b[32m%s\x1b[0m", "\n✔ Database successfully re-initialized with fresh schema & seed data!");
    break;

  case "gui":
    console.log("\x1b[32m%s\x1b[0m", "Starting PgWeb Database GUI on http://localhost:8081...");
    runCommand("--profile tools up -d db_viewer");
    break;

  default:
    console.log(`Usage: node scripts/wsl-docker.mjs [up|down|status|logs|reset|gui]`);
}
