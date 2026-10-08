let context: AudioContext | undefined;
export function playTone(enabled: boolean, level = 0) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const now = context.currentTime;
    [0, 4, 7].slice(0, level >= 2 ? 3 : 1).forEach((note, i) => {
      const osc = context!.createOscillator();
      const gain = context!.createGain();
      osc.type = 'sine';
      osc.frequency.value = 220 * Math.pow(2, (note + level * 2) / 12);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.03 + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.1);
      osc.connect(gain);
      gain.connect(context!.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + 0.8);
    });
  } catch {}
}
