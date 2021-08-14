import Env from "@src/config/env.js";
import { signale } from "@src/config/signale.js";

import path from "path";
import express from "express";
import csrf from "csurf";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import { HELMET_CONFIGURATION_OPTIONS } from "@src/config/app.js";

import * as middleware from "@src/middleware/index.js";
import * as compress from "@src/controllers/compress.js";
import * as admin from "@src/controllers/admin.js";

const SERVER_PORT = Env.use("PORT", 3060);

const app = express();
const csrfProtection = csrf({ cookie: true });
const helmetProtection = helmet(HELMET_CONFIGURATION_OPTIONS);

app.disable("x-powered-by");
app.enable("trust proxy");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.get(
  "/s/:username/:token",
  [middleware.authenticate, middleware.params],
  compress.controller
);

app.get(
  "/admin/users",
  [middleware.adminAuthenticate, csrfProtection, helmetProtection],
  admin.getAllUser
);
app.get(
  "/admin/user",
  [middleware.adminAuthenticate, csrfProtection, helmetProtection],
  admin.createUserView
);
app.post(
  "/admin/api/user",
  [csrfProtection, helmetProtection],
  admin.createUser
);
app.post(
  "/admin/api/token",
  [csrfProtection, helmetProtection],
  admin.regenerateUserToken
);

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.listen(SERVER_PORT, () => signale.success(`Listening on :${SERVER_PORT}`));
