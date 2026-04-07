import { Config, createClient } from "@libsql/client";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { drizzle } from "drizzle-orm/libsql";
import { getEnvironmentVariables } from "../common/environment";

const { useLocalDb, localDbPath, turso } = getEnvironmentVariables();

const isTesting = false;

const testDBParams = {
  url: ":memory:",
} satisfies Config;

const localDBParams = (): Config => {
  const absolutePath = path.isAbsolute(localDbPath) ? localDbPath : path.join(process.cwd(), localDbPath);

  const dir = path.dirname(absolutePath);

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return { url: pathToFileURL(absolutePath).toString() };
};

const tursoDBParams = {
  url: turso.url,
  authToken: turso.authToken,
} satisfies Config;

const client = createClient({
  ...(isTesting ? testDBParams : useLocalDb ? localDBParams() : tursoDBParams),
});

export const db = drizzle(client);
