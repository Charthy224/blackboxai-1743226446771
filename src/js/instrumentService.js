import * as Tone from 'tone';

export class InstrumentService {
  constructor() {
    this.instruments = {
      trumpet: {
        sampler: new Tone.Sampler({
          A1: "sounds/trumpet-C4.mp3",
          A2: "sounds/trumpet-D4.mp3"
        }).toDestination(),
        pitchShift: 0
      },
      flute: {
        sampler: new Tone.Sampler({
          A1: "sounds/flute-C4.mp3",
          A2: "sounds/flute-D4.mp3"
        }).toDestination(),
        pitchShift: 12
      },
      piano: {
        sampler: new Tone.PolySynth(Tone.Synth).toDestination(),
        pitchShift: -12
      }
    };
  }

  async loadSamples() {
    await Tone.start();
    return Promise.all(
      Object.values(this.instruments).map(instrument => 
        instrument.sampler instanceof Tone.Sampler 
          ? instrument.sampler.load() 
          : Promise.resolve()
      )
    );
  }

  async convertToInstrument(audioBlob, instrumentId) {
    const instrument = this.instruments[instrumentId];
    if (!instrument) throw new Error('Invalid instrument');
    
    const audioBuffer = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.audioContext.decodeAudioData(reader.result, resolve);
      };
      reader.readAsArrayBuffer(audioBlob);
    });

    const player = new Tone.Player(audioBuffer).toDestination();
    const pitchShift = new Tone.PitchShift(instrument.pitchShift).toDestination();
    
    player.connect(pitchShift);
    player.start();
    
    return new Promise((resolve) => {
      const recorder = new Tone.Recorder();
      pitchShift.connect(recorder);
      
      recorder.start().then(() => {
        setTimeout(async () => {
          const processedBlob = await recorder.stop();
          resolve(processedBlob);
        }, audioBuffer.duration * 1000);
      });
    });
  }
}