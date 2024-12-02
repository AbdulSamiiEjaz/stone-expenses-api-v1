import jwt from "@elysiajs/jwt";
import Elysia, { t } from "elysia";
import { config } from "../../config/config";

export const auth_plugin = new Elysia()
  .use(
    jwt({
      name: "accessTokenJwt",
      secret: config._env.JWT_ACCESS_TOKEN_KEY,
      exp: config._env.JWT_ACCESS_TOKEN_EXPIRES_IN,
      schema: t.Cookie({
        payload: t.String(),
      }),
    })
  )
  .macro(({ onBeforeHandle }) => ({
    isSignedIn(enabled: boolean) {
      if (!enabled) return;

      onBeforeHandle(({ cookie, error }) => {
        if (!cookie.accessToken) {
          return error(401, "Unauthorized");
        }
        if (!cookie.refreshToken) {
          return error(401, "Unauthorized");
        }
      });
    },
  }));

export const getLoggedInUserInfo = new Elysia()
  .use(auth_plugin)
  .guard({
    isSignedIn: true,
    cookie: t.Cookie({
      accessToken: t.String(),
    }),
  })
  .resolve(async ({ accessTokenJwt, cookie, error }) => {
    const accessTokenPayload = await accessTokenJwt.verify(
      cookie.accessToken.value
    );
    if (!accessTokenPayload) {
      return error(403, "Forbidden");
    }

    return {
      userId: accessTokenPayload.payload,
    };
  })
  .as("plugin");
