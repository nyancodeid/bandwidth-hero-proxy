import { expect } from "chai";

import * as Log from "@src/config/signale.js";
import { Signale } from "signale";

describe("Signale Config Test", () => {
  it("it will be instanceOf Signale", () => {
    expect(Log.signale).to.be.an.instanceOf(Signale);
  });
  it("it will be run logInfo using string", () => {
    const expected = `[APP] Simple message log`;
    const message = Log.logInfo("APP", "Simple message log");

    expect(Log.logInfo).to.be.a("function");
    expect(message).to.equal(expected);
  });
  it("it will be run logInfo using array of string", () => {
    const expected = `[APP][CONFIG] Simple message log from config`;
    const message = Log.logInfo(
      ["APP", "CONFIG"],
      "Simple message log from config"
    );

    expect(Log.logInfo).to.be.a("function");
    expect(message).to.equal(expected);
  });
});
