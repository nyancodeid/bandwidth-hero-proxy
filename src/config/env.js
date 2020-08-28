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

    return isBoolean
      ? parseInt(envValue) > 1
        ? parseInt(envValue)
        : Boolean(parseInt(envValue))
      : envValue;
  },
};

export default Env;
