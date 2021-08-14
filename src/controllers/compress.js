/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import { storeBypassedSite, isSiteBypassed } from "@src/services/database";
import {
  redirect,
  copyHeaders,
  shouldCompress,
  bypass,
  compress,
  fetchImage,
} from "@src/utils/index.js";
import md5 from "md5";
import signale from "signale";

/**
 * @function
 * @param {Request} req
 * @param {Response} res
 */
export const controller = async (req, res) => {
  const hash = md5(req.params.url);
  const [error, isBypassed] = await isSiteBypassed(hash);

  if (error || isBypassed) return redirect(req, res);

  const { action, data } = await fetchImage(req);

  if (action === "REDIRECT") {
    await storeBypassedSite(hash);

    return redirect(req, res);
  }

  copyHeaders(data.origin, res);

  req.params.originType = data.origin.headers["content-type"] || "";
  req.params.originSize = data.buffer.length;

  if (!shouldCompress(req)) return bypass(req, res, data.buffer);

  return compress(req, res, data.buffer);
};
