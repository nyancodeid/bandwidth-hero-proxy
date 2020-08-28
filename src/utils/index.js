/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('rethinkdb').Connection} RConnection
 */

import sharp from "sharp";
import prettyByte from "pretty-bytes";
import chalk from "chalk";
import { client as r } from "@src/config/rethink.js";

import { signale } from "@src/config/signale.js";
import Env from "@src/config/env.js";
import { WHITELIST_EXTENSION } from "@src/config/app.js";

const MIN_COMPRESS_LENGTH = Env.use("APP_MIN_COMPRESS_LENGTH");
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

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
 * @param {Request} request
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

  sharp(buffer)
    .grayscale(req.params.grayscale)
    .toFormat(format, {
      quality: req.params.quality,
      progressive: true,
      optimizeScans: true,
    })
    .toBuffer((err, output, info) => {
      if (err || !info || res.headersSent) return redirect(req, res);

      const saved = req.params.originSize - info.size;
      const percentage =
        ((info.size - req.params.originSize) / req.params.originSize) * 100;

      const percentageText =
        percentage > 0
          ? chalk.red(percentage.toFixed(1) + "%")
          : chalk.green(percentage.toFixed(1) + "%");

      signale.info(
        `[${host.hostname}] Compression successfuly CHANGE:[${chalk.yellow(
          prettyByte(req.params.originSize)
        )} -> ${chalk.yellow(prettyByte(info.size))}] SAVE:[${chalk.green(
          prettyByte(saved)
        )}] PERC:[${percentageText}]`
      );

      const userId = req.userId;

      incrementState(
        {
          userId,
          byte: req.params.originSize,
          saveByte: saved,
          status: "compressed",
        },
        req._connection
      ).catch((error) => {
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

  incrementState(
    {
      userId,
      byte: buffer.length,
      saveByte: 0,
      status: "bypass",
    },
    req._connection
  ).catch((error) => {
    signale.error(`[INC#ERR][STATE][${userId}] Error while update state`);
    signale.error(error);
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
export const incrementState = async (
  { userId, byte, saveByte, status },
  connection
) => {
  try {
    const stat = await r
      .table("statistics")
      .filter({
        user_id: userId,
      })
      .nth(0)
      .default(null)
      .run(connection);

    if (!stat) return;

    const update = {
      processed: stat.processed + 1,
      bypassed: status == "bypass" ? stat.bypassed + 1 : stat.bypassed,
      compressed:
        status == "compressed" ? stat.compressed + 1 : stat.compressed,
      byteTotal: stat.byteTotal + byte,
      byteSaveTotal: stat.byteSaveTotal + saveByte,
      updatedAt: r.now(),
    };

    await r.table("statistics").get(stat.id).update(update).run(connection);
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
  if (res.headersSent) return;

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
