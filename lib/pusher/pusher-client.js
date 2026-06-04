import Pusher from "pusher-js";

let pusherClient;

export function isPusherClientConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_PUSHER_KEY &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  );
}

/**
 * returns a singleton Pusher client, or null if env vars are not set
 * feed/Map fall back to fetch-only when null
 */
export function getPusherClient() {
  if (typeof window === "undefined") return null;
  if (!isPusherClientConfigured()) return null;

  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      disableStats: true,
      forceTLS: true,
    });
  }

  return pusherClient;
}
