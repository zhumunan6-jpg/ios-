# Repository Guidelines

## Session Start & Progress Tracking

Before starting any new task or conversation, read `PROGRESS.md` to recover the current project state. Keep that file concise and update it after meaningful changes, tests, deployments, or blockers. Treat it as the project status source of truth, not as a replacement for detailed design documents.

## Project Structure & Module Organization

This repository is a dependency-free static PWA audio player.

- `index.html` contains the Chinese player shell and accessible controls.
- `assets/audioPlaylist.js` contains the track catalog and playback logic.
- `assets/audioPlayer.css` contains responsive layout and component styles.
- `audio/` stores bundled audio files, currently `audio/bbbbb.wav`.
- `icons/` stores PWA artwork.
- `manifest.webmanifest` and `service-worker.js` provide install metadata and offline caching.
- `scripts/` contains reproducible asset-generation scripts.
- `server.mjs` serves the project locally without external packages.
- `plan.md`, `PROGRESS.md`, `README.md`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` document scope, status, usage, and licensing.

There is currently no automated test directory or build output directory.

## Build, Test, and Development Commands

Run these commands from the repository root:

```bash
npm run generate-audio  # Regenerate the bundled BBBBB WAV file
npm start               # Start the local server at http://localhost:4173
```

Use a local HTTP server rather than opening `index.html` directly; Service Workers require an HTTP(S) origin. GitHub Pages publishes the static root directly, with no build step.

## Coding Style & Naming Conventions

Use two-space indentation for HTML, CSS, and JavaScript. Use semicolons, double-quoted JavaScript strings, and `camelCase` for variables and functions. Use descriptive kebab-free filenames for JavaScript modules and lowercase kebab-case for generated assets. Keep UI text in Simplified Chinese. Avoid external libraries, remote audio URLs, inline secrets, and unnecessary visual complexity.

## Testing Guidelines

There is no test framework or coverage requirement. Before committing, run `node --check` on changed JavaScript files, run the local server, verify HTTP 200 responses for the page, manifest, Service Worker, and audio file, then manually test play, pause, seeking, volume, and the single playlist item in a desktop browser and iPhone Safari.

## Commit & Pull Request Guidelines

Use short Conventional Commit-style messages, such as `chore: initialize repository` and `feat: add Chinese multi-audio PWA MVP`. Keep each commit focused. Pull requests should describe the behavior change, list verification commands, mention GitHub Pages impact, and include a mobile screenshot when UI behavior changes. Preserve the upstream MIT license and update `THIRD_PARTY_NOTICES.md` when adapting external code.
