import md5 from "md5";
import { v4 as uuid } from "uuid";

/**
 * Generate user token
 * @param {Object} data
 * @param {string} data.username
 * @param {number} data.length
 * @return {string}
 */
export const generateToken = ({ username, length }) => {
  const raw = `${username}${Date.now()}`;

  return md5(raw).toString().slice(0, length);
};

export const generateUserId = () => {
  return uuid();
};
