export class AudioVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.analyser = null;
    this.dataArray = null;
    this.rafId = null;
    this.gradient = null;
  }

  setup(analyserNode) {
    this.analyser = analyserNode;
    this.analyser.fftSize = 256;
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
    
    // Set canvas dimensions
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    
    // Create gradient
    this.gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 0);
    this.gradient.addColorStop(0, '#3b82f6');
    this.gradient.addColorStop(0.5, '#8b5cf6');
    this.gradient.addColorStop(1, '#ec4899');
  }

  draw() {
    this.rafId = requestAnimationFrame(() => this.draw());
    
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Clear canvas
    this.ctx.fillStyle = 'rgb(17, 24, 39)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw frequency bars
    const barWidth = (this.canvas.width / this.dataArray.length) * 2.5;
    let x = 0;
    
    for (let i = 0; i < this.dataArray.length; i++) {
      const barHeight = (this.dataArray[i] / 255) * this.canvas.height;
      
      this.ctx.fillStyle = this.gradient;
      this.ctx.fillRect(
        x,
        this.canvas.height - barHeight,
        barWidth,
        barHeight
      );
      
      x += barWidth + 1;
    }
  }

  stop() {
    cancelAnimationFrame(this.rafId);
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw idle state
    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, 2);
  }
}