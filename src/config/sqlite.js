import Knex from "knex";

export const db = Knex({
  client: "sqlite3",
  connection: {
    filename: "./__db__/database.dev.sqlite3",
  },
  useNullAsDefault: true,
});
