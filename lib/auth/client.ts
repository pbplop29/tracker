// The service worker keeps network-first copies of /api GET responses for offline use.
// Drop them whenever the signed-in user changes so one user's data is never shown to another.
export async function clearApiCache() {
  if (typeof caches === "undefined") return;
  for (const key of await caches.keys()) {
    if (key.startsWith("gymgraph-api-")) await caches.delete(key);
  }
}

export async function postJson<T>(url: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T & { error?: string } }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) };
}

// Full page load on purpose: it also resets the in-memory SWR cache when the signed-in user changes.
export function hardNavigate(path: string) {
  window.location.assign(path);
}
