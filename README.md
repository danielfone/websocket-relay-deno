# websocket-relay-server

A deno implementation of a simple websocket server which will relay messages
between clients connected to the same channel. Connect to the server with a
websocket request including the channel id as the path:

```js
const ws = new WebSocket("wss://example.com/{channel_id}");
```
