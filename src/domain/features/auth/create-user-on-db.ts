"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import type { Domain } from "@/domain";
import type { User } from "@/domain/entities";

type Input = Omit<User, "id">;
type Output = undefined;

type Setup = Domain<Input, Output>;

export const createUserInDb: Setup = async (input: Input) => {
  const [created] = await db.insert(users).values(input).returning();

  if (!created) throw new Error("Ocorreu um erro ao criar o usuário");

  return undefined;
};
