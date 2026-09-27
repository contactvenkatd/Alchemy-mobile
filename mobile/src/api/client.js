import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Hosts that belong to an Expo tunnel rather than the dev machine's network.
const TUNNEL_HOSTS = ['.exp.direct', '.ngrok.io', '.ngrok-free.app', '.ngrok.app'];

/**
 * The emulator/device cannot reach the host's `localhost`. We derive the dev
 * machine's LAN IP from the Expo host URI so a real phone on the same Wi-Fi
 * works without editing anything.
 *
 * Under `expo start --tunnel` that host is an ngrok domain that only proxies
 * Metro on 8081 — the API on 4000 is not behind it. Deriving from it would
 * silently point every request at the tunnel and fail, so we bail out and say
 * what to do instead.
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;

  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost || '';
  const host = hostUri.split(':')[0];

  if (host && TUNNEL_HOSTS.some((suffix) => host.endsWith(suffix))) {
    console.warn(
      `[api] Running through an Expo tunnel (${host}), which does not proxy the API. ` +
      'Start the app with EXPO_PUBLIC_API_URL set to a URL your phone can reach, ' +
      'e.g. EXPO_PUBLIC_API_URL=http://192.168.1.5:4000/api npx expo start --tunnel',
    );
  } else if (host) {
    return `http://${host}:4000/api`;
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:4000/api' : 'http://localhost:4000/api';
}

export const BASE_URL = resolveBaseUrl();

let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function request(path, { method = 'GET', body, query, timeoutMs = 15000 } = {}) {
  const url = new URL(BASE_URL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.details);
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError('Network timeout. Check your connection.', 0);
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network error', 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: (path, query) => request(path, { query }),
  post: (path, body) => request(path, { method: 'POST', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
};
