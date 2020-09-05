export const WHITELIST_EXTENSION = ["image/svg+xml", "image/gif"];
export const HELMET_CSP_DIRECTIVES = [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "unpkg.com",
  "v5.getbootstrap.com",
];
export const HELMET_CONFIGURATION_OPTIONS = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: HELMET_CSP_DIRECTIVES,
      scriptSrc: HELMET_CSP_DIRECTIVES,
    },
  },
};
