class PCMProcessor extends AudioWorkletProcessor {

  constructor() {
    super();

    this.targetSampleRate = 16000;
    this.inputSampleRate = sampleRate;

    this.ratio = this.inputSampleRate / this.targetSampleRate;

    this.buffer = [];
    this.frameSize = 320; // 20ms at 16k
  }

  process(inputs) {

    const input = inputs[0];

    if (!input || input.length === 0) return true;

    const channelData = input[0];

    // Downsample
    for (let i = 0; i < channelData.length; i += this.ratio) {

      const sample = channelData[Math.floor(i)];

      this.buffer.push(sample);

      if (this.buffer.length >= this.frameSize) {

        const frame = this.buffer.splice(0, this.frameSize);

        const pcm16 = new Int16Array(this.frameSize);

        for (let j = 0; j < frame.length; j++) {
          pcm16[j] = Math.max(-1, Math.min(1, frame[j])) * 32767;
        }

        this.port.postMessage(pcm16);
      }
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
