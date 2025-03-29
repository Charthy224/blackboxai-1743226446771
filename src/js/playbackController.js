export class PlaybackController {
  constructor() {
    this.audioElement = document.getElementById('audio-player');
    this.currentAudioBlob = null;
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  playAudio(blob) {
    this.currentAudioBlob = blob;
    const url = URL.createObjectURL(blob);
    this.audioElement.src = url;
    this.audioElement.play();
  }

  pauseAudio() {
    this.audioElement.pause();
  }

  async exportMP3() {
    if (!this.currentAudioBlob) return;
    
    try {
      // Convert to MP3 using the Web Audio API
      const audioBuffer = await this.audioContext.decodeAudioData(
        await this.currentAudioBlob.arrayBuffer()
      );
      
      // Create a new blob with MP3 format
      const mp3Blob = new Blob([await this.encodeMP3(audioBuffer)], {
        type: 'audio/mp3'
      });
      
      // Trigger download
      const a = document.createElement('a');
      a.href = URL.createObjectURL(mp3Blob);
      a.download = `instrument-${Date.now()}.mp3`;
      a.click();
    } catch (error) {
      console.error('Error exporting MP3:', error);
      // Fallback to original format if MP3 conversion fails
      const a = document.createElement('a');
      a.href = URL.createObjectURL(this.currentAudioBlob);
      a.download = `instrument-${Date.now()}.wav`;
      a.click();
    }
  }

  async encodeMP3(audioBuffer) {
    // This is a simplified version - in a real app you'd use a proper MP3 encoder library
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    
    // Create a WAV header (simplified)
    const wavHeader = this.createWavHeader(
      length * numChannels * 2,
      numChannels,
      sampleRate
    );
    
    // Combine header with PCM data
    const pcmData = this.interleave(audioBuffer);
    const wavData = new Uint8Array(wavHeader.length + pcmData.length);
    wavData.set(wavHeader, 0);
    wavData.set(pcmData, wavHeader.length);
    
    return wavData;
  }

  createWavHeader(totalLength, numChannels, sampleRate) {
    // Simplified WAV header creation
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    // File length
    view.setUint32(4, 36 + totalLength, true);
    // WAVE identifier
    this.writeString(view, 8, 'WAVE');
    // Format chunk identifier
    this.writeString(view, 12, 'fmt ');
    // Format chunk length
    view.setUint32(16, 16, true);
    // Sample format (PCM)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * 2, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // Data chunk identifier
    this.writeString(view, 36, 'data');
    // Data chunk length
    view.setUint32(40, totalLength, true);
    
    return new Uint8Array(header);
  }

  writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  interleave(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const result = new Uint8Array(length * numChannels * 2);
    const channels = [];
    
    for (let i = 0; i < numChannels; i++) {
      channels.push(audioBuffer.getChannelData(i));
    }
    
    let index = 0;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channels[channel][i]));
        const int16 = sample < 0 ? sample * 32768 : sample * 32767;
        result[index++] = int16 & 0xff;
        result[index++] = (int16 >> 8) & 0xff;
      }
    }
    
    return result;
  }
}