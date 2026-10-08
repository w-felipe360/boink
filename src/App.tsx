import { useEffect, useState } from "react";
import { DownloadSimpleIcon, InfoIcon, SlidersHorizontalIcon } from "@phosphor-icons/react";
import { BoinkMark } from "./components/BoinkMark";
import { defaultFolder } from "./lib/download";
import { I18nContext, STRINGS } from "./lib/i18n";
import { useDownloadQueue } from "./lib/queue";
import { preloadSounds } from "./lib/sound";
import { useSettings } from "./lib/settings";
import { Home } from "./views/Home";
import { SettingsPage } from "./views/SettingsPage";
import { AboutPage } from "./views/AboutPage";

type View = "home" | "settings" | "about";

const VERSION = `v${__APP_VERSION__}`;

const NAV: { id: View; Icon: typeof InfoIcon }[] = [
  { id: "home", Icon: DownloadSimpleIcon },
  { id: "settings", Icon: SlidersHorizontalIcon },
  { id: "about", Icon: InfoIcon },
];

function App() {
  const [view, setView] = useState<View>("home");
  const { settings, update } = useSettings();
  const queue = useDownloadQueue();
  const [fallbackFolder, setFallbackFolder] = useState("");
  const t = STRINGS[settings.language];

  useEffect(() => {
    defaultFolder().then(setFallbackFolder, () => {});
    preloadSounds();
  }, []);

  useEffect(() => {
    document.documentElement.lang = t.htmlLang;
  }, [t]);

  /** Where files actually land: the chosen folder, or Downloads\boink. */
  const folder = settings.folder || fallbackFolder;

  return (
    <I18nContext.Provider value={t}>
      <div className="shell">
        <nav className="rail" aria-label={t.nav.label}>
          <BoinkMark className="rail-mark" impact={false} />
          {NAV.map(({ id, Icon }) => (
            <button
              key={id}
              type="button"
              className="rail-item"
              aria-current={view === id ? "page" : undefined}
              onClick={() => setView(id)}
            >
              <Icon size={20} weight={view === id ? "fill" : "bold"} />
              {t.nav[id]}
              {id === "home" && view !== "home" && queue.pending > 0 && (
                <span className="rail-badge">{queue.pending}</span>
              )}
            </button>
          ))}
          <span className="rail-version">{VERSION}</span>
        </nav>

        <main className="main">
          <div className="ambient" />
          {view === "home" && <Home settings={settings} folder={folder} queue={queue} />}
          {view === "settings" && (
            <SettingsPage
              settings={settings}
              update={update}
              folder={folder}
              fallbackFolder={fallbackFolder}
            />
          )}
          {view === "about" && <AboutPage version={VERSION} />}
        </main>
      </div>
    </I18nContext.Provider>
  );
}

export default App;
