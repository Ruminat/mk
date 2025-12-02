import { Config, createClient } from "@libsql/client";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";

config({ path: ".env" });

const isTesting = false;

const realDBParams = {
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
} satisfies Config;

const testDBParams = {
  url: ":memory:",
} satisfies Config;

const client = createClient({
  ...(isTesting ? testDBParams : realDBParams),
});

export const db = drizzle(client);
