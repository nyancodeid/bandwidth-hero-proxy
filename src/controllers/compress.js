/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import request from "request";
import { pick } from "lodash";

import {
  redirect,
  copyHeaders,
  shouldCompress,
  bypass,
  compress,
} from "@src/utils/index.js";

/**
 * @function
 * @param {Request} req
 * @param {Response} res
 */
export const controller = (req, res) => {
  request.get(
    req.params.url,
    {
      headers: {
        ...pick(req.headers, ["cookie", "dnt", "referer"]),
        "user-agent": "Bandwidth-Hero Compressor",
        "x-forwarded-for": req.headers["x-forwarded-for"] || req.ip,
        via: "1.1 bandwidth-hero",
      },
      timeout: 10000,
      maxRedirects: 5,
      encoding: null,
      strictSSL: false,
      gzip: true,
      jar: true,
    },
    (err, origin, buffer) => {
      if (err || origin.statusCode >= 400) return redirect(req, res);

      copyHeaders(origin, res);

      res.setHeader("content-encoding", "identity");
      req.params.originType = origin.headers["content-type"] || "";
      req.params.originSize = buffer.length;

      if (!shouldCompress(req)) {
        return bypass(req, res, buffer);
      }

      return compress(req, res, buffer);
    }
  );
};
