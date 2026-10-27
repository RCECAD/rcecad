import { expectNoContent } from "./response";

function fileName(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename\*=UTF-8''([^;]+)/i);
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return fallback;
  }
}

/** Saves an attachment from a Next file route; error bodies become ClientApiError. */
export async function downloadFile(
  response: Response,
  fallbackName: string,
  errorMessage: string,
): Promise<string> {
  await expectNoContent(response, errorMessage);
  const name = fileName(
    response.headers.get("Content-Disposition"),
    fallbackName,
  );
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
  return name;
}
