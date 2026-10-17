import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const projects = sqliteTable('projects', {
 id: text('id').primaryKey(),
 title: text('title').notNull(),
 summary: text('summary').notNull(),
 category: text('category').notNull(),
 content: text('content').notNull(),
 published: integer('published').notNull().default(0),
 deleted: integer('deleted').notNull().default(0),
 revision: integer('revision').notNull().default(1),
 updated_at: text('updated_at').notNull(),
});
