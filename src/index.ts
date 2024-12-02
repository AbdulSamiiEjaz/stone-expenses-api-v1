import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";

const app = new Elysia({
  prefix: "/v1",
})
  .use(
    swagger({
      path: "/swagger",
      documentation: {
        info: {
          title: "Stone Expenses API",
          version: "1.0.0",
        },
      },
    })
  )
  .get("/", () => "Hello Elysia")
  .listen(3000);

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}/v1/swagger`
);
