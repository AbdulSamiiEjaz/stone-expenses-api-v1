import Elysia, { t } from "elysia";
import { getLoggedInUserInfo } from "../plugins/auth_plugin";
import { db } from "../drizzle/drizzle";
import { tables } from "../drizzle/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";

const _transactionSchema = {
  insert: createInsertSchema(tables.transactions, {
    amount: t.Numeric(),
  }),
} as const;

export const transactions_controller = new Elysia({ prefix: "/transactions" })
  .use(getLoggedInUserInfo)
  .model({
    "transactions.insert": t.Omit(_transactionSchema.insert, [
      "id",
      "createdByUserId",
      "createdAt",
      "updatedAt",
    ]),
  })
  .get(
    "/",
    async ({ userId, query }) => {
      const page = query.page ?? 1;
      const itemsPerPage = query.itemsPerPage ?? 10;

      const totalTransactionsCount = await db
        .select({
          count: count(),
        })
        .from(tables.transactions)
        .where(eq(tables.transactions.createdByUserId, userId));

      const offset = (page - 1) * itemsPerPage;

      const transactions = await db
        .select({
          id: tables.transactions.id,
          type: tables.transactions.type,
          amount: tables.transactions.amount,
          createdAt: tables.transactions.createdAt,
          updatedAt: tables.transactions.updatedAt,
          description: tables.transactions.description,
          sourceTitle: tables.sources.title,
        })
        .from(tables.transactions)
        .leftJoin(
          tables.sources,
          eq(tables.sources.id, tables.transactions.sourceId)
        )
        .where(eq(tables.transactions.createdByUserId, userId))
        .orderBy(desc(tables.transactions.createdAt))
        .limit(itemsPerPage)
        .offset(offset);

      const totalPages = Math.ceil(
        totalTransactionsCount[0].count / itemsPerPage
      );

      return {
        success: true,
        data: transactions,
        totalItems: totalTransactionsCount[0].count,
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
    async ({ userId, body, error }) => {
      const result = await db
        .insert(tables.transactions)
        .values({
          type: body.type,
          amount: body.amount.toString(),
          description: body.description,
          createdByUserId: userId,
          sourceId: body.sourceId,
        })
        .returning({ id: tables.transactions.id });

      if (result.length == 0) {
        return error(500, { message: "Something went wrong!" });
      }

      return { success: true, id: result[0].id };
    },
    {
      body: "transactions.insert",
    }
  )
  .guard({
    params: t.Object({
      id: t.String(),
    }),
  })
  .get("/:id", async ({ userId, params: { id }, error }) => {
    const transaction = await db
      .select({
        id: tables.transactions.id,
        type: tables.transactions.type,
        amount: tables.transactions.amount,
        createdAt: tables.transactions.createdAt,
        updatedAt: tables.transactions.updatedAt,
        description: tables.transactions.description,
        sourceTitle: tables.sources.title,
      })
      .from(tables.transactions)
      .leftJoin(
        tables.sources,
        eq(tables.sources.id, tables.transactions.sourceId)
      )
      .where(
        and(
          eq(tables.transactions.id, id),
          eq(tables.transactions.createdByUserId, userId)
        )
      );

    if (transaction.length === 0) {
      return error(404, { message: "Transaction does not exists!" });
    }

    return { success: true, data: transaction };
  })
  .put(
    "/:id",
    async ({ body, userId, params: { id }, error }) => {
      const transaction = await db
        .update(tables.transactions)
        .set({
          type: body.type,
          amount: body.amount.toString(),
          description: body.description,
        })
        .where(
          and(
            eq(tables.transactions.id, id),
            eq(tables.transactions.createdByUserId, userId)
          )
        )
        .returning({ id: tables.transactions.id });

      if (transaction.length === 0) {
        return error(404, { message: "Transaction does not exists!" });
      }

      return { success: true, id: transaction[0].id };
    },
    {
      body: "transactions.insert",
    }
  )
  .delete("/:id", async ({ userId, params: { id }, error }) => {
    const transaction = await db
      .delete(tables.transactions)
      .where(
        and(
          eq(tables.transactions.id, id),
          eq(tables.transactions.createdByUserId, userId)
        )
      );

    if (transaction.rowCount === 0) {
      return error(404, { message: "Transaction does not exists!" });
    }

    return { success: true };
  });
