/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import sharp from "sharp";
import prettyByte from "pretty-bytes";
import chalk from "chalk";
import request from "request";
import pick from "lodash/pick";

import Env from "@src/config/env.js";
import { signale } from "@src/config/signale.js";
import {
  findStatistics,
  storeBypassedSite,
  updateStatisticById,
} from "@src/services/database.js";
import { WHITELIST_EXTENSION } from "@src/config/app.js";
import md5 from "md5";

const MIN_COMPRESS_LENGTH = Env.use("APP_MIN_COMPRESS_LENGTH");
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

export const fetchImage = (req) => {
  return new Promise((resolve) => {
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
        if (err || origin.statusCode >= 400) {
          return resolve({ action: "REDIRECT", data: {} });
        }

        return resolve({ action: "NEXT", data: { origin, buffer } });
      }
    );
  });
};

/**
 * @function
 * @param {Object} source
 * @param {Response} res
 */
export const copyHeaders = (source, res) => {
  for (const [key, value] of Object.entries(source.headers)) {
    try {
      res.setHeader(key, value);
    } catch (e) {
      signale.error(e.message);
    }
  }
};

/**
 *
 * @param {Request} req
 * @return {Boolean}
 */
export const shouldCompress = (req) => {
  const { originType, originSize, webp } = req.params;
  const whiteListCheck = WHITELIST_EXTENSION.filter((ext) => {
    return originType.startsWith(ext) || originType.includes(ext);
  });

  if (!originType.startsWith("image")) return false;
  if (whiteListCheck.length > 0) return false;

  if (originSize === 0) return false;
  if (webp && originSize < MIN_COMPRESS_LENGTH) return false;
  if (
    !webp &&
    (originType.endsWith("png") || originType.endsWith("gif")) &&
    originSize < MIN_TRANSPARENT_COMPRESS_LENGTH
  ) {
    return false;
  }

  return true;
};

/**
 * @function
 * @param {Request} req
 * @param {Response} res
 * @param {Buffer} buffer
 */
export const compress = (req, res, buffer) => {
  const format = req.params.webp ? "webp" : "jpeg";
  const host = new URL(req.params.url);

  const options = {
    webp: {
      lossless: req.params.quality == 80,
    },
    jpeg: {
      progressive: true,
      optimizeScans: true,
    },
  };

  const formatOption = Object.assign(
    {
      quality: req.params.quality,
    },
    options[format]
  );

  sharp(buffer)
    .grayscale(req.params.grayscale)
    .toFormat(format, formatOption)
    .toBuffer({
      resolveWithObject: true,
    })
    .then(({ data: output, info }) => {
      if (!info || res.headersSent) return redirect(req, res);

      const saved = req.params.originSize - info.size;
      const percentage =
        ((info.size - req.params.originSize) / req.params.originSize) * 100;

      if (saved < 1) return bypass(req, res, buffer);

      const percentageText =
        percentage > 0
          ? chalk.red(percentage.toFixed(1) + "%")
          : chalk.green(percentage.toFixed(1) + "%");

      signale.info(
        `[${host.hostname}]${
          req.params.grayscale ? "[BW]" : ""
        } Compression successfully CHANGE:[${chalk.yellow(
          prettyByte(req.params.originSize)
        )} -> ${chalk.yellow(prettyByte(info.size))}] SAVE:[${chalk.green(
          prettyByte(saved)
        )}] PERC:[${percentageText}]`
      );

      const userId = req.userId;

      incrementState({
        userId,
        byte: req.params.originSize,
        saveByte: saved,
        status: "compressed",
      }).catch((error) => {
        signale.error(`[INC#ERR][STATE][${userId}] Error while update state`);
        signale.error(error);
      });

      res.setHeader("content-type", `image/${format}`);
      res.setHeader("content-length", info.size);
      res.setHeader("x-original-size", req.params.originSize);
      res.setHeader("x-bytes-saved", saved);
      res.status(200);
      res.write(output);
      res.end();
    })
    .catch((error) => {
      return redirect(req, res, buffer);
    });
};

/**
 * @function
 * @param {Request} req
 * @param {Response} res
 * @param {Buffer} buffer
 */
export const bypass = (req, res, buffer) => {
  const host = new URL(req.params.url);

  signale.info(
    `[${host.hostname}] Compression bypassed CHANGE:[${chalk.yellow(
      prettyByte(req.params.originSize)
    )}]`
  );

  const userId = req.userId;

  incrementState({
    userId,
    byte: buffer.length,
    saveByte: 0,
    status: "bypass",
  }).catch((error) => {
    signale.error(`[INC#ERR][STATE][${userId}] Error while update state`);
    signale.error(error);
  });

  storeBypassedSite(md5(req.params.url)).catch(() => {
    signale.error(`[BYPS#ERR][STATE][${hash}] Error while update state`);
  });

  res.setHeader("x-proxy-bypass", 1);
  res.setHeader("content-length", buffer.length);
  res.status(200);
  res.write(buffer);
  res.end();
};

/**
 * @function
 * @param {Object} data
 * @param {string} data.userId
 * @param {number} data.byte
 * @param {number} data.saveByte
 * @param {string} data.status
 * @param {RConnection} connection
 * @return {Promise}
 */
export const incrementState = async ({ userId, byte, saveByte, status }) => {
  try {
    const [error, stat] = await findStatistics({
      user_id: userId,
    });

    if (error) return;

    const update = {
      processed: stat.processed + 1,
      bypassed: status == "bypass" ? stat.bypassed + 1 : stat.bypassed,
      compressed:
        status == "compressed" ? stat.compressed + 1 : stat.compressed,
      byte_total: stat.byte_total + byte,
      byte_save_total: stat.byte_save_total + saveByte,
      updated_at: Date.now(),
    };

    return updateStatisticById(stat.id, update);
  } catch (error) {
    signale.error(error);
  }
};

/**
 * @function
 * @param {Request} req
 * @param {Response} res
 */
export const redirect = (req, res) => {
  const host = new URL(req.params.url);

  if (res.headersSent) return;

  storeBypassedSite(md5(req.params.url)).catch(() => {
    signale.error(`[BYPS#ERR][STATE][${hash}] Error while update state`);
  });

  res.setHeader("content-length", 0);
  res.removeHeader("cache-control");
  res.removeHeader("expires");
  res.removeHeader("date");
  res.removeHeader("etag");
  res.setHeader("location", encodeURI(req.params.url));
  res.status(302).end();
};

/**
 * @function
 * @param {Response} res
 */
export const accessDenied = (res, basic = true) => {
  if (basic)
    res.setHeader(
      "WWW-Authenticate",
      `Basic realm="Bandwidth-Hero Compression Service"`
    );

  return res.status(401).end("Access denied");
};
