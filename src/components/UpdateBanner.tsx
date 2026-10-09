import { ArrowCircleUpIcon, WarningCircleIcon, XIcon } from "@phosphor-icons/react";
import { useT, type Strings } from "../lib/i18n";
import type { AppUpdate } from "../lib/updater";

/**
 * Floats over the top of every page while there's an update to talk about.
 * "checking" and "latest" only matter to someone who asked, so they live on the About page.
 */
export function UpdateBanner({ update, busy }: { update: AppUpdate; busy: boolean }) {
  const t = useT();
  const { state } = update;

  let text: string;
  let action: { label: string; disabled?: boolean; title?: string } | null = null;
  let dismissable = false;
  switch (state.stage) {
    case "available":
      text = t.update.available(state.version);
      action = { label: t.update.update };
      dismissable = true;
      break;
    case "downloading":
      text = t.update.downloading(state.version);
      break;
    case "ready":
      text = t.update.ready(state.version);
      action = {
        label: t.update.install,
        disabled: busy,
        title: busy ? t.update.waitQueue : undefined,
      };
      dismissable = true;
      break;
    case "installing":
      text = t.update.installing(state.version);
      break;
    case "error":
      text = updateError(state.message, t);
      dismissable = true;
      break;
    default:
      return null;
  }

  const error = state.stage === "error";
  return (
    <div className="update-dock">
      <div className="update-banner" role="status" data-error={error || undefined}>
        {error ? (
          <WarningCircleIcon size={16} weight="bold" />
        ) : (
          <ArrowCircleUpIcon size={16} weight="bold" />
        )}
        <span className="update-text" title={error ? state.message : text}>
          {text}
        </span>
        {state.stage === "downloading" && (
          <span
            className="bar update-bar"
            data-indeterminate={state.percent == null || undefined}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={state.percent != null ? Math.round(state.percent) : undefined}
          >
            <span style={{ transform: `scaleX(${(state.percent ?? 0) / 100})` }} />
          </span>
        )}
        {action && (
          <button
            type="button"
            className="ghost ghost-sm update-action"
            disabled={action.disabled}
            title={action.title}
            onClick={update.apply}
          >
            {action.label}
          </button>
        )}
        {dismissable && (
          <button
            type="button"
            className="icon-btn"
            aria-label={t.update.dismiss}
            title={t.update.dismiss}
            onClick={update.dismiss}
          >
            <XIcon size={14} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}

/** The updater's errors are English prose; the two a user will actually meet get translated. */
function updateError(message: string, t: Strings) {
  if (/signed for version|signature/i.test(message)) return t.update.badSignature;
  if (/release JSON|error sending request|dns|connect|timed? ?out/i.test(message)) {
    return t.update.offline;
  }
  return t.update.error(message);
}
