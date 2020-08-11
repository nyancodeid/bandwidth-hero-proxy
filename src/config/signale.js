import { Signale } from "signale";

const options = {};

export const signale = new Signale(options);

/**
 * Log info with service name
 * @param {string|string[]} services
 * @param {string} message
 * @return {string}
 */
export const logInfo = (services, message) => {
  services = typeof services === "string" ? [services] : services;

  const logName = services.map((service) => `[${service}]`).join("");
  const logMessage = `${logName} ${message}`;

  signale.info(logMessage);

  return logMessage;
};
