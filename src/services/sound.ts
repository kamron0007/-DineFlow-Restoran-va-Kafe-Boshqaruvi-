/**
 * Lightweight Web Audio API synthesizer for tactile restaurant kitchen chimes and notifications.
 * Runs completely client-side with automatic browser autoplay-unlock handling and haptic feedback.
 */

type AudioStateListener = (unlocked: boolean) => void;

class SoundEffects {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private unlocked: boolean = false;
  private listeners: Set<AudioStateListener> = new Set();
  private unlockBound: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dineflow_sound_enabled');
        if (saved !== null) {
          this.soundEnabled = saved === 'true';
        }
      } catch {
        // Ignore storage errors
      }
      this.bindGlobalUnlock();
    }
  }

  private getAudioContextConstructor(): typeof AudioContext | null {
    if (typeof window === 'undefined') return null;
    return (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
      null
    );
  }

  private notifyListeners(): void {
    this.listeners.forEach((cb) => {
      try {
        cb(this.unlocked);
      } catch {
        // Ignore listener errors
      }
    });
  }

  private bindGlobalUnlock(): void {
    if (this.unlockBound || typeof window === 'undefined') return;
    this.unlockBound = true;

    const handleUserGesture = () => {
      void this.unlockAudio();
    };

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchstart', 'click', 'keydown'];
    events.forEach((ev) => {
      window.addEventListener(ev, handleUserGesture, { passive: true, capture: true });
    });
  }

  public subscribeAudioState(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener(this.unlocked);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isAudioUnlocked(): boolean {
    if (this.ctx && this.ctx.state === 'running') {
      if (!this.unlocked) {
        this.unlocked = true;
        this.notifyListeners();
      }
      return true;
    }
    return this.unlocked;
  }

  public async unlockAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      if (!this.ctx) {
        const AudioCtx = this.getAudioContextConstructor();
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      // Play a silent 1-sample buffer to permanently unlock Web Audio on iOS Safari / mobile Chrome
      if (this.ctx.state === 'running') {
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);

        if (!this.unlocked) {
          this.unlocked = true;
          this.notifyListeners();
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('dineflow_sound_enabled', enabled ? 'true' : 'false');
    } catch {
      // Ignore storage errors
    }
    if (enabled) {
      void this.unlockAudio();
    }
  }

  private vibrate(pattern: number | number[]): void {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern);
      }
    } catch {
      // Ignore unsupported vibration
    }
  }

  private withContext(render: (ctx: AudioContext) => void): void {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      if (!this.ctx) {
        const AudioCtx = this.getAudioContextConstructor();
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
      }

      const ctx = this.ctx;
      if (ctx.state === 'running') {
        if (!this.unlocked) {
          this.unlocked = true;
          this.notifyListeners();
        }
        render(ctx);
      } else if (ctx.state === 'suspended') {
        ctx
          .resume()
          .then(() => {
            if (ctx.state === 'running') {
              if (!this.unlocked) {
                this.unlocked = true;
                this.notifyListeners();
              }
              render(ctx);
            }
          })
          .catch(() => {
            // Browser blocked autoplay until user gesture; UI unlock banner handles this
          });
      }
    } catch {
      // Ignore audio failures
    }
  }

  /**
   * Unmistakable double-burst restaurant chime for incoming new orders on the Waiter terminal
   */
  public playNewOrderChime(): void {
    this.vibrate([220, 90, 220, 90, 280]);
    this.withContext((ctx) => {
      const now = ctx.currentTime;

      const scheduleBurst = (burstOffset: number, volumeScale: number) => {
        const notes = [
          { freq: 587.33, delay: 0.0, dur: 0.32 }, // D5
          { freq: 880.0, delay: 0.11, dur: 0.38 }, // A5
          { freq: 1174.66, delay: 0.22, dur: 0.55 }, // D6
        ];

        notes.forEach(({ freq, delay, dur }) => {
          const start = now + burstOffset + delay;
          const oscMain = ctx.createOscillator();
          const oscHarm = ctx.createOscillator();
          const gain = ctx.createGain();

          oscMain.type = 'sine';
          oscMain.frequency.setValueAtTime(freq, start);

          oscHarm.type = 'triangle';
          oscHarm.frequency.setValueAtTime(freq * 2, start);

          const harmGain = ctx.createGain();
          harmGain.gain.setValueAtTime(0.28, start);

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.linearRampToValueAtTime(0.36 * volumeScale, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0008, start + dur);

          oscMain.connect(gain);
          oscHarm.connect(harmGain);
          harmGain.connect(gain);
          gain.connect(ctx.destination);

          oscMain.start(start);
          oscHarm.start(start);
          oscMain.stop(start + dur + 0.02);
          oscHarm.stop(start + dur + 0.02);
        });
      };

      // Two clear chime bursts so the waiter cannot miss an incoming order
      scheduleBurst(0, 1.0);
      scheduleBurst(0.62, 0.9);
    });
  }

  /**
   * Quick tactile click / tap feedback
   */
  public playTick(): void {
    this.withContext((ctx) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    });
  }

  /**
   * Order completed / confirmation chord
   */
  public playSuccess(): void {
    this.withContext((ctx) => {
      const now = ctx.currentTime;
      const freqs = [587.33, 739.99, 880]; // D5, F#5, A5
      freqs.forEach((freq, idx) => {
        const start = now + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.34);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    });
  }

  /**
   * Realistic high-pitched counter bell ding-ding for kitchen orders marked Ready
   */
  public playFoodReadyBell(): void {
    this.vibrate([180, 80, 180]);
    this.withContext((ctx) => {
      const now = ctx.currentTime;
      [0, 0.22].forEach((offset) => {
        const start = now + offset;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1760, start); // A6
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(3520, start); // A7 harmonic

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.32, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0005, start + 0.52);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(start);
        osc2.start(start);
        osc1.stop(start + 0.54);
        osc2.stop(start + 0.54);
      });
    });
  }

  /**
   * Urgent melodic chime for customer calling waiter or requesting bill
   */
  public playWaiterAlert(): void {
    this.vibrate([220, 100, 220]);
    this.withContext((ctx) => {
      const now = ctx.currentTime;
      const notes = [659.25, 880, 1046.5, 1318.5]; // E5, A5, C6, E6
      notes.forEach((freq, i) => {
        const start = now + i * 0.11;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.44);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.46);
      });
    });
  }

  /**
   * Urgent pulsating warning buzzer for kitchen orders exceeding preparation time limit
   */
  public playDelayWarning(): void {
    this.vibrate([250, 120, 250]);
    this.withContext((ctx) => {
      const now = ctx.currentTime;
      [0, 0.2].forEach((offset) => {
        const start = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, start); // A4
        osc.frequency.exponentialRampToValueAtTime(293.66, start + 0.15); // D4
        gain.gain.setValueAtTime(0.22, start);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.19);
      });
    });
  }
}

export const soundService = new SoundEffects();
