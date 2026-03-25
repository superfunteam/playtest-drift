interface ToneStep {
  frequency: number;
  duration: number;
  gap?: number;
  type?: OscillatorType;
  gain?: number;
}

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const ContextCtor = (window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) ?? null;

  if (!ContextCtor) return null;

  if (!audioContext) {
    audioContext = new ContextCtor();
  }

  return audioContext;
}

async function ensureRunningContext(): Promise<AudioContext | null> {
  const context = getAudioContext();
  if (!context) return null;

  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return null;
    }
  }

  return context;
}

function scheduleTone(context: AudioContext, when: number, step: ToneStep): void {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = step.type ?? 'sine';
  oscillator.frequency.setValueAtTime(step.frequency, when);

  const peakGain = step.gain ?? 0.04;
  gainNode.gain.setValueAtTime(0.0001, when);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, when + 0.025);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, when + step.duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(when);
  oscillator.stop(when + step.duration + 0.01);
}

function sequenceForResult(isCorrect: boolean): ToneStep[] {
  if (isCorrect) {
    return [
      { frequency: 220, duration: 0.09, gap: 0.03, type: 'sine', gain: 0.03 },
      { frequency: 220, duration: 0.09, gap: 0.04, type: 'sine', gain: 0.03 },
      { frequency: 784, duration: 0.16, type: 'triangle', gain: 0.045 }
    ];
  }

  return [
    { frequency: 220, duration: 0.09, gap: 0.03, type: 'sine', gain: 0.03 },
    { frequency: 220, duration: 0.09, gap: 0.04, type: 'sine', gain: 0.03 },
    { frequency: 188, duration: 0.28, type: 'sawtooth', gain: 0.04 }
  ];
}

export async function playRevealTone(isCorrect: boolean, soundEnabled = true): Promise<void> {
  if (!soundEnabled) return;

  const context = await ensureRunningContext();
  if (!context) return;

  const steps = sequenceForResult(isCorrect);
  let cursor = context.currentTime;

  try {
    for (const step of steps) {
      scheduleTone(context, cursor, step);
      cursor += step.duration + (step.gap ?? 0.02);
    }
  } catch {
    // Silently ignore audio failures so gameplay is never blocked.
    return;
  }
}
