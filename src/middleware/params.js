/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

import Env from "@src/config/env.js";
import { updateUserLastLogin } from "@src/services/database";

/**
 * @middleware
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export const params = async (req, res, next) => {
  let url = req.query?.url;
  if (Array.isArray(url)) {
    url = url.join("&url=");
  }

  /**
   * When url goes empty or undefined it's marked as service-discover
   * return string "bandwidth-hero-proxy".
   */
  if (!url) {
    await updateUserLastLogin(req.userId);

    return res.end("bandwidth-hero-proxy");
  }

  url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, "http://");
  req.params.url = url;
  req.params.webp = !req.query?.jpeg;
  req.params.grayscale = req.query?.bw != 0;
  req.params.quality =
    Number(req.query?.l) || Number(Env.use("APP_DEFAULT_QUALITY", 40));

  next();
};
