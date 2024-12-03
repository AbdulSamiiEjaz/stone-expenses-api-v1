import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { auth_controller } from "./controllers/auth_controller";
import { transactions_controller } from "./controllers/transactions_controller";
import { sources_controller } from "./controllers/sources_controller";
import logixlysia from "logixlysia";

const app = new Elysia()
  .use(
    logixlysia({
      config: {
        showStartupMessage: true,
        startupMessageFormat: "simple",
        timestamp: {
          translateTime: "yyyy-mm-dd HH:MM:ss",
        },
        ip: true,
        logFilePath: "./logs/development.log",
        customLogFormat:
          "🚀 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}",
      },
    })
  )
  .use(
    swagger({
      path: "/v1/swagger",
      documentation: {
        info: {
          title: "Stone Expenses API",
          version: "1.0.0",
        },
      },
    })
  )
  .get("/health-check", () => {
    return { success: true, message: "Alive :)" };
  })
  .group("/v1", (app) => {
    return app
      .use(auth_controller)
      .use(sources_controller)
      .use(transactions_controller);
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/v1/swagger`
);

async function gracefulShutdown() {
  console.log("Received shutdown signal. Closing server gracefully...");
  await app.server?.stop();
  console.log("Server has been shut down.");
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
