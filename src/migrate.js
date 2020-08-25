import { init, client as r } from "@src/config/rethink.js";

import Env from "@src/config/env.js";
import { signale, logInfo } from "@src/config/signale.js";

async function main() {
  const connection = await init();
  const databaseName = Env.use("RETHINKDB_DB", "bandwidth-hero-db");

  const isAvailable = await r
    .table("users")
    .indexWait("createdAt")
    .run(connection)
    .catch((error) => false);

  if (isAvailable) {
    signale.success(
      `[MIGRATE] DB is already exists skipping migration process`
    );
    return;
  }

  logInfo(["MIGRATE"], "DB is unavailable, create one");

  try {
    await r.dbCreate(databaseName).run(connection);
    await r.tableCreate("users").run(connection);
    await r.tableCreate("statistics").run(connection);

    logInfo(["MIGRATE"], "DB created, table created");

    await Promise.all([
      r.table("users").indexCreate("createdAt").run(connection),
      r.table("statistics").indexCreate("updatedAt").run(connection),
    ]);
    await Promise.all([
      r.table("statistics").indexWait("updatedAt").run(connection),
      r.table("statistics").indexWait("updatedAt").run(connection),
    ]);

    logInfo(["MIGRATE"], "DB Table indexWait created");
    signale.success("[MIGRATE] Operation successfuly");
  } catch (err) {
    signale.error("[MIGRATE] Could not run operations");
    signale.error(err);
  }
}

main().catch((error) => {
  signale.error(`[MIGRATE] error migration`);
  signale.error(error);
});
