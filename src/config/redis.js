import redis from "redis";
import { promisify } from "util";

import { logInfo } from "@src/config/signale.js";
import Env from "@src/config/env.js";

const ONE_HOURS = 1000 * 60 * 60;
const options = {
  host: Env.use("REDIS_HOST"),
  port: Env.use("REDIS_PORT"),
  password: Env.use("REDIS_PASSWORD"),
  retry_strategy: function (options) {
    if (options.error && options.error.code === "ECONNREFUSED") {
      // End reconnecting on a specific error and flush all commands with
      // a individual error
      return new Error("The server refused the connection");
    }
    if (options.total_retry_time > ONE_HOURS) {
      // End reconnecting after a specific timeout and flush all commands
      // with a individual error
      return new Error("Retry time exhausted");
    }
    if (options.attempt > 10) {
      // End reconnecting with built in error
      return undefined;
    }
    // reconnect after
    return Math.min(options.attempt * 100, 3000);
  },
};

export const client = redis.createClient(options);

export const getAsync = promisify(client.get).bind(client);
export const setAsync = promisify(client.set).bind(client);
export const scanAsync = promisify(client.scan).bind(client);

client.on("connect", () => {
  logInfo([`REDIS`], `Redis Client connection established`);
});
