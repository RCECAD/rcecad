import "server-only";
import { z } from "zod";
import { MAX_DXF_BYTES } from "@/api/contracts/spring";

/** Forward original bytes, including encoding and line endings. */
export async function readDxfUpload(
  request: Request,
  requireName: boolean,
): Promise<FormData | null> {
  const input = await request.formData().catch(() => null);
  const file = input?.get("file");
  if (
    !file ||
    typeof file === "string" ||
    file.size === 0 ||
    file.size > MAX_DXF_BYTES ||
    !file.name.toLowerCase().endsWith(".dxf")
  )
    return null;
  const name = z.string().trim().min(1).max(200).safeParse(input?.get("name"));
  if (requireName && !name.success) return null;
  const output = new FormData();
  output.set("file", file);
  if (requireName && name.success) output.set("name", name.data);
  return output;
}
