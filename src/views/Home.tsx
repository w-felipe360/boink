import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  ArrowClockwiseIcon,
  ArrowRightIcon,
  BroomIcon,
  CheckIcon,
  ClipboardTextIcon,
  CopyIcon,
  FolderOpenIcon,
  LinkSimpleIcon,
  MusicNotesIcon,
  PlusIcon,
  SpeakerSlashIcon,
  SparkleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { BoinkMark } from "../components/BoinkMark";
import { isValidUrl, openFile, openFolder, revealFile, splitLinks } from "../lib/download";
import { describeError, useT } from "../lib/i18n";
import { isActive, type DownloadQueue, type QueueItem } from "../lib/queue";
import { playSound } from "../lib/sound";
import { shortPath, type Mode, type Settings } from "../lib/settings";

const MODES: { id: Mode; Icon: typeof SparkleIcon }[] = [
  { id: "auto", Icon: SparkleIcon },
  { id: "audio", Icon: MusicNotesIcon },
  { id: "mute", Icon: SpeakerSlashIcon },
];

const MODE_ICON: Record<Mode, typeof SparkleIcon> = {
  auto: SparkleIcon,
  audio: MusicNotesIcon,
  mute: SpeakerSlashIcon,
};

/** Delay so the sound lands on the frame where the hammer hits the arrow. */
const IMPACT_MS = 380;

type Props = {
  settings: Settings;
  /** Resolved destination folder (custom or Downloads\boink). */
  folder: string;
  queue: DownloadQueue;
};

export function Home({ settings, folder, queue }: Props) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<Mode>("auto");
  const [error, setError] = useState<string | null>(null);
  const [bonk, setBonk] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const seenCompleted = useRef(queue.completed);

  useEffect(() => inputRef.current?.focus(), []);

  // One boink per finished download. Starts from the current count so
  // coming back from another page doesn't replay old ones.
  useEffect(() => {
    if (queue.completed > seenCompleted.current) strike();
    seenCompleted.current = queue.completed;
  }, [queue.completed]);

  function strike() {
    setBonk((n) => n + 1);
    const { sound } = settings;
    if (sound !== "none") setTimeout(() => playSound(sound), IMPACT_MS);
  }

  /** Queues every valid link in `text`. Returns false if none were valid. */
  function enqueue(text: string) {
    const links = splitLinks(text);
    const valid = links.filter(isValidUrl);
    if (valid.length === 0) {
      setError(t.home.notALink);
      return false;
    }
    queue.add(
      valid.map((u) => ({
        url: u,
        mode,
        quality: settings.quality,
        audioFormat: settings.audioFormat,
        folder,
        muteSuffix: t.home.muteSuffix,
      }))
    );
    const skipped = links.length - valid.length;
    setError(skipped > 0 ? t.home.skipped(skipped) : null);
    return true;
  }

  function submit(e?: FormEvent) {
    e?.preventDefault();
    if (enqueue(url)) setUrl("");
    inputRef.current?.focus();
  }

  // Several links pasted at once go straight to the queue.
  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (splitLinks(text).length > 1) {
      e.preventDefault();
      enqueue(text);
    }
  }

  async function paste() {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (splitLinks(text).length > 1) {
        enqueue(text);
      } else {
        setUrl(text);
        setError(null);
      }
    } catch {
      setError(t.home.noClipboard);
    }
    inputRef.current?.focus();
  }

  function showError(err: unknown) {
    setError(describeError(err, t));
  }

  const { items } = queue;
  const busy = items.some(isActive);
  const finished = items.filter((it) => it.state === "done" || it.state === "error").length;
  const modeSummary =
    mode === "audio"
      ? t.home.summaryAudio(settings.audioFormat)
      : t.home.summaryVideo(t.settings.qualityLabels[settings.quality]);

  return (
    <section className="home" data-has-queue={items.length > 0 || undefined}>
      <button
        type="button"
        className="brand reveal"
        style={{ "--i": 0 } as CSSProperties}
        onClick={strike}
        aria-label="boink"
      >
        <BoinkMark className="brand-mark" bonk={bonk} />
        <span className="brand-word">boink</span>
      </button>

      <form
        className="omnibox reveal"
        style={{ "--i": 1 } as CSSProperties}
        data-state={error ? "error" : undefined}
        onSubmit={submit}
      >
        <LinkSimpleIcon className="omnibox-icon" size={18} weight="bold" />
        <input
          ref={inputRef}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          onPaste={onPaste}
          placeholder={t.home.placeholder}
          spellCheck={false}
          autoComplete="off"
          aria-label={t.home.inputLabel}
        />
        <button
          className="go"
          type="submit"
          disabled={!url.trim()}
          aria-label={busy ? t.home.addToQueue : t.home.download}
          title={busy ? t.home.addToQueue : t.home.download}
        >
          {busy ? <PlusIcon size={18} weight="bold" /> : <ArrowRightIcon size={18} weight="bold" />}
        </button>
      </form>

      <div className="controls reveal" style={{ "--i": 2 } as CSSProperties}>
        <div className="segmented" role="group" aria-label={t.home.modeGroup}>
          {MODES.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
            >
              <Icon size={14} weight="bold" />
              {t.home.modes[id]}
            </button>
          ))}
        </div>
        <div className="controls-actions">
          <button
            type="button"
            className="ghost"
            onClick={() => openFolder(folder).catch(showError)}
            disabled={!folder}
            title={folder}
          >
            <FolderOpenIcon size={15} weight="bold" />
            {t.home.folder}
          </button>
          <button type="button" className="ghost" onClick={paste}>
            <ClipboardTextIcon size={15} weight="bold" />
            {t.home.paste}
          </button>
        </div>
      </div>

      <div className="status" role="status" aria-live="polite">
        {error && (
          <>
            <span className="tag tag-red">{t.home.error}</span>
            <span className="status-text">{error}</span>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="queue">
          <div className="queue-head">
            <span className="section-label">
              {t.home.queue(items.length - queue.pending, items.length)}
            </span>
            {finished > 0 && (
              <button type="button" className="link-btn" onClick={queue.clearFinished}>
                <BroomIcon size={13} weight="bold" />
                {t.home.clearFinished}
              </button>
            )}
          </div>
          <ul className="queue-list">
            {items.map((item) => (
              <QueueRow
                key={item.id}
                item={item}
                onRemove={() => queue.remove(item.id)}
                onRetry={() => queue.retry(item.id)}
                onReveal={() => item.path && revealFile(item.path).catch(showError)}
                onOpen={() => item.path && openFile(item.path).catch(showError)}
                onCopyError={() => setError(t.home.copyFailed)}
              />
            ))}
          </ul>
        </div>
      )}

      <footer className="home-foot">
        <span title={folder}>{folder ? shortPath(folder) : "Downloads"}</span>
        <span>{modeSummary}</span>
        <span>
          <kbd>enter</kbd> {t.home.enterHint}
        </span>
      </footer>
    </section>
  );
}

function displayUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "") + u.search;
  } catch {
    return url;
  }
}

function QueueRow({
  item,
  onRemove,
  onRetry,
  onReveal,
  onOpen,
  onCopyError,
}: {
  item: QueueItem;
  onRemove: () => void;
  onRetry: () => void;
  onReveal: () => void;
  onOpen: () => void;
  onCopyError: () => void;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function copyPath() {
    if (!item.path) return;
    try {
      await navigator.clipboard.writeText(item.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      onCopyError();
    }
  }

  const Icon = MODE_ICON[item.mode];
  const active = isActive(item);
  const pct = item.percent ?? 0;

  let detail: string;
  switch (item.state) {
    case "queued":
      detail = t.row.queued;
      break;
    case "downloading":
      detail = item.percent == null ? t.row.connecting : `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
      break;
    case "processing":
      detail = t.row.processing;
      break;
    case "done":
      detail = t.row.done;
      break;
    case "error":
      detail = item.error ? describeError(item.error, t) : t.row.error;
      break;
  }

  return (
    <li className="queue-item" data-state={item.state}>
      <Icon className="queue-icon" size={16} weight="bold" />
      <div className="queue-main">
        {item.state === "done" ? (
          <button
            type="button"
            className="queue-title queue-open"
            onClick={onOpen}
            title={t.row.open(item.file ?? "")}
          >
            {item.file}
          </button>
        ) : (
          <span className="queue-title" title={item.url}>
            {displayUrl(item.url)}
          </span>
        )}
        <div className="queue-meta">
          {active && (
            <span
              className="bar"
              data-indeterminate={item.state === "processing" || item.percent == null || undefined}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={item.percent != null ? Math.round(pct) : undefined}
            >
              <span style={{ transform: `scaleX(${pct / 100})` }} />
            </span>
          )}
          <span className="queue-detail" title={item.state === "error" ? detail : undefined}>
            {detail}
          </span>
        </div>
      </div>
      <div className="queue-actions">
        {item.state === "done" && (
          <>
            <button
              type="button"
              className="icon-btn"
              onClick={copyPath}
              title={copied ? t.row.copied : t.row.copy}
              data-copied={copied || undefined}
            >
              {copied ? <CheckIcon size={15} weight="bold" /> : <CopyIcon size={15} weight="bold" />}
            </button>
            <button type="button" className="icon-btn" onClick={onReveal} title={t.row.reveal}>
              <FolderOpenIcon size={15} weight="bold" />
            </button>
          </>
        )}
        {item.state === "error" && (
          <button type="button" className="icon-btn" onClick={onRetry} title={t.row.retry}>
            <ArrowClockwiseIcon size={15} weight="bold" />
          </button>
        )}
        <button
          type="button"
          className="icon-btn"
          onClick={onRemove}
          title={active ? t.row.cancel : t.row.remove}
        >
          <XIcon size={14} weight="bold" />
        </button>
      </div>
    </li>
  );
}
