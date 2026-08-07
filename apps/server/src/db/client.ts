import { Config, createClient } from "@libsql/client";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { drizzle } from "drizzle-orm/libsql";
import { getEnvironmentVariables } from "../common/config/environment";

const { useLocalDb, localDbPath, turso } = getEnvironmentVariables();

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

const client = createClient(useLocalDb ? localDBParams() : tursoDBParams);

export const db = drizzle(client);

/**
 * Prove the database answers before the app claims to be up. Creating the client
 * connects to nothing — with Turso the first real failure would otherwise be a
 * user's message, long after a bad URL or an expired token slipped into a deploy.
 */
export async function assertDatabaseReachable(): Promise<void> {
  await client.execute("select 1");
}

/** Release the connection on shutdown; the client is otherwise open for the process's life. */
export async function closeDatabase(): Promise<void> {
  client.close();
}
