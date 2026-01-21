const wrtc = require("wrtc");
const FakeSTT = require("../fake-ai/fakeSTT");
const FakeTTS = require("../fake-ai/fakeTTS");
const { StateMachine, STATES } = require("./stateMachine");

let webrtcStartTime = Date.now();

function createPeer() {
  let frameCount = 0;
  let lastTime = Date.now();

  const pc = new wrtc.RTCPeerConnection();
  const stateMachine = new StateMachine();
  stateMachine.setState(STATES.LISTENING);

  // Create outbound audio track
  const audioSource = new wrtc.nonstandard.RTCAudioSource();
  const audioTrack = audioSource.createTrack();

  // 🔑 CREATE MEDIA STREAM
  const mediaStream = new wrtc.MediaStream();
  mediaStream.addTrack(audioTrack);

  // 🔑 ADD TRACK WITH STREAM
  pc.addTrack(audioTrack, mediaStream);

  const fakeTTS = new FakeTTS();

  let ttsAbortController = null;

  // Create Fake STT
  const fakeSTT = new FakeSTT(
    (partial) => {
      console.log("📝 PARTIAL:", partial.text);
    },

    async (final) => {
      console.log("✅ FINAL:", final.text);

      console.log(
        "🕒 STT latency:",
        Date.now() - fakeSTT.speechStartTime,
        "ms",
      );

      stateMachine.setState(STATES.PROCESSING);

      // Start TTS
      stateMachine.setState(STATES.SPEAKING);

      // ✅ Stop previous TTS if still running
      if (ttsAbortController) {
        ttsAbortController.abort();
      }

      // Create new controller for this TTS
      ttsAbortController = new AbortController();

      const startTime = Date.now();

      for await (const chunk of fakeTTS.streamAudio(
        final.text,
        ttsAbortController.signal,
      )) {
        const samples = new Int16Array(
          chunk.buffer,
          chunk.byteOffset,
          chunk.byteLength / 2,
        );

        if (samples.length === 160) {
          audioSource.onData({
            samples,
            sampleRate: 16000,
            bitsPerSample: 16,
            channelCount: 1,
          });
        }
      }

      console.log("🕒 TTS duration:", Date.now() - startTime, "ms");

      if (stateMachine.getState() !== STATES.INTERRUPTED) {
        stateMachine.setState(STATES.LISTENING);
      }
    },

    // 🔥 VOICE START HANDLER (BARGE-IN)
    () => {
      if (stateMachine.getState() === STATES.SPEAKING) {
        console.log("🚨 BARGE-IN DETECTED");

        stateMachine.setState(STATES.INTERRUPTED);

        if (ttsAbortController) {
          const cancelStart = Date.now();

          ttsAbortController.abort();

          console.log("⛔ TTS cancelled in", Date.now() - cancelStart, "ms");
        }
      }
    },
  );

  pc.ondatachannel = (event) => {
    const channel = event.channel;

    console.log("✅ DataChannel received on server");

    channel.onmessage = (msg) => {
      const buffer = Buffer.from(msg.data);

      // FPS logging
      frameCount++;
      const now = Date.now();

      if (now - lastTime >= 1000) {
        console.log("📊 Frames/sec:", frameCount);
        frameCount = 0;
        lastTime = now;
      }

      // Feed to Fake STT
      fakeSTT.processAudioFrame(buffer);
    };
  };

  return pc;
}

module.exports = { createPeer };
