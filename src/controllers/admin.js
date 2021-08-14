/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 */

import bcrypt from "bcrypt";
import prettyByte from "pretty-bytes";

import { signale } from "@src/config/signale.js";
import { generateToken } from "@src/utils/admin.js";
import {
  createUser as createUserData,
  isUsernameAvailable,
  regenerateUserToken as regenerateUserTokenData,
  getStatisticsWithUser,
} from "@src/services/database.js";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Get all registered users
 * @view
 * @param {Request} req
 * @param {Response} res
 */
export const getAllUser = async (req, res) => {
  try {
    const [error, results] = await getStatisticsWithUser();

    const users = results.map((user) => {
      return {
        username: user.username,
        email: user.email,
        token: user.token,
        stat: {
          processed: Number(user.processed).toLocaleString(),
          bypassed: Number(user.bypassed).toLocaleString(),
          compressed: Number(user.compressed).toLocaleString(),
          byte_total: prettyByte(parseInt(user.byte_total)),
          byte_save_total: prettyByte(parseInt(user.byte_save_total)),
          percentage:
            (
              ((parseInt(user.byte_save_total) - parseInt(user.byte_total)) /
                parseInt(user.byte_total)) *
                100 +
              100
            ).toFixed(0) | 0,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login_at: user.last_login_at,
      };
    });

    res.render("users", {
      users: Buffer.from(JSON.stringify(users)).toString("base64"),
      csrfToken: req.csrfToken(),
    });
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

  const [_, isAvailable] = await isUsernameAvailable(username);

  if (isAvailable)
    return res.json({
      _s: false,
      message: `user "${username}" already available!`,
    });

  const [error] = await createUserData({
    username,
    email,
    password: passwordHash,
  });

  if (error)
    return res.status(500).json({
      _s: false,
      error,
    });

  return res.status(201).json({
    _s: true,
    message: "Created",
  });
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

  const [error] = await regenerateUserTokenData({ username, email, token });

  if (error)
    return res.status(500).json({
      _s: false,
      error,
    });

  return res.status(200).json({
    _s: true,
    message: "Operation successful",
    token,
  });
};
