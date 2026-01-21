let pc;
let socket;
let localStream;
let audioContext;
let pcmNode;
let dataChannel;
let remoteAudio;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusText = document.getElementById("status");

startBtn.onclick = startCall;
stopBtn.onclick = stopCall;

async function startCall() {
  await navigator.mediaDevices.getUserMedia({ audio: true });

  socket = new WebSocket("ws://localhost:3000");

  socket.onopen = () => {
    statusText.innerText = "Connected";
    document.getElementById("dot").classList.add("connected");
  };

  pc = new RTCPeerConnection();
  dataChannel = pc.createDataChannel("audio-pcm");

  dataChannel.onopen = () => {
    console.log("✅ PCM DataChannel Open");
  };

  // Play server audio
  pc.ontrack = (event) => {
    console.log("🔊 Remote audio track received");

    if (!remoteAudio) {
      remoteAudio = document.createElement("audio");
      remoteAudio.autoplay = true;
      remoteAudio.controls = true; // debugging visibility
      document.body.appendChild(remoteAudio);
    }

    remoteAudio.srcObject = event.streams[0];

    remoteAudio.play().catch((err) => {
      console.error("Playback error:", err);
    });
  };

  // Get microphone
  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioContext = new AudioContext();

  await audioContext.audioWorklet.addModule("audio-processor.js");

  const source = audioContext.createMediaStreamSource(localStream);

  pcmNode = new AudioWorkletNode(audioContext, "pcm-processor");

  pcmNode.port.onmessage = (event) => {
    const pcmChunk = event.data;

    // Send PCM to server
    if (dataChannel.readyState === "open") {
      dataChannel.send(pcmChunk.buffer);
    }
  };

  source.connect(pcmNode);

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // ICE handling
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({
          type: "candidate",
          candidate: event.candidate,
        }),
      );
    }
  };

  socket.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "answer") {
      await pc.setRemoteDescription(data.answer);
    }

    if (data.type === "candidate") {
      await pc.addIceCandidate(data.candidate);
    }
  };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.send(
    JSON.stringify({
      type: "offer",
      offer,
    }),
  );

  statusText.innerText = "Calling...";
}

function stopCall() {
  pc.close();
  socket.close();

  statusText.innerText = "Call stopped";
  document.getElementById("dot").classList.remove("connected");

}
