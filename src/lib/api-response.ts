/** Parse fetch Response as JSON; avoids "Unexpected end of JSON input" on empty bodies. */
export async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.status >= 500
        ? `Server error (${res.status}). Check terminal logs, DATABASE_URL, and that Postgres is running.`
        : `Empty response from server (${res.status}).`,
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid response (${res.status}): ${text.slice(0, 160)}${text.length > 160 ? "…" : ""}`,
    );
  }
}
