// =====================================================
// PizzaLanche Pro — lib/sound.ts
// Web Audio API Order Notification Chime Synthesizer
// =====================================================

export function playOrderChime(volume: number = 0.8) {
  if (typeof window === 'undefined' || volume <= 0) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Play a 2-tone chime (E5 -> A5)
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Volume scaling
      gain.gain.setValueAtTime(volume * 0.5, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playNote(659.25, now, 0.35);        // E5
    playNote(880.00, now + 0.18, 0.65); // A5
  } catch {}
}
