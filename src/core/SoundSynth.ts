/**
 * Zero-MB WebAudio Procedural Sound Effects
 * Generates crisp fantasy chimes and ricochet impacts without bloating APK size.
 */
export class SoundSynth {
  private static ctx: AudioContext | null = null;

  public static playBounceChime(comboCount: number = 1): void {
    try {
      if (!this.ctx) this.ctx = new AudioContext();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 + Math.min(comboCount * 35, 700), this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.14);
    } catch {
      // Audio muted or not yet unlocked by touch
    }
  }
}
