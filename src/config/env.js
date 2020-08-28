import "dotenv/config";

const Env = {
  /**
   * Use env variable
   * @param {string} name
   * @param {string} fallback
   */
  use(name, fallback) {
    const isBoolean = typeof fallback == "boolean";
    const envValue = process?.env?.[name] || fallback;

    return isBoolean ? Boolean(envValue) : envValue;
  },
};

export default Env;
