import { config } from "dotenv";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { defineConfig } from "drizzle-kit";

config({ path: ".env" });

const useLocalDb =
  process.env.USE_LOCAL_DB === "true" || process.env.USE_LOCAL_DB === "1";
const isDev = (process.env.MODE ?? "dev") === "dev";
const useLocal = useLocalDb && isDev;

const localDbPath =
  process.env.LOCAL_DB_PATH ?? path.join(process.cwd(), "data", "local.db");
const absolutePath = path.isAbsolute(localDbPath)
  ? localDbPath
  : path.join(process.cwd(), localDbPath);

if (useLocal) {
  const dir = path.dirname(absolutePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export default defineConfig({
  schema: "./src/modules/*/model.ts",
  out: "./migrations",
  dialect: "turso",
  dbCredentials: useLocal
    ? { url: pathToFileURL(absolutePath).toString() }
    : {
        url: process.env.TURSO_CONNECTION_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
});
