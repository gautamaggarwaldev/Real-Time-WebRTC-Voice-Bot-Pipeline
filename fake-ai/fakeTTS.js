class FakeTTS {

  constructor() {
    this.sampleRate = 16000;
    this.frameSize = 160; 
    this.frequency = 440;
  }

  async *streamAudio(text, abortSignal) {

    console.log("🗣 Fake TTS generating audio for:", text);

    let phase = 0;
    const phaseStep = 2 * Math.PI * this.frequency / this.sampleRate;

    // ~2 seconds of audio
    const totalFrames = 200; // 200 x 10ms = 2s

    for (let i = 0; i < totalFrames; i++) {

      if (abortSignal.aborted) {
        console.log("⛔ TTS aborted");
        return;
      }

      const pcm16 = new Int16Array(this.frameSize);

      for (let j = 0; j < this.frameSize; j++) {
        pcm16[j] = Math.sin(phase) * 3000;
        phase += phaseStep;
      }

      yield Buffer.from(pcm16.buffer);

      // 10ms pacing
      await new Promise(r => setTimeout(r, 10));
    }

    console.log("Fake TTS finished streaming");
  }
}

module.exports = FakeTTS;
