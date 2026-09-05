# Progress

Updated: 2026-09-05

## Done

- Git initialized on `main`; `origin` points to `zhumunan6-jpg/ios-`.
- Project history includes the repository initialization, PWA MVP, playlist navigation, and AAC library milestones.
- Static PWA player created; multi-audio list retained, one local track active.
- Repository now contains three user-provided AAC-in-M4A audio resources, including two split work BGM segments.
- Added Chinese UI, playback controls, Manifest, Service Worker, offline cache, Node server.
- Local syntax, HTTP resource, manifest, and WAV checks passed.
- GitHub repository contains the MVP.
- Added independent 工作音乐 and 娱乐音乐 category tabs for the frontend demo.
- Added category-scoped sequential playback and single-track loop mode toggle.
- Refreshed the player UI with category state, track count, and clearer mode styling.
- Bumped the Service Worker cache version so installed PWA users receive the new frontend.
- Reviewed the external BiliFlow v0.6.0 release: source and packaging showed no obvious malicious behavior; the Windows full ZIP hash matched GitHub and Windows Defender found no threats. Release binaries are unsigned, so provenance still requires hash verification.
- Removed the outdated `plan.md` document.
- Added mixed category content with direct tracks and nested playlists.
- Added playlist navigation, back-to-category control, content type styling, and nested playback state.
- Updated the README with the repository-managed playlist configuration format.
- Bumped the Service Worker cache version for the playlist UI.
- Added local server MIME support for AAC-in-M4A audio files.
- Confirmed the provided M4A sample uses AAC-LC, 44.1 kHz, stereo encoding.
- Added the provided work and entertainment M4A tracks to the corresponding categories.
- Added both bundled audio files to the Service Worker app shell cache.
- Split the oversized work BGM at its midpoint into two original-quality M4A segments.
- Converted the work music entry into the `深度工作音乐极简器乐高效` playlist with ordered items `一` and `二`.
- Replaced the static bundled audio catalog with a local IndexedDB audio library.
- Added iPhone Files app import with fixed first-level categories, new/existing playlist selection, duplicate detection, and unsupported-format feedback.
- Added local track move/delete controls and playlist deletion that preserves its tracks in the first-level category.
- Removed the three bundled M4A files and obsolete audio generator from the repository.
- Updated the Service Worker to cache only the app shell and updated the README and repository guidelines for local audio storage.
- Committed the local audio library as `a4573fd feat: add local audio library` on `codex/local-audio-library` and pushed the branch to `origin`.
- Confirmed the working tree is clean and the local branch tracks `origin/codex/local-audio-library`.
- Changed the iPhone file picker to `accept="*/*"` and expanded M4A MIME validation so Apple MPEG-4 audio files can be selected before app-side checking.
- Fast-forward merged `codex/local-audio-library` into `main` and pushed `main` to `origin` at `d877c8f`.
- Deleted the merged `codex/local-audio-library` branch locally and from `origin`; `main` is now the active release branch.

## Pending

- Configure GitHub Pages to publish `main` from the repository root.
- Test local import, playback, persistence, and offline reopening on iPhone Safari after the file-picker filter change.
- Future: add more tracks.
- Future: add local library export/import backup if needed.

## Run

```bash
npm start
```

Pages URL: `https://zhumunan6-jpg.github.io/ios-/`
