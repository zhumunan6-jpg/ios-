const tracks = [
  {
    id: "bbbbb",
    title: "BBBBB 音频",
    src: "./audio/bbbbb.wav"
  }
];

const audio = document.querySelector("#audioPlayer");
const playButton = document.querySelector("#playButton");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const progressRail = document.querySelector("#progressRail");
const volumeRail = document.querySelector("#volumeRail");
const muteButton = document.querySelector("#muteButton");
const currentTime = document.querySelector("#currentTime");
const totalTime = document.querySelector("#totalTime");
const playlist = document.querySelector("#playlist");
const playerTitle = document.querySelector("#player-title");
const statusMessage = document.querySelector("#statusMessage");

let activeIndex = 0;
let lastVolume = 1;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function renderPlaylist() {
  playlist.replaceChildren();

  tracks.forEach((track, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.className = `playlist-item${index === activeIndex ? " active" : ""}`;
    button.textContent = track.title;
    button.setAttribute("aria-current", index === activeIndex ? "true" : "false");
    button.addEventListener("click", () => loadTrack(index, true));

    item.append(button);
    playlist.append(item);
  });

  previousButton.disabled = tracks.length < 2;
  nextButton.disabled = tracks.length < 2;
}

function updateProgress() {
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
  progressRail.max = String(duration);
  progressRail.value = String(Math.min(audio.currentTime || 0, duration));
  currentTime.textContent = formatTime(audio.currentTime);
  totalTime.textContent = formatTime(duration);
}

function updatePlaybackState() {
  const isPlaying = !audio.paused;
  playButton.textContent = isPlaying ? "暂停" : "播放";
  playButton.setAttribute("aria-pressed", String(isPlaying));
}

function loadTrack(index, shouldPlay = false) {
  activeIndex = (index + tracks.length) % tracks.length;
  const track = tracks[activeIndex];

  playerTitle.textContent = track.title;
  audio.src = new URL(track.src, document.baseURI).href;
  audio.load();
  renderPlaylist();
  updateProgress();
  updatePlaybackState();
  setStatus(shouldPlay ? "正在加载音频…" : "点击“播放”开始");

  if (shouldPlay) {
    audio.play().catch(() => {
      updatePlaybackState();
      setStatus("播放被阻止，请再次点击“播放”");
    });
  }
}

playButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().catch(() => setStatus("播放失败，请再次点击“播放”"));
  } else {
    audio.pause();
  }
});

previousButton.addEventListener("click", () => loadTrack(activeIndex - 1, true));
nextButton.addEventListener("click", () => loadTrack(activeIndex + 1, true));

progressRail.addEventListener("input", () => {
  if (Number.isFinite(audio.duration)) {
    audio.currentTime = Number(progressRail.value);
  }
});

volumeRail.addEventListener("input", () => {
  const volume = Number(volumeRail.value);
  audio.volume = volume;
  if (volume > 0) {
    lastVolume = volume;
    muteButton.textContent = "静音";
    muteButton.setAttribute("aria-pressed", "false");
  }
});

muteButton.addEventListener("click", () => {
  if (audio.volume > 0) {
    lastVolume = audio.volume;
    audio.volume = 0;
    volumeRail.value = "0";
    muteButton.textContent = "取消静音";
    muteButton.setAttribute("aria-pressed", "true");
  } else {
    audio.volume = lastVolume || 1;
    volumeRail.value = String(audio.volume);
    muteButton.textContent = "静音";
    muteButton.setAttribute("aria-pressed", "false");
  }
});

audio.addEventListener("loadedmetadata", updateProgress);
audio.addEventListener("durationchange", updateProgress);
audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("play", () => {
  updatePlaybackState();
  setStatus("正在播放");
});
audio.addEventListener("pause", () => {
  updatePlaybackState();
  if (audio.currentTime < audio.duration) {
    setStatus("已暂停");
  }
});
audio.addEventListener("ended", () => {
  updatePlaybackState();
  updateProgress();
  setStatus("播放结束");
});
audio.addEventListener("error", () => {
  updatePlaybackState();
  setStatus("音频加载失败，请刷新页面重试");
});

audio.volume = 1;
loadTrack(0);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      setStatus("离线缓存暂不可用，但仍可在线播放");
    });
  });
}

