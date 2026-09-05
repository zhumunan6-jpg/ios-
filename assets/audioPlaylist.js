const categories = [
  {
    id: "work",
    title: "工作音乐",
    tracks: [
      {
        id: "work-bbbbb",
        title: "BBBBB 音频",
        src: "./audio/bbbbb.wav"
      },
      {
        id: "work-focus",
        title: "专注提示音",
        src: "./audio/work-focus.wav"
      }
    ]
  },
  {
    id: "entertainment",
    title: "娱乐音乐",
    tracks: [
      {
        id: "entertainment-bbbbb",
        title: "BBBBB 音频",
        src: "./audio/bbbbb.wav"
      },
      {
        id: "entertainment-chill",
        title: "轻松提示音",
        src: "./audio/entertainment-chill.wav"
      }
    ]
  }
];

const audio = document.querySelector("#audioPlayer");
const playButton = document.querySelector("#playButton");
const previousButton = document.querySelector("#previousButton");
const nextButton = document.querySelector("#nextButton");
const playModeButton = document.querySelector("#playModeButton");
const progressRail = document.querySelector("#progressRail");
const volumeRail = document.querySelector("#volumeRail");
const muteButton = document.querySelector("#muteButton");
const currentTime = document.querySelector("#currentTime");
const totalTime = document.querySelector("#totalTime");
const playlist = document.querySelector("#playlist");
const playerTitle = document.querySelector("#player-title");
const statusMessage = document.querySelector("#statusMessage");
const categoryTitle = document.querySelector("#categoryTitle");
const categoryTabs = document.querySelector("#categoryTabs");
const trackCount = document.querySelector("#trackCount");

let activeCategoryIndex = 0;
let lastVolume = 1;
let playMode = "sequential";
const categoryStates = categories.map(() => ({ activeIndex: 0 }));

function getActiveCategory() {
  return categories[activeCategoryIndex];
}

function getActiveTracks() {
  return getActiveCategory().tracks;
}

function getActiveState() {
  return categoryStates[activeCategoryIndex];
}

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

function renderCategories() {
  categoryTabs.replaceChildren();

  categories.forEach((category, index) => {
    const button = document.createElement("button");
    const isActive = index === activeCategoryIndex;

    button.type = "button";
    button.className = `category-tab${isActive ? " active" : ""}`;
    button.textContent = category.title;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(isActive));
    button.setAttribute("aria-controls", "playlist");
    button.addEventListener("click", () => switchCategory(index));
    categoryTabs.append(button);
  });
}

function renderPlaylist() {
  const tracks = getActiveTracks();

  playlist.replaceChildren();
  categoryTitle.textContent = getActiveCategory().title;
  trackCount.textContent = `${tracks.length} 首音频`;

  tracks.forEach((track, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");

    button.type = "button";
    button.className = `playlist-item${index === getActiveState().activeIndex ? " active" : ""}`;
    button.textContent = track.title;
    button.setAttribute("aria-current", index === getActiveState().activeIndex ? "true" : "false");
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

function updatePlayModeButton() {
  const isLooping = playMode === "loop";
  playModeButton.querySelector("span:last-child").textContent = isLooping ? "单曲循环" : "顺序播放";
  playModeButton.querySelector(".mode-icon").textContent = isLooping ? "↻" : "↗";
  playModeButton.setAttribute("aria-pressed", String(isLooping));
  playModeButton.setAttribute(
    "aria-label",
    isLooping ? "当前为单曲循环，点击切换为顺序播放" : "当前为顺序播放，点击切换为单曲循环"
  );
}

function loadTrack(index, shouldPlay = false) {
  const tracks = getActiveTracks();
  const state = getActiveState();

  state.activeIndex = (index + tracks.length) % tracks.length;
  const track = tracks[state.activeIndex];

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

function switchCategory(index) {
  if (index === activeCategoryIndex) {
    return;
  }

  activeCategoryIndex = index;
  audio.pause();
  renderCategories();
  loadTrack(getActiveState().activeIndex);
  setStatus(`已切换到${getActiveCategory().title}`);
}

playButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play().catch(() => setStatus("播放失败，请再次点击“播放”"));
  } else {
    audio.pause();
  }
});

previousButton.addEventListener("click", () => loadTrack(getActiveState().activeIndex - 1, true));
nextButton.addEventListener("click", () => loadTrack(getActiveState().activeIndex + 1, true));

playModeButton.addEventListener("click", () => {
  playMode = playMode === "sequential" ? "loop" : "sequential";
  updatePlayModeButton();
  setStatus(playMode === "loop" ? "已切换为单曲循环" : "已切换为顺序播放");
});

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
  if (playMode === "loop") {
    audio.currentTime = 0;
    audio.play().catch(() => setStatus("循环播放失败，请再次点击“播放”"));
    return;
  }

  const tracks = getActiveTracks();
  const state = getActiveState();

  if (state.activeIndex < tracks.length - 1) {
    loadTrack(state.activeIndex + 1, true);
    return;
  }

  updatePlaybackState();
  updateProgress();
  setStatus(`${getActiveCategory().title}已播放完毕`);
});
audio.addEventListener("error", () => {
  updatePlaybackState();
  setStatus("音频加载失败，请刷新页面重试");
});

audio.volume = 1;
renderCategories();
updatePlayModeButton();
loadTrack(0);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      setStatus("离线缓存暂不可用，但仍可在线播放");
    });
  });
}
