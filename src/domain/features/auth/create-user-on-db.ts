"use server";
/*
import {db} from "@/db"

import { users } from "@/db/Users";
import type { NewUser } from "@/db/Users";

type Input = NewUser;
type Output = undefined

type Setup = Domain<Input, Output>

export const createUserInDb: Setup = async (input: Input) => {

  const [created] = await db.insert(users).values(input).returning();

if (!created) throw new Error("mensagem")

  return undefined;
}
*/
