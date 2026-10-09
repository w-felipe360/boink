import { Channel, invoke } from "@tauri-apps/api/core";
import type { AudioFormat, Mode, Quality } from "./settings";

export type DownloadRequest = {
  url: string;
  mode: Mode;
  quality: Quality;
  audioFormat: AudioFormat;
  /** Absolute destination folder. Empty means the backend default (Downloads\boink). */
  folder: string;
  /** Appended to the file name in "mute" mode, in the user's language: "(sem som)". */
  muteSuffix: string;
};

/** Mirrors the `Progress` enum in src-tauri/src/lib.rs. */
export type Progress =
  | { stage: "downloading"; percent: number | null }
  | { stage: "processing" };

export function isValidUrl(value: string) {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** Splits pasted text into candidate links (one per line, space or comma). */
export function splitLinks(text: string) {
  return text.split(/[\s,]+/).filter(Boolean);
}

export function fileName(path: string) {
  return path.split(/[\\/]/).pop() ?? path;
}

/**
 * Runs yt-dlp through the Rust backend and resolves with the saved file's path.
 * `id` lets `cancelDownload` find the process later.
 */
export function download(id: number, req: DownloadRequest, onProgress?: (p: Progress) => void) {
  const channel = new Channel<Progress>();
  if (onProgress) channel.onmessage = onProgress;
  return invoke<string>("download_media", { id, ...req, onProgress: channel });
}

export function cancelDownload(id: number) {
  return invoke<void>("cancel_download", { id });
}

export function defaultFolder() {
  return invoke<string>("default_download_folder");
}

export function openFolder(path: string) {
  return invoke<void>("open_folder", { path });
}

/** Opens the file with the system's default app (the video player, for videos). */
export function openFile(path: string) {
  return invoke<void>("open_file", { path });
}

export function revealFile(path: string) {
  return invoke<void>("reveal_file", { path });
}

/** Puts the file itself on the clipboard, so Ctrl+V in a chat app pastes the video. */
export function copyFile(path: string) {
  return invoke<void>("copy_file", { path });
}
