import { useEffect, useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";

export type UpdateMode = "auto" | "notify";

export type UpdateState =
  | { stage: "idle" }
  | { stage: "checking" }
  | { stage: "latest" }
  | { stage: "available"; version: string }
  /** `percent` is null until the server says how big the installer is. */
  | { stage: "downloading"; version: string; percent: number | null }
  /** Downloaded, waiting for the queue to finish before installing. */
  | { stage: "ready"; version: string }
  | { stage: "installing"; version: string }
  | { stage: "error"; message: string };

/**
 * Looks for a new release when the app opens (`latest.json` on the newest GitHub
 * release) and, in "auto" mode, downloads it and installs it.
 *
 * Installing quits the app straight away and the installer reopens it, so it never
 * happens while the queue is busy: a running yt-dlp would be killed mid-download and
 * would keep its .exe locked. In that case the update waits as "ready" for a click.
 */
export function useAppUpdate(mode: UpdateMode, busy: boolean) {
  const [state, setState] = useState<UpdateState>({ stage: "idle" });
  const update = useRef<Update | null>(null);
  /** Read inside async callbacks, where the `busy` from the render that started them is stale. */
  const busyNow = useRef(busy);
  busyNow.current = busy;

  async function install() {
    const found = update.current;
    if (!found || busyNow.current) return;
    setState({ stage: "installing", version: found.version });
    try {
      await found.install();
    } catch (err) {
      setState({ stage: "error", message: String(err) });
    }
  }

  async function download() {
    const found = update.current;
    if (!found) return;
    let total = 0;
    let received = 0;
    setState({ stage: "downloading", version: found.version, percent: null });
    try {
      await found.download((event) => {
        if (event.event === "Started") total = event.data.contentLength ?? 0;
        if (event.event !== "Progress") return;
        received += event.data.chunkLength;
        const percent = total ? Math.min(100, (received / total) * 100) : null;
        setState({ stage: "downloading", version: found.version, percent });
      });
    } catch (err) {
      setState({ stage: "error", message: String(err) });
      return;
    }
    setState({ stage: "ready", version: found.version });
    if (!busyNow.current) await install();
  }

  /** `quiet` is the check on startup: being offline there isn't worth an error. */
  async function lookForUpdate({ quiet = false } = {}) {
    setState({ stage: "checking" });
    try {
      update.current = await check();
    } catch (err) {
      setState(quiet ? { stage: "idle" } : { stage: "error", message: String(err) });
      return;
    }
    const found = update.current;
    if (!found) {
      setState(quiet ? { stage: "idle" } : { stage: "latest" });
      return;
    }
    if (mode === "auto") await download();
    else setState({ stage: "available", version: found.version });
  }

  useEffect(() => {
    // `tauri dev` would install the released build over the installed one.
    if (import.meta.env.DEV) return;
    lookForUpdate({ quiet: true });
    // Once per launch: changing the setting later doesn't check again.
  }, []);

  return {
    state,
    lookForUpdate,
    /** Starts the download, or installs one that's already downloaded. */
    apply: () => (state.stage === "ready" ? install() : download()),
    dismiss: () => setState({ stage: "idle" }),
  };
}

export type AppUpdate = ReturnType<typeof useAppUpdate>;
