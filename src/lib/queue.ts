import { useEffect, useRef, useState } from "react";
import { cancelDownload, download, fileName, type DownloadRequest } from "./download";

export type ItemState = "queued" | "downloading" | "processing" | "done" | "error";

export type QueueItem = DownloadRequest & {
  id: number;
  state: ItemState;
  /** 0–100 while downloading, null when yt-dlp doesn't know the size yet. */
  percent: number | null;
  file?: string;
  path?: string;
  error?: string;
};

export const isActive = (item: QueueItem) =>
  item.state === "downloading" || item.state === "processing";

let nextId = 1;

/**
 * Downloads one link at a time, in the order they were added.
 * Lives in App so the queue keeps running while the user is on another page.
 */
export function useDownloadQueue() {
  const [items, setItems] = useState<QueueItem[]>([]);
  /** Bumps on every finished download; Home plays the boink when it changes. */
  const [completed, setCompleted] = useState(0);
  const running = useRef(false);
  /** Ids the user cancelled; their rejection removes the row instead of showing an error. */
  const cancelled = useRef(new Set<number>());

  function patch(id: number, changes: Partial<QueueItem>) {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }

  useEffect(() => {
    if (running.current) return;
    const next = items.find((it) => it.state === "queued");
    if (!next) return;

    running.current = true;
    patch(next.id, { state: "downloading", percent: null, error: undefined });

    const { id, url, mode, quality, audioFormat, folder, muteSuffix } = next;
    download(id, { url, mode, quality, audioFormat, folder, muteSuffix }, (p) =>
      patch(
        id,
        p.stage === "downloading"
          ? { state: "downloading", percent: p.percent }
          : { state: "processing", percent: 100 }
      )
    ).then(
      (path) => {
        running.current = false;
        patch(id, { state: "done", percent: 100, path, file: fileName(path) });
        setCompleted((n) => n + 1);
      },
      (err) => {
        running.current = false;
        if (cancelled.current.delete(id)) {
          setItems((list) => list.filter((it) => it.id !== id));
        } else {
          patch(id, { state: "error", error: String(err) });
        }
      }
    );
  }, [items]);

  function add(requests: DownloadRequest[]) {
    const fresh = requests.map(
      (req): QueueItem => ({ ...req, id: nextId++, state: "queued", percent: null })
    );
    setItems((list) => [...list, ...fresh]);
  }

  /** Removes an item; one that is downloading gets cancelled and leaves once yt-dlp stops. */
  function remove(id: number) {
    const item = items.find((it) => it.id === id);
    if (item && isActive(item)) {
      cancelled.current.add(id);
      cancelDownload(id).catch((err) => {
        cancelled.current.delete(id);
        patch(id, { state: "error", error: String(err) });
      });
      return;
    }
    setItems((list) => list.filter((it) => it.id !== id));
  }

  function retry(id: number) {
    patch(id, { state: "queued", percent: null, error: undefined });
  }

  function clearFinished() {
    setItems((list) => list.filter((it) => it.state !== "done" && it.state !== "error"));
  }

  const pending = items.filter((it) => it.state === "queued" || isActive(it)).length;

  return { items, completed, pending, add, remove, retry, clearFinished };
}

export type DownloadQueue = ReturnType<typeof useDownloadQueue>;
