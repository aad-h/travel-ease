const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API;

export function placesApiConfigured() {
  return Boolean(GOOGLE_PLACES_API_KEY);
}

export async function placesApiRequest<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body?.error?.message || body?.error || `Google Places API returned ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export function placesApiKey() {
  return GOOGLE_PLACES_API_KEY;
}
