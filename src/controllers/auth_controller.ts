import jwt from "@elysiajs/jwt";
import Elysia, { error, t } from "elysia";
import { config } from "../../config/config";
import { auth_plugin } from "../plugins/auth_plugin";
import { db } from "../drizzle/drizzle";
import { tables } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const auth_controller = new Elysia({ prefix: "/auth" })
  .use(
    jwt({
      name: "refreshTokenJwt",
      secret: config._env.JWT_REFRESH_TOKEN_KEY,
      exp: config._env.JWT_REFRESH_TOKEN_EXPIRES_IN,
      schema: t.Cookie({
        payload: t.String(),
      }),
    })
  )
  .use(auth_plugin)
  .guard({
    isSignedIn: false,
  })
  .post(
    "/sign-up",
    async ({ body, error }) => {
      const hash = await Bun.password.hash(body.password);

      const result = await db
        .insert(tables.users)
        .values({
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          password: hash,
        })
        .returning({ id: tables.users.id });

      if (result.length === 0) {
        return error(500, { success: false, message: "Something went wrong!" });
      }

      return { success: true, message: "Signed Up Successfully!" };
    },
    {
      body: t.Object({
        firstName: t.String({ minLength: 2, maxLength: 50 }),
        lastName: t.Optional(t.String({ maxLength: 50 })),
        password: t.String({ minLength: 6, maxLength: 60 }),
        email: t.String({ format: "email", maxLength: 100 }),
      }),
    }
  )
  .post(
    "/sign-in",
    async ({ body, accessTokenJwt, refreshTokenJwt, cookie }) => {
      const userArr = await db
        .select({ password: tables.users.password, id: tables.users.id })
        .from(tables.users)
        .where(eq(tables.users.email, body.identifier));

      if (userArr.length === 0) {
        return error(403, { message: "Invalid Credentials!", success: false });
      }

      const [user] = userArr;
      const isPasswordVerified = await Bun.password.verify(
        body.password,
        user.password
      );

      if (isPasswordVerified == false) {
        return error(403, { message: "Invalid Credentials!", success: false });
      }

      const accessToken = await accessTokenJwt.sign({ payload: user.id });
      const refreshToken = await refreshTokenJwt.sign({ payload: user.id });

      cookie.accessToken.set({
        value: accessToken,
        httpOnly: true,
        sameSite: true,
        path: "/",
        maxAge: 1000 * 60 * 60,
      });

      cookie.refreshToken.set({
        value: refreshToken,
        httpOnly: true,
        sameSite: true, // TODO: check documentation for sameSite  for mobile apps
        path: "/",
        maxAge: 1000 * 60 * 60 * 24 * 30,
      });

      return { success: true, message: "Logged in successfully!" };
    },
    {
      body: t.Object({
        identifier: t.String(),
        password: t.String(),
      }),
      cookie: t.Object({
        accessToken: t.Optional(t.String()),
        refreshToken: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/refresh-token",
    async ({ cookie, refreshTokenJwt, error, accessTokenJwt }) => {
      const isTokenValid = await refreshTokenJwt.verify(
        cookie.refreshToken.value
      );

      if (isTokenValid == false) {
        cookie.refreshToken.remove();
        cookie.accessToken.remove();
        return error(401, {
          success: false,
          message: "Session timed out. Please login again!",
        });
      }

      const newAccessToken = await accessTokenJwt.sign({
        payload: isTokenValid.payload,
      });

      cookie.accessToken.set({
        value: newAccessToken,
        httpOnly: true,
        sameSite: true, // TODO:
        path: "/",
        maxAge: 1000 * 60 * 60,
      });

      return { success: true, message: "Token Refreshed Successfully!" };
    },
    {
      cookie: t.Object({
        accessToken: t.Optional(t.String()),
        refreshToken: t.String(),
      }),
    }
  )
  .guard({
    isSignedIn: true,
  })
  .post(
    "/sign-out",
    ({ cookie }) => {
      cookie.accessToken.remove();
      cookie.refreshToken.remove();
      return { success: true, message: "Logged out successfully!" };
    },
    {
      cookie: t.Object({
        accessToken: t.String(),
        refreshToken: t.String(),
      }),
    }
  );
