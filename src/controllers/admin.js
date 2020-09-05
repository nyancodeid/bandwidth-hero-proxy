/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import bcrypt from "bcrypt";
import prettyByte from "pretty-bytes";

import { signale } from "@src/config/signale.js";
import { client as r } from "@src/config/rethink.js";
import { generateToken } from "@src/utils/admin.js";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Get all registered users
 * @view
 * @param {Request} req
 * @param {Response} res
 */
export const getAllUser = async (req, res) => {
  try {
    const results = await r
      .table("statistics")
      .eqJoin("user_id", r.table("users"))
      .zip()
      .orderBy("createdAt")
      .run(req._connection)
      .then((res) => res.toArray());

    const users = results.map((user) => {
      return {
        username: user.username,
        email: user.email,
        token: user.token,
        stat: {
          processed: Number(user.processed).toLocaleString(),
          bypassed: Number(user.bypassed).toLocaleString(),
          compressed: Number(user.compressed).toLocaleString(),
          byteTotal: prettyByte(parseInt(user.byteTotal)),
          byteSaveTotal: prettyByte(parseInt(user.byteSaveTotal)),
          percentage: (
            ((parseInt(user.byteSaveTotal) - parseInt(user.byteTotal)) /
              parseInt(user.byteTotal)) *
              100 +
            100
          ).toFixed(0),
        },
        createdAt: user.createdAt,
        regeneratedTokenAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    });

    res.render("users", { users, csrfToken: req.csrfToken() });
  } catch (err) {
    res.status(500).send("Internal Server Error");
    signale.error(err);
  }
};

/**
 * Create user view form
 * @view
 * @param {Request} req
 * @param {Response} res
 */
export const createUserView = (req, res) => {
  res.render("create-user", { csrfToken: req.csrfToken() });
};

/**
 * Create user POST Handler
 * @rest
 * @controller
 * @param {Request} req
 * @param {Response} res
 */
export const createUser = async (req, res) => {
  const { username, password, email } = req.body;
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const user = await r
    .table("users")
    .filter({
      username,
    })
    .run(req._connection);

  const token = generateToken({ username, length: 6 });
  const availableUser = await user.toArray();

  if (availableUser.length > 0)
    return res.send(`user "${username}" already available!`);

  const userInput = await r
    .table("users")
    .insert({
      username,
      email,
      password: passwordHash,
      token,
      createdAt: r.now(),
      regeneratedTokenAt: r.now(),
      lastLoginAt: r.now(),
    })
    .run(req._connection);

  const [userId] = userInput.generated_keys;

  await r
    .table("statistics")
    .insert({
      user_id: userId,
      processed: 0,
      bypassed: 0,
      compressed: 0,
      byteTotal: 0,
      byteSaveTotal: 0,
      updatedAt: r.now(),
    })
    .run(req._connection);

  return res.status(201).send("Created");
};

/**
 * Regenerate user token POST Handler
 * @rest
 * @controller
 * @param {Request} req
 * @param {Response} res
 */
export const regenerateUserToken = async (req, res) => {
  const { username, email } = req.body;

  const token = generateToken({ username, length: 6 });

  await r
    .table("users")
    .filter({
      username,
      email,
    })
    .update({
      token,
      regeneratedTokenAt: r.now(),
    })
    .run(req._connection);

  return res.status(200).send("Operation successful");
};
