use std::collections::{HashMap, HashSet};
use std::ffi::OsString;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::Serialize;
use tauri::ipc::Channel;
use tauri::{AppHandle, Manager, State};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

/// yt-dlp processes in flight, keyed by the queue item id from the frontend.
#[derive(Default)]
struct Running(Mutex<HashMap<u32, CommandChild>>);

/// Prefixes we ask yt-dlp to print so we can tell our lines apart from its regular output.
const PROGRESS_TAG: &str = "boink-progress:";
const POST_TAG: &str = "boink-post:";
const FILE_TAG: &str = "boink-file:";
const DEST_TAG: &str = "boink-dest:";

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "stage")]
enum Progress {
    /// `percent` is 0–100 for the current stream; merged videos download video then audio.
    Downloading { percent: Option<f64> },
    Processing,
}

/// Default destination: a `boink` folder inside the user's Downloads.
fn default_folder(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(app.path().download_dir().map_err(|e| e.to_string())?.join("boink"))
}

#[tauri::command]
fn default_download_folder(app: AppHandle) -> Result<String, String> {
    Ok(default_folder(&app)?.to_string_lossy().into_owned())
}

/// Opens a folder in the file manager, creating it first so a fresh install doesn't error.
#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    tauri_plugin_opener::open_path(&path, None::<&str>).map_err(|e| e.to_string())
}

/// Opens a downloaded file with the system's default app.
#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    tauri_plugin_opener::open_path(&path, None::<&str>).map_err(|e| e.to_string())
}

/// Opens the file manager with the downloaded file selected.
#[tauri::command]
fn reveal_file(path: String) -> Result<(), String> {
    tauri_plugin_opener::reveal_item_in_dir(&path).map_err(|e| e.to_string())
}

/// Stops a download. On Windows yt-dlp.exe is a bootloader that spawns the real
/// process, so the whole tree has to go or the download keeps running.
#[tauri::command]
fn cancel_download(id: u32, running: State<'_, Running>) -> Result<(), String> {
    let Some(child) = running.0.lock().unwrap().remove(&id) else {
        return Ok(());
    };
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        let killed = std::process::Command::new("taskkill")
            .args(["/PID", &child.pid().to_string(), "/T", "/F"])
            .creation_flags(CREATE_NO_WINDOW)
            .status()
            .map(|s| s.success())
            .unwrap_or(false);
        if killed {
            return Ok(());
        }
    }
    child.kill().map_err(|e| e.to_string())
}

fn file_names(dir: &Path) -> HashSet<OsString> {
    std::fs::read_dir(dir)
        .map(|entries| entries.flatten().map(|e| e.file_name()).collect())
        .unwrap_or_default()
}

/// Deletes the leftovers of a cancelled download (`.part`, `.f137.mp4`, `.temp.mp4`, ...):
/// files named after `dest` that weren't in the folder before it started.
fn remove_partials(folder: &Path, dest: &Path, existing: &HashSet<OsString>) {
    let Some(stem) = dest.file_stem().map(|s| s.to_string_lossy().into_owned() + ".") else {
        return;
    };
    for name in file_names(folder) {
        if !existing.contains(&name) && name.to_string_lossy().starts_with(&stem) {
            let _ = std::fs::remove_file(folder.join(&name));
        }
    }
}

/// Sidecars are copied next to the app executable without the target-triple suffix,
/// both in `tauri dev` (target/debug) and in the installed bundle.
fn sidecar_path(name: &str) -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    Some(exe.parent()?.join(format!("{name}{}", std::env::consts::EXE_SUFFIX)))
}

/// yt-dlp format sort: the highest resolution up to the chosen quality (or the closest
/// above it when nothing smaller exists), then h264/aac so the file plays anywhere on
/// Windows without extra codecs.
///
/// Capped qualities also prefer 30fps when the site offers it: a 60fps stream is
/// roughly twice the size for the same resolution. "best" takes whatever is highest.
fn video_sort(quality: &str) -> String {
    match quality {
        "1080" | "720" | "480" => format!("res:{quality},fps:30,vcodec:h264,acodec:aac"),
        _ => "res,vcodec:h264,acodec:aac".to_string(),
    }
}

fn format_args(mode: &str, quality: &str, audio_format: &str) -> Vec<String> {
    match mode {
        "audio" => {
            // m4a and opus are picked straight from the site so they're only remuxed,
            // never re-encoded. mp3 always needs a conversion.
            let (codec, format) = match audio_format {
                "m4a" => ("m4a", "ba[ext=m4a]/ba/b"),
                "opus" => ("opus", "ba[acodec=opus]/ba/b"),
                _ => ("mp3", "ba/b"),
            };
            vec![
                "-f".into(),
                format.into(),
                "-x".into(),
                "--audio-format".into(),
                codec.into(),
                // VBR ~190kbps. Sources are ~130kbps, so the max (0, ~245kbps) only bloats the file.
                "--audio-quality".into(),
                "2".into(),
            ]
        }
        // Prefer video-only streams; sites that only serve muxed files fall back to `b`
        // and get their audio stripped afterwards (see `strip_audio`).
        "mute" => vec![
            "-f".into(),
            "bv/b".into(),
            "-S".into(),
            video_sort(quality),
        ],
        _ => vec![
            "-f".into(),
            "bv*+ba/b".into(),
            "-S".into(),
            video_sort(quality),
            "--merge-output-format".into(),
            "mp4".into(),
        ],
    }
}

/// Re-muxes the file without its audio track, replacing the original.
async fn strip_audio(app: &AppHandle, file: &Path) -> Result<(), String> {
    let ext = file.extension().and_then(|e| e.to_str()).unwrap_or("mp4");
    let tmp = file.with_extension(format!("boink-mute.{ext}"));

    let output = app
        .shell()
        .sidecar("ffmpeg")
        .map_err(|e| e.to_string())?
        .args(["-y", "-loglevel", "error", "-i"])
        .arg(file)
        .args(["-map", "0", "-map", "-0:a", "-c", "copy"])
        .arg(&tmp)
        .output()
        .await
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let _ = std::fs::remove_file(&tmp);
        return Err(format!(
            "boink:mute:{}",
            String::from_utf8_lossy(&output.stderr).trim()
        ));
    }
    std::fs::rename(&tmp, file).map_err(|e| e.to_string())
}

/// Downloads `url` with the yt-dlp sidecar into `folder` (or the default one).
/// Streams progress through `on_progress` and resolves with the final file path.
/// Our own failures are `boink:<code>:<detail>` so the frontend can translate them;
/// yt-dlp's error lines are passed through as-is.
#[tauri::command]
async fn download_media(
    app: AppHandle,
    running: State<'_, Running>,
    id: u32,
    url: String,
    mode: String,
    quality: String,
    audio_format: String,
    folder: Option<String>,
    mute_suffix: Option<String>,
    on_progress: Channel<Progress>,
) -> Result<String, String> {
    let folder = match folder.filter(|f| !f.trim().is_empty()) {
        Some(f) => PathBuf::from(f),
        None => default_folder(&app)?,
    };
    std::fs::create_dir_all(&folder)
        .map_err(|e| format!("boink:folder:{}: {e}", folder.display()))?;

    let mut args: Vec<String> = vec![
        "--no-playlist".into(),
        // Networks with broken IPv6 (address assigned, no route) hang forever on
        // hosts with AAAA records, e.g. YouTube. Every site still serves IPv4.
        "--force-ipv4".into(),
        "--socket-timeout".into(),
        "30".into(),
        // Parallel fragment downloads: no effect on YouTube's single-file streams, but a big
        // speedup on HLS/DASH sites (Twitter, Instagram, TikTok, Twitch...).
        "--concurrent-fragments".into(),
        "4".into(),
        "--newline".into(),
        "--no-simulate".into(),
        "--encoding".into(),
        "utf-8".into(),
        "--color".into(),
        "never".into(),
        "-P".into(),
        folder.to_string_lossy().into_owned(),
        "-o".into(),
        // A distinct name for the muted copy, otherwise yt-dlp sees the regular
        // download as "already downloaded" and strip_audio would mute that file.
        if mode == "mute" {
            // `%` would be read as a template field.
            let suffix = mute_suffix.as_deref().unwrap_or("(sem som)").replace('%', "");
            format!("%(title).150B {suffix}.%(ext)s")
        } else {
            "%(title).150B.%(ext)s".into()
        },
        "--print".into(),
        format!("video:{DEST_TAG}%(filename)s"),
        "--print".into(),
        format!("after_move:{FILE_TAG}%(filepath)s"),
        // --print implies --quiet; --progress brings the progress lines back.
        "--progress".into(),
        "--progress-template".into(),
        format!("download:{PROGRESS_TAG}%(progress._percent_str)s"),
        "--progress-template".into(),
        format!("postprocess:{POST_TAG}%(progress.postprocessor)s"),
    ];
    if let Some(ffmpeg) = sidecar_path("ffmpeg") {
        args.push("--ffmpeg-location".into());
        args.push(ffmpeg.to_string_lossy().into_owned());
    }
    args.extend(format_args(&mode, &quality, &audio_format));
    args.push("--".into());
    args.push(url);

    let (mut rx, child) = app
        .shell()
        .sidecar("yt-dlp")
        .map_err(|e| e.to_string())?
        .args(&args)
        .spawn()
        .map_err(|e| format!("boink:spawn:{e}"))?;
    running.0.lock().unwrap().insert(id, child);

    let existing = file_names(&folder);
    let mut dest: Option<PathBuf> = None;
    let mut file: Option<String> = None;
    let mut last_error: Option<String> = None;
    let mut exit_code: Option<i32> = None;

    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(bytes) => {
                let line = String::from_utf8_lossy(&bytes);
                let line = line.trim();
                if let Some(pct) = line.strip_prefix(PROGRESS_TAG) {
                    let percent = pct.trim().trim_end_matches('%').trim().parse().ok();
                    let _ = on_progress.send(Progress::Downloading { percent });
                } else if line.starts_with(POST_TAG) {
                    let _ = on_progress.send(Progress::Processing);
                } else if let Some(path) = line.strip_prefix(DEST_TAG) {
                    dest = Some(PathBuf::from(path.trim()));
                } else if let Some(path) = line.strip_prefix(FILE_TAG) {
                    file = Some(path.trim().to_string());
                }
            }
            CommandEvent::Stderr(bytes) => {
                let line = String::from_utf8_lossy(&bytes).trim().to_string();
                if let Some(msg) = line.strip_prefix("ERROR:") {
                    last_error = Some(msg.trim().to_string());
                }
            }
            CommandEvent::Error(err) => last_error = Some(err),
            CommandEvent::Terminated(payload) => exit_code = payload.code,
            _ => {}
        }
    }
    // Still registered means nobody cancelled it.
    if running.0.lock().unwrap().remove(&id).is_none() {
        if let Some(dest) = dest {
            remove_partials(&folder, &dest, &existing);
        }
        return Err("boink:cancelled".into());
    }

    if exit_code != Some(0) {
        return Err(last_error
            .unwrap_or_else(|| format!("boink:exit:{}", exit_code.unwrap_or(-1))));
    }
    let file = file.ok_or("boink:no_file")?;

    if mode == "mute" {
        let _ = on_progress.send(Progress::Processing);
        strip_audio(&app, Path::new(&file)).await?;
    }

    Ok(file)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Running::default())
        .invoke_handler(tauri::generate_handler![
            download_media,
            cancel_download,
            default_download_folder,
            open_folder,
            open_file,
            reveal_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
