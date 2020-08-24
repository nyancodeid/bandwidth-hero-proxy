import Env from "@src/config/env.js";

export const params = (req, res, next) => {
  let url = req.query.url;
  if (Array.isArray(url)) {
    url = url.join("&url=");
  }

  // service indicator
  if (!url) return res.end("bandwidth-hero-proxy");

  url = url.replace(/http:\/\/1\.1\.\d\.\d\/bmi\/(https?:\/\/)?/i, "http://");
  req.params.url = url;
  req.params.webp = !req.query.jpeg;
  req.params.grayscale = req.query.bw != 0;
  req.params.quality =
    parseInt(req.query.l, 10) || Env.use("APP_DEFAULT_QUALITY", 40);

  next();
};
