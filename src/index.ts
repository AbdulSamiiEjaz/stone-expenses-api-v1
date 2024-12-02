import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { auth_controller } from "./controllers/auth_controller";
import { transactions_controller } from "./controllers/transactions_controller";
import { sources_controller } from "./controllers/sources_controller";

const app = new Elysia()
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
