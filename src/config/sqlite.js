import Knex from "knex";
import Env from "@src/config/env.js";

const DATABASE_NAME = Env.use("DB_FILENAME");

export const db = Knex({
  client: "sqlite3",
  connection: {
    filename: "./__db__/" + DATABASE_NAME,
  },
  useNullAsDefault: true,
});
