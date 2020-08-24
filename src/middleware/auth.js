import auth from "basic-auth";
import bcrypt from "bcrypt";

import Env from "@src/config/env.js";
import { accessDenied } from "@src/utils/index.js";
import * as redis from "@src/config/redis.js";

export const authenticate = async (req, res, next) => {
  const userId = req.params.userId;

  if (!userId) return res.status(401).end("Access denied");

  const user = await redis.getAsync(`user:${userId}`);

  if (!user) return res.status(401).end("Access denied");

  const [username, email, password, createdAt] = user.split(":");

  const credentials = auth(req);

  if (!credentials) {
    return accessDenied(res);
  }

  const isMatch = await bcrypt.compare(credentials.pass, password);

  if (!isMatch || credentials.name !== username) {
    return accessDenied(res);
  }

  await redis.setAsync(
    `user:${userId}`,
    [username, email, password, createdAt, Date.now()].join(":")
  );

  req.userId = userId;
  req.user = { username, password };

  next();
};

export const adminAuthenticate = (req, res, next) => {
  const adminCredential = Env.use("APP_KEY");
  const [username, password] = adminCredential.split(":");

  const credentials = auth(req);
  if (
    !credentials ||
    credentials.name !== username ||
    credentials.pass !== password
  ) {
    res.setHeader(
      "WWW-Authenticate",
      'Basic realm="Access to the staging site"'
    );

    return res.status(401).end("Access denied");
  }

  req.user = { username, password };

  next();
};
