import type { Example } from "@/domain/entities/example"; // <-- sempre utilizar import com alias "@/"

export type Example2 = {
  id: string;
  example: Pick<Example, "id">;
};
