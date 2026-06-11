import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

type Db = LibSQLDatabase<typeof schema>;

let _client: Client | undefined;
let _db: Db | undefined;

function init(): Db {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TURSO_DATABASE_URL is not set. Add it to .env.local (see .env.local.example).",
    );
  }
  _client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return drizzle(_client, { schema });
}

// Lazy init via Proxy: defers env-var validation until first use so that
// Next.js build-time route discovery (which imports server files) doesn't
// throw on Vercel before env vars resolve.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    if (!_db) _db = init();
    return Reflect.get(_db, prop);
  },
});

export { schema };
