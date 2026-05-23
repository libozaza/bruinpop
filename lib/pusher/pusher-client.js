import Pusher from "pusher-js";

let pusherClient;

export function getPusherClient() {
  if (typeof window === "undefined") return null;
  if (!pusherClient) {
    pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      disableStats: true,
      forceTLS: true,
    });
  }
  return pusherClient;
}