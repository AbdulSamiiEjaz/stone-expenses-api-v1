import Elysia, { t } from "elysia";
import { getLoggedInUserInfo } from "../plugins/auth_plugin";
import { db } from "../drizzle/drizzle";
import { tables } from "../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-typebox";

const _transactionSchema = {
  insert: createInsertSchema(tables.transactions),
};

export const transactions_controller = new Elysia({ prefix: "/transactions" })
  .use(getLoggedInUserInfo)
  .model({
    insert: t.Omit(_transactionSchema.insert, [
      "id",
      "createdByUserId",
      "createdAt",
      "updatedAt",
    ]),
  })
  .get("/", async ({ userId }) => {
    const transactions = await db
      .select()
      .from(tables.transactions)
      .where(eq(tables.transactions.createdByUserId, userId));

    return { success: true, data: transactions };
  })
  .post(
    "/",
    async ({ userId, body, error }) => {
      const result = await db
        .insert(tables.transactions)
        .values({
          type: body.type,
          amount: body.amount,
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
      body: "insert",
    }
  )
  .guard({
    params: t.Object({
      id: t.String(),
    }),
  })
  .get("/:id", async ({ userId, params: { id }, error }) => {
    const transaction = await db
      .select()
      .from(tables.transactions)
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
          amount: body.amount,
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
      body: "insert",
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
