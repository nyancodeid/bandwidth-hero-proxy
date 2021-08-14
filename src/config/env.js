import "dotenv/config";

const Env = {
  /**
   * Use env variable
   * @param {string} name
   * @param {string|boolean|number} fallback
   */
  use(name, fallback) {
    const isBoolean = typeof fallback == "boolean";
    const value = process?.env?.[name] || fallback;

    return isBoolean ? Boolean(value) : value;
  },
};

export default Env;
