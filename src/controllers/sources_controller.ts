import Elysia, { t } from "elysia";
import { getLoggedInUserInfo } from "../plugins/auth_plugin";
import { db } from "../drizzle/drizzle";
import { tables } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";

export const sources_controller = new Elysia({ prefix: "/sources" })
  .use(getLoggedInUserInfo)
  .get("/", async ({ userId }) => {
    const sourcesArr = await db
      .select()
      .from(tables.sources)
      .where(
        and(
          eq(tables.sources.createdByUserId, userId),
          eq(tables.sources.isActive, true)
        )
      );
    return { success: true, data: sourcesArr };
  })
  .post(
    "/",
    async ({ body, userId, error }) => {
      const result = await db
        .insert(tables.sources)
        .values({
          title: body.title,
          createdByUserId: userId,
        })
        .returning({ id: tables.sources.id });

      if (result.length == 0) {
        return error(500, { success: false, message: "Something went wrong!" });
      }

      return {
        success: true,
        id: result[0].id,
      };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 2, maxLength: 100 }),
      }),
    }
  )
  .guard({
    params: t.Object({
      id: t.String(),
    }),
  })
  .get("/:id", async ({ params: { id }, userId, error }) => {
    const sourceArr = await db
      .select()
      .from(tables.sources)
      .where(
        and(
          eq(tables.sources.id, id),
          eq(tables.sources.createdByUserId, userId),
          eq(tables.sources.isActive, true)
        )
      );

    if (sourceArr.length === 0) {
      return error(404, { message: "Source does not exists!" });
    }

    return { success: true, data: sourceArr[0] };
  })
  .put(
    "/:id",
    async ({ params: { id }, userId, error, body }) => {
      const sourceArr = await db
        .update(tables.sources)
        .set({
          title: body.title,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(tables.sources.id, id),
            eq(tables.sources.createdByUserId, userId),
            eq(tables.sources.isActive, true)
          )
        )
        .returning({ id: tables.sources.id });

      if (sourceArr.length === 0) {
        return error(404, { message: "Source does not exist!" });
      }

      return { success: true, id: sourceArr[0].id };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 2, maxLength: 100 }),
      }),
    }
  )
  .delete("/:id", async ({ userId, params: { id }, error }) => {
    const result = await db
      .delete(tables.sources)
      .where(
        and(
          eq(tables.sources.id, id),
          eq(tables.sources.createdByUserId, userId)
        )
      );

    if (result.rowCount === 0) {
      return error(404, { message: "Source does not exist!" });
    }
    return { success: true };
  });
