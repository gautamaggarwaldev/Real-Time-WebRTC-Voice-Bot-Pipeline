const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const { createPeer } = require("./webrtc");

const app = express();
const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

app.use(express.static(__dirname + "/../client"));

wss.on("connection", (socket) => {

  console.log("✅ Client connected for signaling");

  const pc = createPeer();

  socket.on("message", async (message) => {

    const data = JSON.parse(message);

    // Receive OFFER
    if (data.type === "offer") {

      console.log("📡 Offer received");

      await pc.setRemoteDescription(data.offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.send(JSON.stringify({
        type: "answer",
        answer
      }));
    }

    // ICE candidates
    if (data.type === "candidate") {

      if (data.candidate) {
        await pc.addIceCandidate(data.candidate);
      }
    }

  });

});

server.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
