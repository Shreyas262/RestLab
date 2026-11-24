const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/** Returns a user-facing problem with the URL, or null when it is acceptable. */
export function checkUrl(input: string): string | null {
  if (input.trim() === "") return "Enter a URL.";

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return "Enter a full URL, including http:// or https://.";
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return "Only http and https URLs are supported.";
  }
  if (url.username !== "" || url.password !== "") {
    return "URLs with a username or password are not supported. Use an Authorization header instead.";
  }
  return null;
}
