import { useState, type CSSProperties } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { openFolder } from "../lib/download";
import { describeError, LANG_LABEL, useT, type Lang } from "../lib/i18n";
import { playSound } from "../lib/sound";
import type { AudioFormat, Quality, Settings, SoundEffect } from "../lib/settings";

type Props = {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** Resolved destination folder (custom or the default). */
  folder: string;
  /** The default, Downloads/boink, as reported by the backend. */
  fallbackFolder: string;
};

const QUALITIES: Quality[] = ["best", "1080", "720", "480"];
const FORMATS: AudioFormat[] = ["mp3", "m4a", "opus"];
const SOUNDS: SoundEffect[] = ["boink", "classic", "none"];
const LANGS: Lang[] = ["pt", "en"];

const i = (n: number) => ({ "--i": n }) as CSSProperties;

export function SettingsPage({ settings, update, folder, fallbackFolder }: Props) {
  const t = useT();
  const [folderError, setFolderError] = useState<string | null>(null);

  async function pickFolder() {
    try {
      const picked = await open({
        directory: true,
        defaultPath: folder || undefined,
        title: t.settings.pickTitle,
      });
      if (typeof picked === "string") {
        update("folder", picked === fallbackFolder ? "" : picked);
        setFolderError(null);
      }
    } catch (err) {
      setFolderError(describeError(err, t));
    }
  }

  return (
    <section className="page">
      <h1 className="page-title reveal" style={i(0)}>
        {t.settings.title}
      </h1>
      <p className="page-lede reveal" style={i(1)}>
        {t.settings.lede}
      </p>

      <div className="reveal" style={i(2)}>
        <p className="section-label">{t.settings.video}</p>
        <div className="rows">
          <div className="row">
            <div>
              <div className="row-label">{t.settings.quality}</div>
              <div className="row-hint">{t.settings.qualityHint}</div>
            </div>
            <div className="segmented" role="group" aria-label={t.settings.quality}>
              {QUALITIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  aria-pressed={settings.quality === q}
                  onClick={() => update("quality", q)}
                >
                  {t.settings.qualityLabels[q]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="reveal" style={i(3)}>
        <p className="section-label">{t.settings.audio}</p>
        <div className="rows">
          <div className="row">
            <div>
              <div className="row-label">{t.settings.format}</div>
              <div className="row-hint">{t.settings.formatHint}</div>
            </div>
            <div className="segmented" role="group" aria-label={t.settings.formatGroup}>
              {FORMATS.map((f) => (
                <button
                  key={f}
                  type="button"
                  aria-pressed={settings.audioFormat === f}
                  onClick={() => update("audioFormat", f)}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="reveal" style={i(4)}>
        <p className="section-label">{t.settings.general}</p>
        <div className="rows">
          <div className="row row-stack">
            <div>
              <div className="row-label">{t.settings.folder}</div>
              <div className="row-hint">
                {settings.folder ? t.settings.folderCustom : t.settings.folderDefault}
              </div>
            </div>
            <div className="folder-field">
              <span className="path" title={folder}>
                {folder || "Downloads\\boink"}
              </span>
              <button type="button" className="ghost ghost-sm" onClick={pickFolder}>
                {t.settings.change}
              </button>
              <button
                type="button"
                className="ghost ghost-sm"
                onClick={() =>
                  openFolder(folder).catch((e) => setFolderError(describeError(e, t)))
                }
                disabled={!folder}
              >
                {t.settings.open}
              </button>
              {settings.folder && (
                <button
                  type="button"
                  className="ghost ghost-sm"
                  onClick={() => update("folder", "")}
                >
                  {t.settings.useDefault}
                </button>
              )}
            </div>
            {folderError && <div className="row-error">{folderError}</div>}
          </div>
          <div className="row">
            <div>
              <div className="row-label">{t.settings.sound}</div>
              <div className="row-hint">{t.settings.soundHint}</div>
            </div>
            <div className="segmented" role="group" aria-label={t.settings.sound}>
              {SOUNDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={settings.sound === s}
                  onClick={() => {
                    update("sound", s);
                    playSound(s);
                  }}
                >
                  {t.settings.soundLabels[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="row">
            <div>
              <div className="row-label">{t.settings.language}</div>
              <div className="row-hint">{t.settings.languageHint}</div>
            </div>
            <div className="segmented" role="group" aria-label={t.settings.language}>
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  lang={STRINGS_LANG[l]}
                  aria-pressed={settings.language === l}
                  onClick={() => update("language", l)}
                >
                  {LANG_LABEL[l]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Each language name is announced in its own language by screen readers. */
const STRINGS_LANG: Record<Lang, string> = { pt: "pt-BR", en: "en" };
