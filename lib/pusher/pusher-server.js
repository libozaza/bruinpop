import Pusher from "pusher";

let pusherServer;

function isPusherServerConfigured() {
  return Boolean(
    process.env.PUSHER_APP_ID &&
      process.env.PUSHER_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.PUSHER_CLUSTER,
  );
}

function getPusherServer() {
  if (!isPusherServerConfigured()) return null;

  if (!pusherServer) {
    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherServer;
}

export default getPusherServer;

async function trigger(channel, event, payload) {
  const pusher = getPusherServer();
  if (!pusher) return;
  return pusher.trigger(channel, event, payload);
}

export async function triggerPostCreated(postPayload) {
  return trigger("posts", "post.created", postPayload);
}

export async function triggerInteractionUpdated(postId) {
  return trigger("posts", "post.interaction_updated", { postId });
}

export async function triggerPostDeleted(postId) {
  return trigger("posts", "post.deleted", { postId });
}

export async function triggerPostUpdated(postPayload) {
  return trigger("posts", "post.updated", postPayload);
}
