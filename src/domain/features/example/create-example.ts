"use server"; // -> sempre use isso nas features
import { type Domain, DomainError } from "@/domain";
import type { Example } from "@/domain/entities";

type Input = {
  name: Example["name"];
};

type Output = Example;

type Setup = Domain<Input, Output>;

export const createExample: Setup = async (input) => {
  try {
    const example: Example = {
      id: crypto.randomUUID(),
      name: input.name,
    };

    return example;
  } catch (err) {
    console.error(err);
    return DomainError({
      msg: "An error occurred while trying to create a new example",
      err,
    });
  }
};
