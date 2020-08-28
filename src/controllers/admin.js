/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import bcrypt from "bcrypt";
import prettyByte from "pretty-bytes";
import md5 from "md5";

import { signale } from "@src/config/signale.js";
import { client as r } from "@src/config/rethink.js";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Get all registered users
 * @controller
 * @param {Request} req
 * @param {Response} res
 */
export const getAllUser = async (req, res) => {
  try {
    const results = await r
      .table("statistics")
      .eqJoin("user_id", r.table("users"))
      .zip()
      .run(req._connection)
      .then((res) => res.toArray());

    const users = results.map((user) => {
      return {
        username: user.username,
        email: user.email,
        token: user.token,
        stat: {
          processed: user.processed,
          bypassed: user.bypassed,
          compressed: user.compressed,
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
        lastLoginAt: user.lastLoginAt,
      };
    });

    res.render("users", { users });
  } catch (err) {
    res.status(500).send("Internal Server Error");
    signale.error(err);
  }
};

/**
 * Create user view form
 * @controller
 * @param {Request} req
 * @param {Response} res
 */
export const createUserView = (req, res) => {
  res.render("create-user", { csrfToken: req.csrfToken() });
};

/**
 * Create user POST Handler
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
  const token = md5(`${username}:${email}`).toString();

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
      lastLoginAt: r.now(),
    })
    .run(req._connection);

  await r
    .table("statistics")
    .insert({
      user_id: userInput.generated_keys[0],
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
