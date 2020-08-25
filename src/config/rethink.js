import r from "rethinkdb";

import Env from "@src/config/env.js";
import { signale, logInfo } from "@src/config/signale.js";

const options = {
  host: Env.use("RETHINKDB_HOST", "localhost"),
  port: Env.use("RETHINKDB_PORT", "28015"),
  db: Env.use("RETHINKDB_DB", "bandwidth-hero-db"),
};

let connection = null;

export const init = () => {
  if (!connection) {
    return r
      .connect(options)
      .then((conn) => {
        logInfo([`RETHINKDB`], `RethinkDB connection established`);

        connection = conn;
        return conn;
      })
      .catch((error) => {
        logInfo([`RETHINKDB`], `RethinkDB connection error`);
        signale.error(error);
      });
  }

  return connection;
};

export const client = r;

export const middleware = async (req, res, next) => {
  try {
    req._connection = await init();
    next();
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};
