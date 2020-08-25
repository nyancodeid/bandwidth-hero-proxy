import { expect } from "chai";

import Env from "@src/config/env.js";

describe("Env Config Test", () => {
  it("it will be function", () => {
    expect(Env.use).to.be.a("function");
  });
  it("it will be get APP_KEY key", () => {
    expect(Env.use("APP_KEY")).to.equal("admin:admin");
  });
});
