import Pusher from "pusher";

const pusherServer = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
})

export default pusherServer;

export async function triggerPostCreated(postPayload) {
  // channel "posts", event "post.created"
  return pusherServer.trigger("posts", "post.created", postPayload);
}