// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { MAX_DXF_BYTES } from "@/api/contracts/spring";
import { readDxfUpload } from "./dxf-upload";

function upload(file: File, name: string | null = "Rede") {
  const data = new FormData();
  data.set("file", file);
  if (name !== null) data.set("name", name);
  return new Request("http://localhost/upload", { method: "POST", body: data });
}
describe("DXF upload boundary", () => {
  it("preserves original bytes rather than decoding and re-encoding the file", async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x30, 0x0d, 0x0a, 0xe7]);
    const data = await readDxfUpload(
      upload(new File([bytes], "Rede.DXF")),
      true,
    );
    expect(data?.get("name")).toBe("Rede");
    expect(
      new Uint8Array(await (data?.get("file") as File).arrayBuffer()),
    ).toEqual(bytes);
  });
  it("rejects empty, oversized and non-DXF files before forwarding", async () => {
    for (const file of [
      new File([], "rede.dxf"),
      new File(["x"], "rede.txt"),
      new File([new Uint8Array(MAX_DXF_BYTES + 1)], "rede.dxf"),
    ]) {
      expect(await readDxfUpload(upload(file), true)).toBeNull();
    }
  });
  it("requires a name for import, while preview never creates a project", async () => {
    expect(
      await readDxfUpload(upload(new File(["0"], "rede.dxf"), null), true),
    ).toBeNull();
    expect(
      await readDxfUpload(upload(new File(["0"], "rede.dxf"), null), false),
    ).not.toBeNull();
  });
});
