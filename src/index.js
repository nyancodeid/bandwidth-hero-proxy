import { signale, logInfo } from "@src/config/signale.js";
import Env from "@src/config/env.js";

logInfo("APP", `App Key: ${Env.use("APP_KEY")}`);
signale.info(`[APP] It's work!`);
