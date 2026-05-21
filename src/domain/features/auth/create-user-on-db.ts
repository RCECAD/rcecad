"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { Domain } from "@/domain";
import type { User } from "@/domain/entities";

type Input = Omit<User, "id" | "createdAt" | "updatedAt">;
type Output =
  | {
      success: false;
    }
  | {
      success: true;
    };

type Setup = Domain<Input, Output>;

export const createUserOnDb: Setup = async (input: Input) => {
  const [created] = await db.insert(users).values(input).returning();

  if (!created.id) {
    return { success: false };
  }

  return { success: true };
};
