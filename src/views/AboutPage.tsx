import type { CSSProperties } from "react";
import { GithubLogoIcon } from "@phosphor-icons/react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { BoinkMark } from "../components/BoinkMark";
import { useT } from "../lib/i18n";

const i = (n: number) => ({ "--i": n }) as CSSProperties;

const CREDITS = ["yt-dlp", "ffmpeg", "tauri"] as const;

export const REPO_URL = "https://github.com/w-felipe360/boink";

export function AboutPage({ version }: { version: string }) {
  const t = useT();
  return (
    <section className="page">
      <div className="reveal" style={i(0)}>
        <BoinkMark className="about-mark" />
      </div>
      <h1 className="page-title reveal" style={i(1)}>
        {t.about.title}
      </h1>
      <p className="prose reveal" style={i(2)}>
        {t.about.prose}
      </p>

      <div className="reveal" style={i(3)}>
        <p className="section-label">{t.about.builtWith}</p>
        <div className="rows">
          {CREDITS.map((name) => (
            <div className="row" key={name}>
              <span className="row-label">{name}</span>
              <span className="row-value">{t.about.credits[name]}</span>
            </div>
          ))}
          <div className="row">
            <span className="row-label">{t.about.version}</span>
            <span className="row-value">{version}</span>
          </div>
          <div className="row">
            <span className="row-label">{t.about.source}</span>
            <button
              type="button"
              className="ghost ghost-sm"
              onClick={() => openUrl(REPO_URL).catch(() => {})}
            >
              <GithubLogoIcon size={14} weight="bold" />
              github
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
