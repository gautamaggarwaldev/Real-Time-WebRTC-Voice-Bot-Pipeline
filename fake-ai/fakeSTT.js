class FakeSTT {
  constructor(onPartial, onFinal, onVoiceStart) {
    this.onPartial = onPartial;
    this.onFinal = onFinal;
    this.onVoiceStart = onVoiceStart;

    this.speaking = false;
    this.speechStartTime = null;
    this.lastVoiceTime = null;

    this.threshold = 2000;
    this.partialSent = false;

    this.silenceTimeout = 600;
  }

  processAudioFrame(pcmBuffer) {
    const pcm16 = new Int16Array(pcmBuffer.buffer);

    // Calculate RMS
    let sum = 0;

    for (let i = 0; i < pcm16.length; i++) {
      sum += pcm16[i] * pcm16[i];
    }

    const rms = Math.sqrt(sum / pcm16.length);

    const now = Date.now();

    // Voice detected
    if (rms > this.threshold) {
      if (!this.speaking) {
        this.speaking = true;
        this.speechStartTime = now;
        this.partialSent = false;

        //Voice started callback (for barge-in)
        if (this.onVoiceStart) {
          this.onVoiceStart();
        }
      }

      this.lastVoiceTime = now;

      // Send PARTIAL after 500ms
      if (!this.partialSent && now - this.speechStartTime > 500) {
        this.partialSent = true;

        this.onPartial({
          type: "partial",
          text: "hel",
        });
      }
    }

    // Silence detected
    if (this.speaking && this.lastVoiceTime) {
      if (now - this.lastVoiceTime > this.silenceTimeout) {
        this.speaking = false;
        this.speechStartTime = null;

        this.onFinal({
          type: "final",
          text: "hello",
        });
      }
    }
  }
}

module.exports = FakeSTT;
