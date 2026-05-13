const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('x_token');
  const demo = localStorage.getItem('x_demo_user');
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...opts.headers,
  };
  if (token) headers.authorization = `Bearer ${token}`;
  if (demo && !token) headers['x-demo-user'] = demo;

  const r = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: 'include',
  });
  if (!r.ok) {
    let detail: unknown = null;
    try {
      detail = await r.json();
    } catch {
      detail = await r.text();
    }
    throw new Error(`API ${r.status}: ${JSON.stringify(detail)}`);
  }
  if (r.status === 204) return undefined as T;
  return (await r.json()) as T;
}
