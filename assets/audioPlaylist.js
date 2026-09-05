const categories = [
  {
    id: "work",
    title: "工作音乐",
    items: [
      {
        id: "work-deep-focus",
        type: "playlist",
        title: "深度工作音乐极简器乐高效",
        tracks: [
          {
            id: "work-deep-focus-1",
            type: "track",
            title: "一",
            artist: "深度工作音乐 · 第一部分",
            src: "./audio/work-deep-focus-1.m4a"
          },
          {
            id: "work-deep-focus-2",
            type: "track",
            title: "二",
            artist: "深度工作音乐 · 第二部分",
            src: "./audio/work-deep-focus-2.m4a"
          }
        ]
      }
    ]
  },
  {
    id: "entertainment",
    title: "娱乐音乐",
    items: [
      {
        id: "entertainment-hires-rock",
        type: "track",
        title: "Hi-Res无损整轨",
        artist: "万能青年旅店 · 二专",
        src: "./audio/entertainment-hires-rock.m4a"
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
const backButton = document.querySelector("#backButton");
const playlistKicker = document.querySelector("#playlistKicker");
const playlistTitle = document.querySelector("#playlistTitle");
const playlistHint = document.querySelector("#playlistHint");

let activeCategoryIndex = 0;
let lastVolume = 1;
let playMode = "sequential";
const categoryStates = categories.map(() => ({
  playlistId: null,
  activeIndex: 0,
  activeTrackId: null
}));

function getActiveCategory() {
  return categories[activeCategoryIndex];
}

function getActiveState() {
  return categoryStates[activeCategoryIndex];
}

function getActivePlaylist() {
  const state = getActiveState();

  if (!state.playlistId) {
    return null;
  }

  return getActiveCategory().items.find(
    (item) => item.type === "playlist" && item.id === state.playlistId
  ) || null;
}

function getActiveItems() {
  const activePlaylist = getActivePlaylist();
  return activePlaylist ? activePlaylist.tracks || [] : getActiveCategory().items;
}

function getActiveTracks() {
  return getActiveItems().filter((item) => item.type === "track");
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

function createItemButton(item, isActive, clickHandler) {
  const button = document.createElement("button");
  const icon = document.createElement("span");
  const copy = document.createElement("span");
  const title = document.createElement("strong");
  const detail = document.createElement("small");

  button.type = "button";
  button.className = `playlist-item${isActive ? " active" : ""}`;
  button.addEventListener("click", clickHandler);

  icon.className = "item-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = item.type === "playlist" ? "☷" : "♫";

  copy.className = "item-copy";
  title.textContent = item.title;
  detail.textContent = item.type === "playlist"
    ? `${item.tracks?.length || 0} 首音频`
    : item.artist || "单曲音频";
  copy.append(title, detail);

  button.append(icon, copy);

  if (item.type === "playlist") {
    const arrow = document.createElement("span");
    arrow.className = "item-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    button.append(arrow);
    button.setAttribute("aria-label", `打开歌单：${item.title}`);
  } else {
    button.setAttribute("aria-current", String(isActive));
  }

  return button;
}

function renderPlaylist() {
  const items = getActiveItems();
  const tracks = getActiveTracks();
  const state = getActiveState();
  const currentPlaylist = getActivePlaylist();

  playlist.replaceChildren();
  categoryTitle.textContent = getActiveCategory().title;
  playlistTitle.textContent = currentPlaylist?.title || getActiveCategory().title;
  playlistKicker.textContent = currentPlaylist ? "歌单内音频" : "内容列表";
  playlistHint.textContent = currentPlaylist ? "歌单" : "单曲和歌单";
  trackCount.textContent = currentPlaylist
    ? `${tracks.length} 首音频`
    : `${items.length} 个内容`;
  backButton.hidden = !currentPlaylist;

  if (items.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "playlist-empty";
    emptyItem.textContent = currentPlaylist ? "歌单暂无音频" : "暂无音频或歌单，请稍后添加";
    playlist.append(emptyItem);
  }

  items.forEach((item) => {
    const itemElement = document.createElement("li");
    const isActive = item.type === "track" && item.id === state.activeTrackId;

    itemElement.append(
      createItemButton(
        item,
        isActive,
        item.type === "playlist"
          ? () => openPlaylist(item.id)
          : () => loadTrack(tracks.findIndex((track) => track.id === item.id), true)
      )
    );
    playlist.append(itemElement);
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

  if (tracks.length === 0) {
    state.activeIndex = 0;
    state.activeTrackId = null;
    playerTitle.textContent = "暂无音频";
    audio.removeAttribute("src");
    audio.load();
    renderPlaylist();
    updateProgress();
    updatePlaybackState();
    setStatus(getActivePlaylist() ? "歌单暂无音频" : "该分类暂无音频或歌单");
    return;
  }

  state.activeIndex = (index + tracks.length) % tracks.length;
  const track = tracks[state.activeIndex];
  state.activeTrackId = track.id;

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

function openPlaylist(playlistId) {
  const selectedPlaylist = getActiveCategory().items.find(
    (item) => item.type === "playlist" && item.id === playlistId
  );

  if (!selectedPlaylist) {
    return;
  }

  const state = getActiveState();
  state.playlistId = playlistId;
  state.activeIndex = 0;
  renderPlaylist();
  setStatus(`已打开歌单“${selectedPlaylist.title}”`);
}

function closePlaylist() {
  const state = getActiveState();

  state.playlistId = null;
  state.activeIndex = 0;
  renderPlaylist();
  setStatus(`已返回${getActiveCategory().title}`);
}

function switchCategory(index) {
  if (index === activeCategoryIndex) {
    return;
  }

  activeCategoryIndex = index;
  const state = getActiveState();
  state.playlistId = null;
  state.activeIndex = 0;
  state.activeTrackId = null;
  audio.pause();
  renderCategories();
  loadTrack(0);
  setStatus(`已切换到${getActiveCategory().title}`);
}

playButton.addEventListener("click", () => {
  if (getActiveTracks().length === 0) {
    setStatus(getActivePlaylist() ? "当前歌单暂无音频" : "当前分类暂无音频");
    return;
  }

  if (audio.paused) {
    audio.play().catch(() => setStatus("播放失败，请再次点击“播放”"));
  } else {
    audio.pause();
  }
});

previousButton.addEventListener("click", () => loadTrack(getActiveState().activeIndex - 1, true));
nextButton.addEventListener("click", () => loadTrack(getActiveState().activeIndex + 1, true));
backButton.addEventListener("click", closePlaylist);

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
  setStatus(`${getActivePlaylist()?.title || getActiveCategory().title}已播放完毕`);
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
