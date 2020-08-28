/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

import auth from "basic-auth";

import Env from "@src/config/env.js";
import { accessDenied } from "@src/utils/index.js";
import { client as r } from "@src/config/rethink.js";

/**
 * @middleware
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const authenticate = async (req, res, next) => {
  const { username, token } = req.params;

  if (!username) return accessDenied(res, false);

  const user = await r
    .table("users")
    .filter({
      username,
    })
    .nth(0)
    .default(null)
    .run(req._connection);

  if (!user) return accessDenied(res, false);

  if (username !== user.username || token !== user.token) {
    return accessDenied(res, false);
  }

  await r
    .table("users")
    .get(user.id)
    .update({ lastLoginAt: r.now() })
    .run(req._connection);

  req.userId = user.id;
  req.user = user;

  next();
};

/**
 * @middleware
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const adminAuthenticate = (req, res, next) => {
  const adminCredential = Env.use("APP_KEY");
  const [username, password] = adminCredential.split(":");

  const credentials = auth(req);
  if (
    !credentials ||
    credentials.name !== username ||
    credentials.pass !== password
  ) {
    return accessDenied(res);
  }

  req.user = { username, password };

  next();
};
