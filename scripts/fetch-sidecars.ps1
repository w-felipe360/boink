# Downloads the yt-dlp and ffmpeg executables that boink bundles as Tauri sidecars.
# They're too big for git (ffmpeg alone is ~160 MB), so every clone fetches them once:
#
#   npm run sidecars
#
# yt-dlp is pinned in sidecars.json so every build of a given commit ships the same
# version; the weekly GitHub workflow bumps it. ffmpeg is the latest BtbN GPL build.
#
#   -Force   re-download even if the binaries are already there
#   -Latest  ignore the pin and take the newest yt-dlp (to try one out locally)

param(
  [string]$Dest = (Join-Path $PSScriptRoot "..\src-tauri\bin"),
  [switch]$Force,
  [switch]$Latest
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue" # Invoke-WebRequest is painfully slow with the progress bar on
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Tauri looks for sidecars named <name>-<target triple>.exe
$triple = "x86_64-pc-windows-msvc"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

$pin = (Get-Content (Join-Path $PSScriptRoot "..\sidecars.json") -Raw | ConvertFrom-Json)."yt-dlp"
$ytdlp = Join-Path $Dest "yt-dlp-$triple.exe"
$current = if (Test-Path $ytdlp) { (& $ytdlp --version).Trim() } else { $null }

if ($Latest) {
  Write-Host "Downloading the latest yt-dlp (ignoring the $pin pin)..."
  Invoke-WebRequest "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" -OutFile $ytdlp
} elseif ($Force -or $current -ne $pin) {
  Write-Host "Downloading yt-dlp $pin..."
  Invoke-WebRequest "https://github.com/yt-dlp/yt-dlp/releases/download/$pin/yt-dlp.exe" -OutFile $ytdlp
} else {
  Write-Host "yt-dlp $pin already present"
}

$ffmpeg = Join-Path $Dest "ffmpeg-$triple.exe"
if ($Force -or -not (Test-Path $ffmpeg)) {
  Write-Host "Downloading ffmpeg (BtbN win64 GPL build, ~100 MB)..."
  $tmp = Join-Path ([IO.Path]::GetTempPath()) ("boink-ffmpeg-" + [guid]::NewGuid())
  New-Item -ItemType Directory -Path $tmp | Out-Null
  try {
    $zip = Join-Path $tmp "ffmpeg.zip"
    Invoke-WebRequest "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip" -OutFile $zip
    Expand-Archive $zip -DestinationPath $tmp
    $exe = Get-ChildItem $tmp -Recurse -Filter ffmpeg.exe | Select-Object -First 1
    if (-not $exe) { throw "ffmpeg.exe not found in the downloaded archive" }
    Copy-Item $exe.FullName $ffmpeg -Force
  } finally {
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  }
} else {
  Write-Host "ffmpeg already present (use -Force to update)"
}

& $ytdlp --version | ForEach-Object { Write-Host "yt-dlp $_" }
& $ffmpeg -hide_banner -version | Select-Object -First 1 | ForEach-Object { Write-Host $_ }
Write-Host "Sidecars ready in $Dest"
