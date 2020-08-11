import { Signale } from "signale";

const options = {};

export const signale = new Signale(options);

/**
 * Log info with service name
 * @param {string} service
 * @param {string} message
 */
export const logInfo = (service, message) =>
  signale.info(`[${service}] ${message}`);
