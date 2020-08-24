/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import sharp from "sharp";
import prettyByte from "pretty-bytes";
import chalk from "chalk";
import * as redis from "@src/config/redis.js";

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

  if (!originType.startsWith("image")) return false;
  if (WHITELIST_EXTENSION.includes(originType)) return false;

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

  res.setHeader("x-proxy-bypass", 1);
  res.setHeader("content-length", buffer.length);
  res.status(200);
  res.write(buffer);
  res.end();
};

export const incrementState = async ({ userId, byte, saveByte, status }) => {
  try {
    const stat = await redis.getAsync(`statistic:${userId}`);
    const [
      processed,
      bypass,
      compressed,
      byteTotal,
      saveByteTotal,
    ] = stat.split(":");

    const update = [
      parseInt(processed) + 1,
      status == "bypass" ? parseInt(bypass) + 1 : bypass,
      status == "compressed" ? parseInt(compressed) + 1 : compressed,
      parseInt(byteTotal) + parseInt(byte),
      parseInt(saveByteTotal) + parseInt(saveByte),
    ];

    await redis.setAsync(`statistic:${userId}`, update.join(":"));
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
export const accessDenied = (res) => {
  res.setHeader(
    "WWW-Authenticate",
    `Basic realm="Bandwidth-Hero Compression Service"`
  );

  return res.status(401).end("Access denied");
};
