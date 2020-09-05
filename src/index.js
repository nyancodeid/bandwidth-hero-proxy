import Env from "@src/config/env.js";
import { signale } from "@src/config/signale.js";

import path from "path";
import express from "express";
import csrf from "csurf";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import { HELMET_CONFIGURATION_OPTIONS } from "@src/config/app.js";
import { middleware as initializeDatabase } from "@src/config/rethink.js";

import * as middleware from "@src/middleware/index.js";
import * as compress from "@src/controllers/compress.js";
import * as admin from "@src/controllers/admin.js";

const SERVER_PORT = Env.use("PORT", 3060);

const app = express();

app.disable("x-powered-by");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.enable("trust proxy");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

const csrfProtection = csrf({ cookie: true });

app.use(initializeDatabase);

app.get(
  "/s/:username/:token",
  [middleware.authenticate, middleware.params],
  compress.controller
);

app.get(
  "/admin/users",
  [middleware.adminAuthenticate, csrfProtection],
  admin.getAllUser
);
app.get(
  "/admin/user",
  [middleware.adminAuthenticate, csrfProtection],
  admin.createUserView
);
app.post("/admin/api/user", [csrfProtection], admin.createUser);
app.post("/admin/api/token", [csrfProtection], admin.regenerateUserToken);

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.listen(SERVER_PORT, () => signale.success(`Listening on :${SERVER_PORT}`));
