import Elysia, { t } from "elysia";
import { getLoggedInUserInfo } from "../plugins/auth_plugin";
import { db } from "../drizzle/drizzle";
import { tables } from "../drizzle/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { spreads } from "../utils/helpers";
import { createInsertSchema, createSelectSchema } from "drizzle-typebox";

export const _sourcesSchema = {
  insert: spreads(
    {
      source: createInsertSchema(tables.sources, {
        title: t.String({ minLength: 2, maxLength: 100 }),
      }),
    },
    "insert"
  ),
} as const;

export const sources_controller = new Elysia({ prefix: "/sources" })
  .use(getLoggedInUserInfo)
  .model({
    "sources.insert": t.Object({
      title: _sourcesSchema.insert.source.title,
    }),
  })
  .get(
    "/",
    async ({ userId, query }) => {
      const page = query?.page ?? 1;
      const itemsPerPage = query?.itemsPerPage ?? 10;

      const offset = (page - 1) * itemsPerPage;

      const totalItems = await db
        .select({ count: count() })
        .from(tables.sources)
        .where(
          and(
            eq(tables.sources.createdByUserId, userId),
            eq(tables.sources.isActive, true)
          )
        );

      const sourcesArr = await db
        .select()
        .from(tables.sources)
        .where(
          and(
            eq(tables.sources.createdByUserId, userId),
            eq(tables.sources.isActive, true)
          )
        )
        .orderBy(desc(tables.sources.createdAt))
        .limit(itemsPerPage)
        .offset(offset);

      const totalPages = Math.ceil(totalItems[0].count / itemsPerPage);

      return {
        success: true,
        data: sourcesArr,
        totalItems: totalItems[0].count,
        totalPages,
      };
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric()),
        itemsPerPage: t.Optional(t.Numeric()),
      }),
    }
  )
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
      body: "sources.insert",
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
          title: "sources.insert",
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
      body: "sources.insert",
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
