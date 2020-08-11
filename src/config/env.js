import dotenv from "dotenv";

dotenv.config({ silent: true });

const Env = {
  /**
   * Use env variable
   * @param {string} name
   * @param {string} fallback
   */
  use(name, fallback = "") {
    return process?.env?.[name] || fallback;
  },
};

export default Env;
