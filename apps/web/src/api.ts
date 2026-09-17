import type { ApiResult } from '@mailpilot/shared';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = configuredApiUrl?.replace(/\/+$/, '') ?? '';

export async function api<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);

  if (options?.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('Your session expired. Refresh the page and sign in again.');
  }

  const body: unknown = await response.json();

  if (!isApiResult<T>(body)) {
    throw new Error('Invalid server response');
  }

  if (!body.ok) {
    throw new Error(body.error.message);
  }

  return body.data;
}

function isApiResult<T>(value: unknown): value is ApiResult<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ok' in value &&
    typeof value.ok === 'boolean'
  );
}
