import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://8c8f1d3a7cf2136726af671fa35205a8@o4510149543395328.ingest.us.sentry.io/4510149550669824",
  integrations: [Sentry.mongoIntegration()],
  sendDefaultPii: true,
});
