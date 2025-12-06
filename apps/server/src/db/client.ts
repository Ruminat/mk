import { Config, createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { getEnvironmentVariables } from "../common/environment";

const { turso } = getEnvironmentVariables();

const isTesting = false;

const testDBParams = {
  url: ":memory:",
} satisfies Config;

const realDBParams = {
  url: turso.url,
  authToken: turso.authToken,
} satisfies Config;

const client = createClient({
  ...(isTesting ? testDBParams : realDBParams),
});

export const db = drizzle(client);
