import { createContext, useContext } from "react";
import type { AudioFormat, Quality, SoundEffect } from "./settings";
import type { UpdateMode } from "./updater";

export type Lang = "pt" | "en";

export const LANG_LABEL: Record<Lang, string> = { pt: "português", en: "english" };

/** Windows/WebView locale decides the first-run language; the user can switch in settings. */
export function detectLang(): Lang {
  return navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}

const pt = {
  htmlLang: "pt-BR",
  nav: { home: "baixar", settings: "ajustes", about: "sobre", label: "navegação" },

  home: {
    modes: { auto: "auto", audio: "áudio", mute: "sem som" },
    modeGroup: "modo",
    placeholder: "cole um ou mais links",
    inputLabel: "link do vídeo",
    download: "baixar",
    addToQueue: "adicionar à fila",
    folder: "pasta",
    paste: "colar",
    error: "erro",
    notALink: "isso não parece um link. começa com https://",
    skipped: (n: number) => `${n} ${n === 1 ? "item ignorado" : "itens ignorados"}: não é link`,
    noClipboard: "sem acesso à área de transferência. use ctrl+v",
    copyFailed: "não consegui copiar o caminho",
    queue: (done: number, total: number) => `fila · ${done} de ${total}`,
    clearFinished: "limpar concluídos",
    summaryAudio: (format: AudioFormat) => `áudio ${format}`,
    summaryVideo: (quality: string) => `vídeo ${quality}`,
    enterHint: "baixa",
    muteSuffix: "(sem som)",
  },

  row: {
    queued: "na fila",
    connecting: "conectando",
    processing: "finalizando",
    done: "pronto",
    error: "erro",
    open: (file: string) => `abrir ${file}`,
    copy: "copiar caminho",
    copied: "copiado",
    reveal: "mostrar na pasta",
    retry: "tentar de novo",
    cancel: "cancelar",
    remove: "remover",
  },

  settings: {
    title: "ajustes",
    lede: "Valem para todo download. Ficam salvos neste computador.",
    video: "vídeo",
    quality: "Qualidade",
    qualityHint:
      "10 min de vídeo dão até ~40 MB em 480p, ~150 MB em 720p e ~250 MB em 1080p. Se o site não tiver essa, baixa a mais próxima abaixo.",
    qualityLabels: { best: "máxima", "1080": "1080p", "720": "720p", "480": "480p" } as Record<
      Quality,
      string
    >,
    audio: "áudio",
    format: "Formato",
    formatHint: "mp3 toca em qualquer lugar. m4a e opus são menores e mais rápidos.",
    formatGroup: "formato de áudio",
    general: "geral",
    folder: "Pasta de destino",
    folderCustom: "Pasta escolhida por você.",
    folderDefault: "Padrão: uma pasta boink dentro de Downloads.",
    pickTitle: "Onde salvar os downloads",
    change: "alterar",
    open: "abrir",
    useDefault: "usar padrão",
    sound: "Som ao terminar",
    soundHint: "Toca quando um download fica pronto. Clique para ouvir.",
    soundLabels: { boink: "boink", classic: "clássico", none: "nenhum" } as Record<
      SoundEffect,
      string
    >,
    language: "Idioma",
    languageHint: "Idioma da interface.",
    updates: "Atualizações",
    updatesHint: "Ao abrir, o boink confere no GitHub se saiu versão nova.",
    updateLabels: { auto: "instalar sozinho", notify: "só avisar" } as Record<UpdateMode, string>,
  },

  about: {
    title: "sobre o boink",
    prose:
      "Cola o link, aperta enter, o arquivo cai na pasta. Sem conta, sem anúncio, sem rastreamento. Código aberto.",
    builtWith: "feito com",
    credits: {
      "yt-dlp": "faz o download. suporta mais de mil sites",
      ffmpeg: "junta vídeo e áudio e converte formatos",
      tauri: "a janela nativa, leve e rápida",
    },
    version: "versão",
    source: "código-fonte",
    checkUpdates: "procurar atualização",
  },

  update: {
    checking: "procurando atualização…",
    latest: "você já está na versão mais nova",
    available: (v: string) => `saiu o boink ${v}`,
    downloading: (v: string) => `baixando o boink ${v}…`,
    ready: (v: string) => `o boink ${v} está pronto. O app fecha e abre de novo pra instalar.`,
    installing: (v: string) => `instalando o boink ${v}…`,
    error: (detail: string) => `não deu pra atualizar: ${detail}`,
    offline: "não deu pra procurar atualização: o GitHub não respondeu",
    badSignature: "a atualização não passou na verificação de assinatura e foi descartada",
    update: "atualizar",
    install: "instalar agora",
    waitQueue: "espera a fila terminar",
    dismiss: "fechar aviso",
  },

  errors: {
    folder: (detail: string) => `não foi possível criar a pasta: ${detail}`,
    spawn: (detail: string) => `não foi possível iniciar o yt-dlp: ${detail}`,
    exit: (code: string) => `yt-dlp saiu com código ${code}`,
    noFile: "o download terminou, mas o arquivo não foi encontrado",
    mute: (detail: string) => `falha ao remover o áudio: ${detail}`,
    cancelled: "cancelado",
  },
};

export type Strings = typeof pt;

const en: Strings = {
  htmlLang: "en",
  nav: { home: "download", settings: "settings", about: "about", label: "navigation" },

  home: {
    modes: { auto: "auto", audio: "audio", mute: "no sound" },
    modeGroup: "mode",
    placeholder: "paste one or more links",
    inputLabel: "video link",
    download: "download",
    addToQueue: "add to queue",
    folder: "folder",
    paste: "paste",
    error: "error",
    notALink: "that doesn't look like a link. it starts with https://",
    skipped: (n: number) => `${n} ${n === 1 ? "item" : "items"} skipped: not a link`,
    noClipboard: "no clipboard access. use ctrl+v",
    copyFailed: "couldn't copy the path",
    queue: (done: number, total: number) => `queue · ${done} of ${total}`,
    clearFinished: "clear finished",
    summaryAudio: (format: AudioFormat) => `audio ${format}`,
    summaryVideo: (quality: string) => `video ${quality}`,
    enterHint: "downloads",
    muteSuffix: "(no sound)",
  },

  row: {
    queued: "queued",
    connecting: "connecting",
    processing: "finishing",
    done: "done",
    error: "error",
    open: (file: string) => `open ${file}`,
    copy: "copy path",
    copied: "copied",
    reveal: "show in folder",
    retry: "try again",
    cancel: "cancel",
    remove: "remove",
  },

  settings: {
    title: "settings",
    lede: "They apply to every download and are saved on this computer.",
    video: "video",
    quality: "Quality",
    qualityHint:
      "10 min of video comes to about 40 MB at 480p, 150 MB at 720p and 250 MB at 1080p. If the site doesn't have it, the closest one below is used.",
    qualityLabels: { best: "max", "1080": "1080p", "720": "720p", "480": "480p" },
    audio: "audio",
    format: "Format",
    formatHint: "mp3 plays everywhere. m4a and opus are smaller and faster.",
    formatGroup: "audio format",
    general: "general",
    folder: "Download folder",
    folderCustom: "A folder you picked.",
    folderDefault: "Default: a boink folder inside Downloads.",
    pickTitle: "Where to save downloads",
    change: "change",
    open: "open",
    useDefault: "use default",
    sound: "Sound when done",
    soundHint: "Plays when a download finishes. Click to preview.",
    soundLabels: { boink: "boink", classic: "classic", none: "none" },
    language: "Language",
    languageHint: "Interface language.",
    updates: "Updates",
    updatesHint: "When it opens, boink checks GitHub for a new version.",
    updateLabels: { auto: "install on its own", notify: "just tell me" },
  },

  about: {
    title: "about boink",
    prose:
      "Paste the link, hit enter, the file lands in your folder. No account, no ads, no tracking. Open source.",
    builtWith: "built with",
    credits: {
      "yt-dlp": "does the downloading. supports over a thousand sites",
      ffmpeg: "merges video and audio and converts formats",
      tauri: "the native window, small and fast",
    },
    version: "version",
    source: "source code",
    checkUpdates: "check for updates",
  },

  update: {
    checking: "checking for updates…",
    latest: "you're on the latest version",
    available: (v: string) => `boink ${v} is out`,
    downloading: (v: string) => `downloading boink ${v}…`,
    ready: (v: string) => `boink ${v} is ready. The app closes and reopens to install it.`,
    installing: (v: string) => `installing boink ${v}…`,
    error: (detail: string) => `couldn't update: ${detail}`,
    offline: "couldn't check for updates: GitHub didn't answer",
    badSignature: "the update failed its signature check and was discarded",
    update: "update",
    install: "install now",
    waitQueue: "wait for the queue to finish",
    dismiss: "dismiss",
  },

  errors: {
    folder: (detail: string) => `couldn't create the folder: ${detail}`,
    spawn: (detail: string) => `couldn't start yt-dlp: ${detail}`,
    exit: (code: string) => `yt-dlp exited with code ${code}`,
    noFile: "the download finished, but the file wasn't found",
    mute: (detail: string) => `couldn't remove the audio: ${detail}`,
    cancelled: "cancelled",
  },
};

export const STRINGS: Record<Lang, Strings> = { pt, en };

export const I18nContext = createContext<Strings>(pt);

export function useT() {
  return useContext(I18nContext);
}

/**
 * The backend reports its own failures as `boink:<code>:<detail>` so they can be
 * shown in the user's language. Anything else (yt-dlp's messages) passes through.
 */
export function describeError(err: unknown, t: Strings) {
  const text = String(err);
  const match = /^boink:(\w+):?([\s\S]*)$/.exec(text);
  if (!match) return text;
  const [, code, detail] = match;
  switch (code) {
    case "folder":
      return t.errors.folder(detail);
    case "spawn":
      return t.errors.spawn(detail);
    case "exit":
      return t.errors.exit(detail);
    case "no_file":
      return t.errors.noFile;
    case "mute":
      return t.errors.mute(detail);
    case "cancelled":
      return t.errors.cancelled;
    default:
      return detail || text;
  }
}
