import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  numeric,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id")
    .$defaultFn(() => createId())
    .primaryKey(),

  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 60 }).notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const transactions = pgTable(
  "transactions",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),

    type: varchar("type", {
      length: 10,
      enum: ["spent", "received"],
    }).notNull(),
    amount: numeric("amount", { precision: 18, scale: 3 }).notNull(),
    description: varchar("description", { length: 500 }),
    created_by_user_id: varchar("created_by_user_id").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    fk: foreignKey({
      name: "user_fk",
      columns: [table.created_by_user_id],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  })
);

export const sources = pgTable(
  "sources",
  {
    id: varchar("id")
      .$defaultFn(() => createId())
      .primaryKey(),

    title: varchar("title", { length: 100 }).notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    created_by_user_id: varchar("created_by_user_id").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },

  (table) => ({
    fk: foreignKey({
      name: "user_fk",
      columns: [table.created_by_user_id],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  })
);

export const userRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  sources: many(sources),
}));

export const transactionRelations = relations(transactions, ({ one }) => ({
  created_by_user_id: one(users, {
    fields: [transactions.created_by_user_id],
    references: [users.id],
  }),
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  created_by_user_id: one(users, {
    fields: [sources.created_by_user_id],
    references: [users.id],
  }),
}));

export const tables = {
  users,
  transactions,
  sources,
} as const;
