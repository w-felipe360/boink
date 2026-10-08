import { useEffect, useState } from "react";
import { detectLang, type Lang } from "./i18n";

export type Mode = "auto" | "audio" | "mute";
export type Quality = "best" | "1080" | "720" | "480";
export type AudioFormat = "mp3" | "m4a" | "opus";
export type SoundEffect = "boink" | "classic" | "none";

export type Settings = {
  quality: Quality;
  audioFormat: AudioFormat;
  /** Played when a download finishes (and when the logo is clicked). */
  sound: SoundEffect;
  /** Absolute destination folder. Empty means the default, Downloads/boink. */
  folder: string;
  language: Lang;
};

const KEY = "boink.settings";
/** Bump to run the one-off migrations in `load` again. */
const VERSION_KEY = "boink.settings.version";
const VERSION = 2;

const DEFAULTS: Settings = {
  quality: "720",
  audioFormat: "mp3",
  sound: "boink",
  folder: "",
  language: detectLang(),
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    // Older builds stored the sound as an on/off switch.
    if (typeof parsed.sound === "boolean") parsed.sound = parsed.sound ? "boink" : "none";
    const saved: Settings = { ...DEFAULTS, ...parsed };
    // Older builds stored the display label "Downloads" here, not a real path.
    if (saved.folder === "Downloads") saved.folder = "";
    // v2 lowered the default from 1080p to 720p. Older builds saved the default
    // along with everything else, so a stored 1080 wasn't necessarily a choice.
    if (Number(localStorage.getItem(VERSION_KEY) ?? 1) < 2 && saved.quality === "1080") {
      saved.quality = "720";
    }
    if (saved.language !== "pt" && saved.language !== "en") saved.language = detectLang();
    return saved;
  } catch {
    return DEFAULTS;
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(settings));
    localStorage.setItem(VERSION_KEY, String(VERSION));
  }, [settings]);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  return { settings, update };
}

/** Last two path segments, e.g. "Downloads\boink", for tight spots like the footer. */
export function shortPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const sep = path.includes("\\") ? "\\" : "/";
  return parts.slice(-2).join(sep) || path;
}
