import { serve } from "https://deno.land/std@0.179.0/http/server.ts";

serve((request: Request) => {
  // Return an error if this is not a websocket request
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 400 });
  }

  // The path is the channel_id, check that it is specified.
  const channelId = new URL(request.url).pathname.slice(1);

  // Assign an id to the client and upgrade to a websocket connection.
  const origin = request.headers.get("Origin");
  const clientId = Math.random().toString(36).slice(2);
  const { socket, response } = Deno.upgradeWebSocket(request);
  console.log("websocket.connect", { channelId, clientId, origin });

  // Relay messages from other clients via a BroadcastChannel
  const broadcastChannel = new BroadcastChannel(channelId);
  broadcastChannel.onmessage = (e: MessageEvent) => {
    const byteSize = messageSize(e.data);
    console.log("websocket.send_message", { channelId, clientId, byteSize });
    socket.send(e.data);
  };

  // Listen for messages from the client and broadcast them to all other clients.
  socket.onmessage = (e: MessageEvent) => {
    const byteSize = messageSize(e.data);
    console.log("websocket.recv_message", { channelId, clientId, byteSize });
    broadcastChannel.postMessage(e.data);
  };

  // Close our connection to the broadcast channel when the websocket closes.
  socket.onclose = (e: CloseEvent) => {
    const { code, reason } = e;
    console.log("websocket.close", { channelId, clientId, code, reason });
    broadcastChannel.close();
  };

  return response;
});

const messageSize = (message: string | ArrayBuffer) => {
  return (message instanceof ArrayBuffer) ? message.byteLength : message.length;
};
