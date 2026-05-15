"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import type { NewUser, User } from "@/db/Users";
import { users } from "@/db/Users";
import type { Domain } from "@/domain";
import { DomainError } from "@/domain";

type Input = {
  name: string;
  cnpj: string;
  email: string;
  password: string;
};

type Output = User;

const getDb = async () => {
  const g = globalThis as unknown as {
    __pgPool?: Pool;
    __db?: ReturnType<typeof drizzle>;
  };

  if (!g.__pgPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("Missing DATABASE_URL environment variable");
    }
    g.__pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  if (!g.__db) {
    g.__db = drizzle(g.__pgPool as Pool);
  }

  return g.__db as ReturnType<typeof drizzle>;
};

type Setup = Domain<Input, Output>;

export const registerUser: Setup = async (input) => {
  try {
    const client = await clerkClient();

    const clerkUser = await client.users.createUser({
      emailAddress: [input.email],
      password: input.password,
      firstName: input.name,
    });

    const clerkUserId = clerkUser.id;

    try {
      const db = await getDb();

      const toInsert: NewUser = {
        clerkUserId,
        name: input.name,
        cnpj: input.cnpj,
        email: input.email,
      };

      const [created] = await db.insert(users).values(toInsert).returning();

      return created as Output;
    } catch (dbErr) {
      await client.users.deleteUser(clerkUserId);
      throw dbErr;
    }
  } catch (err) {
    return DomainError({ msg: "An error occurred while creating user", err });
  }
};
