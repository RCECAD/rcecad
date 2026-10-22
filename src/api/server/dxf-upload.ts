import "server-only";

import { createWriteStream, openAsBlob } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";
import {
  MAX_DXF_BYTES,
  projectPageResponseSchema,
} from "@/api/contracts/spring";
import { SpringApiError, springRequestWithRefresh } from "./spring-client";

// Allow multipart headers and metadata around the file; Spring validates each part.
const MAX_REQUEST_BYTES = MAX_DXF_BYTES + 64 * 1024;
let activeUploads = 0;

function tooLarge() {
  return new SpringApiError(413, "O arquivo DXF deve ter até 300 MB.", {
    code: "PAYLOAD_TOO_LARGE",
  });
}

export async function withDxfUpload<T>(
  request: Request,
  upload: (body: Blob, contentType: string) => Promise<T>,
): Promise<T> {
  const contentType = request.headers.get("content-type") ?? "";
  if (
    !/^multipart\/form-data\s*;.*\bboundary=/i.test(contentType) ||
    !request.body
  ) {
    throw new SpringApiError(400, "Invalid multipart upload", {
      details: "Informe o nome e um arquivo DXF de até 300 MB.",
    });
  }
  if (Number(request.headers.get("content-length")) > MAX_REQUEST_BYTES) {
    throw tooLarge();
  }

  // Verify permission and refresh cookies before reading a potentially large body.
  await springRequestWithRefresh(
    "/projects?page=0&size=1",
    {},
    {
      schema: projectPageResponseSchema,
    },
  );
  if (activeUploads >= 2) {
    throw new SpringApiError(503, "Uploads busy", { code: "UPLOADS_BUSY" });
  }
  activeUploads++;
  let directory: string | undefined;
  try {
    directory = await mkdtemp(join(tmpdir(), "rcecad-dxf-"));
    const path = join(directory, "upload.multipart");
    let received = 0;
    const limit = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.byteLength;
        callback(received > MAX_REQUEST_BYTES ? tooLarge() : null, chunk);
      },
    });
    await pipeline(
      Readable.fromWeb(request.body as ReadableStream),
      limit,
      createWriteStream(path, { flags: "wx", mode: 0o600 }),
      {
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(300_000)]),
      },
    );
    // A disk-backed Blob is replayable after a 401 without buffering the upload.
    return await upload(
      await openAsBlob(path, { type: contentType }),
      contentType,
    );
  } finally {
    if (directory) {
      await rm(directory, {
        recursive: true,
        force: true,
        maxRetries: 3,
      }).catch((error: unknown) => {
        console.error("Falha ao remover upload DXF temporário.", error);
      });
    }
    activeUploads--;
  }
}
