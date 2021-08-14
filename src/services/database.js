import { db } from "@src/config/sqlite";
import { generateToken, generateUserId } from "@src/utils/admin.js";

/**
 * @typedef {Promise<[?Error, (?Object.<string, any>|?Object.<string, any>[])]>} TWrapper
 */

/**
 * Find user with where parameters
 * @param {Object} where
 * @returns
 */
export const findUser = (where) => {
  return wrapper(() => db.table("users").where(where).first());
};

/**
 * Check is username available to use
 * @param {String} username
 * @returns
 */
export const isUsernameAvailable = (username) => {
  return wrapper(() =>
    db.table("users").select("id").where({ username }).first()
  );
};

/**
 * Get user data
 * @param {String} id uuid
 * @returns
 */
export const getUser = (id) => {
  return wrapper(() => db.table("users").where({ id }).first());
};

/**
 * Create user data and initialize statistics
 * @param {Object} param username, email, password
 * @returns
 */
export const createUser = ({ username, email, password }) => {
  const userId = generateUserId();
  const token = generateToken({ username, length: 6 });
  const tasks = db
    .table("users")
    .insert({
      id: userId,
      username,
      email,
      password,
      token,
      created_at: Date.now(),
      updated_at: Date.now(),
      last_login_at: Date.now(),
    })
    .then(() => initializeUserStatistics(userId));

  return wrapper(() => tasks);
};

/**
 * Regenerate user token and store it in database
 * @param {Object} param username, email, token
 * @returns
 */
export const regenerateUserToken = ({ username, email, token }) => {
  return wrapper(() => db.table("users").where({ username, email })).update({
    token,
    updated_at: Date.now(),
  });
};

/**
 * Update user last login timestamp in database
 * @param {String} userId
 * @returns
 */
export const updateUserLastLogin = (userId) => {
  return wrapper(() =>
    db
      .table("users")
      .where({ user_id: userId })
      .update({ last_login_at: Date.now() })
  );
};

/**
 * Get all statistics for users
 * @returns
 */
export const getStatisticsWithUser = () => {
  return wrapper(() =>
    db
      .table("statistics")
      .join("users", "users.id", "=", "statistics.user_id")
      .orderBy("created_at")
  );
};

/**
 * Find statistics data using where operator
 * @param {Object} where
 * @returns
 */
export const findStatistics = (where) => {
  return wrapper(() => db.table("statistics").where(where).limit(1).first());
};

/**
 * Update statistics data with id
 * @param {Number} id
 * @param {Object.<string, any>} data
 * @returns
 */
export const updateStatisticById = (id, data) => {
  return wrapper(() => db.table("statistics").where({ id }).update(data));
};
/**
 * Initialize user statistics
 * @param {String} userId
 * @returns
 */
export const initializeUserStatistics = (userId) => {
  return wrapper(() =>
    db.table("statistics").insert({
      user_id: userId,
      processed: 0,
      bypassed: 0,
      compressed: 0,
      byte_total: 0,
      byte_save_total: 0,
      updated_at: Date.now(),
    })
  );
};

export const storeBypassedSite = (hash) => {
  return wrapper(() => db.table("bypassed").insert({ hash, hit: 0 }));
};

export const isSiteBypassed = (hash) => {
  const tasks = db
    .table("bypassed")
    .where({ hash })
    .first()
    .then(async (site) => {
      if (site) {
        await db
          .table("bypassed")
          .where({ id: site.id })
          .update({
            hit: parseInt(site.hit) + 1,
          });

        return true;
      }

      return false;
    });

  return wrapper(() => tasks);
};

/**
 *
 * @param {Promise} process
 * @returns {TWrapper}
 */
const wrapper = async (process) => {
  try {
    const result = await process();

    return [null, result];
  } catch (error) {
    return [error, null];
  }
};
