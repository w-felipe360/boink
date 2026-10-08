# Third-party notices

boink's own code is MIT licensed (see `LICENSE`). The installer also ships the
programs and assets below, each under its own license. They are separate works,
bundled alongside boink and run as independent processes.

## Bundled programs

### FFmpeg

- Build: `N-127236-g17ec998942-20261007` from [BtbN/FFmpeg-Builds](https://github.com/BtbN/FFmpeg-Builds) (win64, GPL variant)
- License: **GNU General Public License v3.0 or later** (configured with `--enable-gpl --enable-version3`)
- License text: https://www.gnu.org/licenses/gpl-3.0.html
- Source code: https://git.ffmpeg.org/ffmpeg.git (commit `17ec998942`), build scripts at https://github.com/BtbN/FFmpeg-Builds

FFmpeg is a trademark of Fabrice Bellard, originator of the FFmpeg project.
Under the GPL you are entitled to the complete corresponding source code of
this binary. It is available at the links above; if they ever stop working,
open an issue on https://github.com/w-felipe360/boink and a copy will be provided.

### yt-dlp

- Version: `2026.08.19`, official Windows build from [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp/releases)
- License: [The Unlicense](https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE) (public domain)
- The Windows executable bundles a Python runtime and libraries under their own licenses, listed in
  [THIRD_PARTY_LICENSES.txt](https://github.com/yt-dlp/yt-dlp/blob/master/THIRD_PARTY_LICENSES.txt).

## Libraries and assets

| Component | License |
|---|---|
| [Tauri](https://tauri.app) and its plugins | MIT or Apache-2.0 |
| [React](https://react.dev) | MIT |
| [Phosphor Icons](https://phosphoricons.com) | MIT |
| [Geist and Geist Mono](https://vercel.com/font) fonts | SIL Open Font License 1.1 |
| [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif) font | SIL Open Font License 1.1 |
| `public/sounds/boink.mp3` ("Bonk Sound Effect", internet meme) | Not covered by boink's MIT license; rights belong to their respective owners |

Rust and npm dependencies carry their own licenses, recorded in `src-tauri/Cargo.lock` and `package-lock.json`.
