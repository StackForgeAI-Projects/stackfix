import "dotenv/config";
import { createApp } from "./app.js";
import { logger } from "./lib/logger.js";

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  logger.info(`StackFix API listening on http://localhost:${port}`, { version: "0.1.0" });
});
