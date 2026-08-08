/**
 * Cookie plumbing for the web auth routes. Hand-rolled rather than pulled from a
 * dependency: the server sets exactly two cookies and reads two, and both are
 * ours, so there is nothing here that `cookie-parser` would do better.
 */

export type TCookieOptions = {
  maxAgeSeconds: number;
  /** Off for local http dev, on everywhere else. */
  secure: boolean;
  sameSite: "Strict" | "Lax";
  path: string;
};

/** Read one cookie out of a raw `Cookie` header. Returns undefined when absent. */
export function readCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return undefined;
}

/**
 * Serialize a `Set-Cookie` value. Always `HttpOnly` — nothing the server sets is
 * meant to be read by scripts. Pass `maxAgeSeconds: 0` to clear a cookie; the
 * name, path and flags must match the ones it was set with or the browser keeps
 * the original.
 */
export function serializeCookie(name: string, value: string, options: TCookieOptions): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "HttpOnly",
    `SameSite=${options.sameSite}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAgeSeconds}`,
  ];

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}
