import { text } from "drizzle-orm/sqlite-core";

export const CommonTableField = {
  userId: text("user_id"),
  createdAt: text("created_at"),
};
