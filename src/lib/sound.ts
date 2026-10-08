import type { SoundEffect } from "./settings";

let ctx: AudioContext | null = null;
let boinkBuffer: Promise<AudioBuffer> | null = null;

function audio() {
  ctx ??= new AudioContext();
  return ctx;
}

/** The meme bonk, from public/sounds. Decoded once and reused. */
const BOINK_URL = "/sounds/boink.mp3";
/** The file opens with ~176ms of silence; skip it so the hit lands with the hammer. */
const BOINK_OFFSET = 0.17;
/** The file peaks at 0 dB; bring it closer to the classic effect's level. */
const BOINK_VOLUME = 0.6;

function loadBoink(ac: AudioContext) {
  boinkBuffer ??= fetch(BOINK_URL)
    .then((res) => res.arrayBuffer())
    .then((data) => ac.decodeAudioData(data))
    .catch((err) => {
      boinkBuffer = null; // try again next time
      throw err;
    });
  return boinkBuffer;
}

async function boink(ac: AudioContext) {
  const buffer = await loadBoink(ac);
  const source = ac.createBufferSource();
  const gain = ac.createGain();
  source.buffer = buffer;
  gain.gain.value = BOINK_VOLUME;
  source.connect(gain).connect(ac.destination);
  source.start(0, BOINK_OFFSET);
}

/** The original effect: a rubbery pitch drop with a fast wobble, synthesized with WebAudio. */
function classic(ac: AudioContext) {
  const t = ac.currentTime;

  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const lfo = ac.createOscillator();
  const lfoGain = ac.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(880, t);
  osc.frequency.exponentialRampToValueAtTime(240, t + 0.08);
  osc.frequency.exponentialRampToValueAtTime(430, t + 0.15);
  osc.frequency.exponentialRampToValueAtTime(170, t + 0.34);

  lfo.frequency.value = 26;
  lfoGain.gain.value = 28;
  lfo.connect(lfoGain).connect(osc.frequency);

  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  lfo.start(t);
  osc.stop(t + 0.42);
  lfo.stop(t + 0.42);
}

/** Decodes the bonk ahead of time so the first download doesn't play it late. */
export function preloadSounds() {
  try {
    void loadBoink(audio()).catch(() => {});
  } catch {
    // no audio device
  }
}

export function playSound(effect: SoundEffect) {
  if (effect === "none") return;
  try {
    const ac = audio();
    // The context starts suspended until a user gesture; queued downloads finish without one.
    if (ac.state === "suspended") void ac.resume();
    if (effect === "boink") {
      // If the file can't load, the classic effect still marks the finish.
      boink(ac).catch(() => classic(ac));
    } else {
      classic(ac);
    }
  } catch {
    // no audio device: stay silent
  }
}
