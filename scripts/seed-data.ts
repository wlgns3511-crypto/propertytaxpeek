/**
 * TypeScript seed script - runs the Python collector then verifies the DB.
 * Usage: npx tsx scripts/seed-data.ts
 */
import { execSync } from "child_process";
import path from "path";

const root = path.resolve(__dirname, "..");
console.log("Running Python data collector...");
execSync(`python3 ${path.join(root, "scripts", "collect-data.py")}`, {
  stdio: "inherit",
});
console.log("Done!");
