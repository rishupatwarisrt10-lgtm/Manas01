// src/utils/sounds.ts

export class SoundManager {
  private static instance: SoundManager;
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  private constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }
    
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }

  // Generate different tones for different events
  private async playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.isEnabled || !this.audioContext) return;

    try {
      await this.ensureAudioContext();
      
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = type;
      
      // Create envelope for smooth sound
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
      
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
      
    } catch (error) {
      console.warn('Failed to play tone:', error);
    }
  }

  // Different sound patterns for different events
  async playTimerStart() {
    // Ascending chord for start
    await this.playTone(440, 0.2); // A4
    setTimeout(() => this.playTone(554.37, 0.2), 100); // C#5
    setTimeout(() => this.playTone(659.25, 0.3), 200); // E5
  }

  async playTimerComplete() {
    // Completion sound - gentle bell-like tone
    await this.playTone(800, 0.5, 'triangle');
    setTimeout(() => this.playTone(1000, 0.5, 'triangle'), 200);
    setTimeout(() => this.playTone(1200, 0.8, 'triangle'), 400);
  }

  async playFocusStart() {
    // Deep, focused tone
    await this.playTone(220, 0.4, 'square'); // A3
    setTimeout(() => this.playTone(330, 0.4, 'square'), 150); // E4
  }

  async playFocusEnd() {
    // Gentle release sound
    await this.playTone(659.25, 0.3, 'sine'); // E5
    setTimeout(() => this.playTone(523.25, 0.4, 'sine'), 200); // C5
  }

  async playBreakStart() {
    // Light, airy sound for break
    await this.playTone(523.25, 0.2, 'triangle'); // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'triangle'), 100); // E5
    setTimeout(() => this.playTone(783.99, 0.3, 'triangle'), 200); // G5
  }

  async playBreakEnd() {
    // Ready to focus again
    await this.playTone(880, 0.3, 'sine'); // A5
    setTimeout(() => this.playTone(740, 0.4, 'sine'), 200); // F#5
  }

  async playLongBreakStart() {
    // Relaxing chord progression
    await this.playTone(261.63, 0.4, 'triangle'); // C4
    setTimeout(() => this.playTone(329.63, 0.4, 'triangle'), 100); // E4
    setTimeout(() => this.playTone(392, 0.4, 'triangle'), 200); // G4
    setTimeout(() => this.playTone(523.25, 0.6, 'triangle'), 300); // C5
  }

  async playLongBreakEnd() {
    // Energizing return sound
    await this.playTone(440, 0.2); // A4
    setTimeout(() => this.playTone(554.37, 0.2), 100); // C#5
    setTimeout(() => this.playTone(659.25, 0.2), 200); // E5
    setTimeout(() => this.playTone(880, 0.4), 300); // A5
  }

  // Control methods
  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  isEnabledStatus(): boolean {
    return this.isEnabled;
  }

  // Initialize on user interaction
  async initialize() {
    if (typeof window !== 'undefined') {
      await this.ensureAudioContext();
    }
  }
}

// Export singleton instance
export const soundManager = SoundManager.getInstance();