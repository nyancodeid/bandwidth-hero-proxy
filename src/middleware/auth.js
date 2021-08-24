/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

import auth from "basic-auth";

import Env from "@src/config/env.js";
import { accessDenied } from "@src/utils/index.js";
import { findUser } from "@src/services/database";

/**
 * @middleware
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const authenticate = async (req, res, next) => {
  const { username, token } = req.params;

  if (!username) return accessDenied(res, false);

  const [error, user] = await findUser({ username, token });

  if (error || !user) return accessDenied(res, false);

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
  const adminCredential = Env.use("APP_KEY", "admin:admin");
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
