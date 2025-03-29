export class AudioProcessor {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.mediaStream = null;
    this.audioChunks = [];
    this.recorder = null;
  }

  async startRecording() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Setup audio processing chain
      const noiseFilter = this.audioContext.createBiquadFilter();
      noiseFilter.type = "highpass";
      noiseFilter.frequency.value = 300;
      
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 2048;
      
      source.connect(noiseFilter);
      noiseFilter.connect(analyser);
      
      // Setup recording
      this.recorder = new MediaRecorder(this.mediaStream);
      this.audioChunks = [];
      
      this.recorder.ondataavailable = (e) => {
        this.audioChunks.push(e.data);
      };
      
      this.recorder.start();
      
      return analyser;
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw error;
    }
  }

  async stopRecording() {
    if (this.recorder) {
      return new Promise((resolve) => {
        this.recorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          resolve(audioBlob);
        };
        this.recorder.stop();
      });
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    return null;
  }
}