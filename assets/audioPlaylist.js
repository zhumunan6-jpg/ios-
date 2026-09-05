import {
  deletePlaylist as deleteStoredPlaylist,
  deleteTrack as deleteStoredTrack,
  getLibrary,
  getTrackBlob,
  initLibrary,
  moveTrack as moveStoredTrack,
  saveImportedTracks
} from "./audioLibraryStore.js";

const categories = [
  { id: "work", title: "工作音乐" },
  { id: "entertainment", title: "娱乐音乐" }
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
const importButton = document.querySelector("#importButton");
const fileInput = document.querySelector("#fileInput");
const libraryModal = document.querySelector("#libraryModal");
const modalTitle = document.querySelector("#modalTitle");
const modalCloseButton = document.querySelector("#modalCloseButton");
const modalFileSummary = document.querySelector("#modalFileSummary");
const modalCategorySelect = document.querySelector("#modalCategorySelect");
const modalDestinationSelect = document.querySelector("#modalDestinationSelect");
const modalDestinationLabel = document.querySelector("#modalDestinationLabel");
const newPlaylistField = document.querySelector("#newPlaylistField");
const newPlaylistName = document.querySelector("#newPlaylistName");
const existingPlaylistField = document.querySelector("#existingPlaylistField");
const existingPlaylistSelect = document.querySelector("#existingPlaylistSelect");
const modalHint = document.querySelector("#modalHint");
const modalCancelButton = document.querySelector("#modalCancelButton");
const modalConfirmButton = document.querySelector("#modalConfirmButton");

let activeCategoryIndex = 0;
let lastVolume = 1;
let playMode = "sequential";
let library = { playlists: [], tracks: [] };
let libraryReady = false;
let currentObjectUrl = null;
let loadRequestId = 0;
let modalMode = null;
let selectedFiles = [];
let movingTrackId = null;
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
  const playlistId = getActiveState().playlistId;
  return playlistId
    ? library.playlists.find((item) => item.id === playlistId) || null
    : null;
}

function getActiveTracks() {
  const activePlaylist = getActivePlaylist();

  return library.tracks
    .filter((track) => {
      if (activePlaylist) {
        return track.playlistId === activePlaylist.id;
      }

      return track.categoryId === getActiveCategory().id && track.playlistId === null;
    })
    .sort((left, right) => (left.order || 0) - (right.order || 0));
}

function getActiveItems() {
  const activePlaylist = getActivePlaylist();
  if (activePlaylist) {
    return getActiveTracks().map((track) => ({ ...track, type: "track" }));
  }

  const directTracks = getActiveTracks().map((track) => ({ ...track, type: "track" }));
  const categoryPlaylists = library.playlists
    .filter((item) => item.categoryId === getActiveCategory().id)
    .map((item) => ({
      ...item,
      type: "playlist",
      tracks: library.tracks.filter((track) => track.playlistId === item.id)
    }));

  return [...directTracks, ...categoryPlaylists].sort(
    (left, right) => (left.order || 0) - (right.order || 0) || (left.createdAt || 0) - (right.createdAt || 0)
  );
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

function getCategoryIndex(categoryId) {
  return categories.findIndex((category) => category.id === categoryId);
}

function getFriendlyError(error) {
  if (error?.name === "QuotaExceededError") {
    return "本机存储空间不足，请删除不需要的音频后重试";
  }

  return error?.message || "操作失败，请稍后重试";
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
    : "本机音频";
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

function createActionButton(label, title, clickHandler, isDanger = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `item-action-button${isDanger ? " danger" : ""}`;
  button.textContent = label;
  button.title = title;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    clickHandler();
  });
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
    emptyItem.textContent = currentPlaylist ? "歌单暂无音频" : "暂无音频或歌单，请点击“本机上传”";
    playlist.append(emptyItem);
  }

  items.forEach((item) => {
    const itemElement = document.createElement("li");
    const row = document.createElement("div");
    const isActive = item.type === "track" && item.id === state.activeTrackId;

    row.className = "playlist-row";
    row.append(
      createItemButton(
        item,
        isActive,
        item.type === "playlist"
          ? () => openPlaylist(item.id)
          : () => loadTrack(tracks.findIndex((track) => track.id === item.id), true)
      )
    );

    const actions = document.createElement("div");
    actions.className = "item-actions";
    if (item.type === "playlist") {
      actions.append(
        createActionButton("删除", "删除歌单并保留其中音频", () => removePlaylist(item), true)
      );
    } else {
      actions.append(
        createActionButton("移动", "移动音频", () => openMoveModal(item)),
        createActionButton("删除", "删除音频", () => removeTrack(item), true)
      );
    }

    row.append(actions);
    itemElement.append(row);
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

function releaseCurrentObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

async function loadTrack(index, shouldPlay = false) {
  const tracks = getActiveTracks();
  const state = getActiveState();

  if (tracks.length === 0) {
    state.activeIndex = 0;
    state.activeTrackId = null;
    playerTitle.textContent = "暂无音频";
    audio.pause();
    releaseCurrentObjectUrl();
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
  const requestId = ++loadRequestId;
  state.activeTrackId = track.id;

  playerTitle.textContent = track.title;
  audio.pause();
  releaseCurrentObjectUrl();
  audio.removeAttribute("src");
  audio.load();
  renderPlaylist();
  updateProgress();
  updatePlaybackState();
  setStatus(shouldPlay ? "正在加载音频…" : "点击“播放”开始");

  try {
    const blob = await getTrackBlob(track.id);
    if (requestId !== loadRequestId) {
      return;
    }

    if (!blob) {
      throw new Error("音频文件不存在");
    }

    currentObjectUrl = URL.createObjectURL(blob);
    audio.src = currentObjectUrl;
    audio.load();

    if (shouldPlay) {
      await audio.play();
    }
  } catch (error) {
    if (requestId === loadRequestId) {
      updatePlaybackState();
      setStatus(`音频无法播放：${getFriendlyError(error)}`);
    }
  }
}

function openPlaylist(playlistId) {
  const selectedPlaylist = library.playlists.find((item) => item.id === playlistId);
  if (!selectedPlaylist) {
    return;
  }

  const state = getActiveState();
  const previousTrackId = state.activeTrackId;
  state.playlistId = playlistId;
  state.activeIndex = 0;
  if (!library.tracks.some((track) => track.id === previousTrackId && track.playlistId === playlistId)) {
    state.activeTrackId = previousTrackId;
  }
  renderPlaylist();
  setStatus(`已打开歌单“${selectedPlaylist.title}”`);
}

function closePlaylist() {
  const state = getActiveState();
  const activeTrack = library.tracks.find((track) => track.id === state.activeTrackId);

  state.playlistId = null;
  state.activeIndex = 0;
  if (activeTrack?.playlistId !== null) {
    state.activeTrackId = null;
    loadTrack(0);
  } else {
    renderPlaylist();
    setStatus(`已返回${getActiveCategory().title}`);
  }
}

function switchCategory(index) {
  if (index === activeCategoryIndex || !libraryReady) {
    return;
  }

  activeCategoryIndex = index;
  const state = getActiveState();
  state.playlistId = null;
  state.activeIndex = 0;
  state.activeTrackId = null;
  audio.pause();
  ++loadRequestId;
  releaseCurrentObjectUrl();
  renderCategories();
  loadTrack(0);
  setStatus(`已切换到${getActiveCategory().title}`);
}

function populateCategorySelect(selectedCategoryId = getActiveCategory().id) {
  modalCategorySelect.replaceChildren();
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.title;
    option.selected = category.id === selectedCategoryId;
    modalCategorySelect.append(option);
  });
}

function populateExistingPlaylists(categoryId) {
  const playlistsForCategory = library.playlists.filter((item) => item.categoryId === categoryId);
  existingPlaylistSelect.replaceChildren();

  if (playlistsForCategory.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "该分类暂无歌单";
    existingPlaylistSelect.append(option);
    existingPlaylistSelect.disabled = true;
    return;
  }

  existingPlaylistSelect.disabled = false;
  playlistsForCategory.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.title;
    existingPlaylistSelect.append(option);
  });
}

function updateModalDestinationFields() {
  const destinationType = modalDestinationSelect.value;
  const categoryId = modalCategorySelect.value;
  const isMove = modalMode === "move";

  newPlaylistField.hidden = isMove || destinationType !== "new-playlist";
  existingPlaylistField.hidden = destinationType !== "playlist";
  if (destinationType === "playlist") {
    populateExistingPlaylists(categoryId);
  }

  modalConfirmButton.disabled = destinationType === "playlist" && existingPlaylistSelect.disabled;
  if (isMove) {
    modalHint.textContent = "音频将移动到所选一级分类或已有歌单，不会复制文件。";
  } else {
    modalHint.textContent = "本次选择的音频会进入同一个目标。";
  }
}

function setModalDestinationOptions(includeNewPlaylist) {
  modalDestinationSelect.replaceChildren();
  const options = [
    ["category", "直接进入一级分类"],
    ...(includeNewPlaylist ? [["new-playlist", "新建二级歌单"]] : []),
    ["playlist", "进入已有二级歌单"]
  ];

  options.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    modalDestinationSelect.append(option);
  });
}

function openImportModal(files) {
  modalMode = "import";
  movingTrackId = null;
  selectedFiles = files;
  modalTitle.textContent = "导入本机音频";
  modalDestinationLabel.textContent = "音频去向";
  modalFileSummary.textContent = `已选择 ${files.length} 个文件`;
  modalConfirmButton.textContent = "确认导入";
  newPlaylistName.value = "";
  populateCategorySelect();
  setModalDestinationOptions(true);
  libraryModal.hidden = false;
  updateModalDestinationFields();
  modalCategorySelect.focus();
}

function openMoveModal(track) {
  modalMode = "move";
  movingTrackId = track.id;
  selectedFiles = [];
  modalTitle.textContent = "移动本机音频";
  modalDestinationLabel.textContent = "移动到";
  modalFileSummary.textContent = `当前音频：${track.title}`;
  modalConfirmButton.textContent = "确认移动";
  newPlaylistName.value = "";
  populateCategorySelect(track.categoryId);
  setModalDestinationOptions(false);
  libraryModal.hidden = false;
  updateModalDestinationFields();
}

function closeModal() {
  libraryModal.hidden = true;
  modalMode = null;
  movingTrackId = null;
  selectedFiles = [];
  modalConfirmButton.disabled = false;
}

function getModalDestination() {
  const type = modalDestinationSelect.value;
  const categoryId = modalCategorySelect.value;

  if (type === "new-playlist") {
    return { type, categoryId, title: newPlaylistName.value };
  }

  if (type === "playlist") {
    return { type, categoryId, playlistId: existingPlaylistSelect.value };
  }

  return { type: "category", categoryId };
}

async function confirmModalAction() {
  modalConfirmButton.disabled = true;

  try {
    const destination = getModalDestination();
    if (modalMode === "import") {
      const result = await saveImportedTracks(selectedFiles, destination);
      closeModal();
      await refreshLibrary();

      const categoryIndex = getCategoryIndex(destination.categoryId);
      activeCategoryIndex = categoryIndex >= 0 ? categoryIndex : 0;
      const state = getActiveState();
      state.playlistId = result.playlist?.id
        || (destination.type === "playlist" ? destination.playlistId : null);
      state.activeTrackId = null;
      state.activeIndex = 0;
      renderCategories();
      await loadTrack(0);

      const messages = [`已导入 ${result.imported} 个音频`];
      if (result.skippedDuplicates) {
        messages.push(`跳过 ${result.skippedDuplicates} 个重复文件`);
      }
      if (result.skippedUnsupported) {
        messages.push(`跳过 ${result.skippedUnsupported} 个不支持的文件`);
      }
      setStatus(messages.join("，"));
      return;
    }

    const movedTrack = await moveStoredTrack(movingTrackId, {
      categoryId: destination.categoryId,
      playlistId: destination.type === "playlist" ? destination.playlistId : null
    });
    const wasActive = getActiveState().activeTrackId === movedTrack.id;
    closeModal();
    if (wasActive) {
      audio.pause();
      ++loadRequestId;
      releaseCurrentObjectUrl();
    }
    await refreshLibrary();
    if (wasActive) {
      getActiveState().activeTrackId = null;
      await loadTrack(0);
    }
    setStatus("音频已移动");
  } catch (error) {
    modalConfirmButton.disabled = false;
    setStatus(getFriendlyError(error));
  }
}

async function removeTrack(track) {
  if (!window.confirm(`确定删除“${track.title}”吗？删除后无法从本机音频库恢复。`)) {
    return;
  }

  const wasActive = getActiveState().activeTrackId === track.id;
  if (wasActive) {
    audio.pause();
    ++loadRequestId;
    releaseCurrentObjectUrl();
  }

  try {
    await deleteStoredTrack(track.id);
    await refreshLibrary();
    if (wasActive) {
      getActiveState().activeTrackId = null;
      await loadTrack(0);
    }
    setStatus("音频已删除");
  } catch (error) {
    setStatus(getFriendlyError(error));
  }
}

async function removePlaylist(selectedPlaylist) {
  if (!window.confirm(`确定删除歌单“${selectedPlaylist.title}”吗？其中音频会保留并移回一级分类。`)) {
    return;
  }

  const activeTrack = library.tracks.find((track) => track.id === getActiveState().activeTrackId);
  const wasAffected = activeTrack?.playlistId === selectedPlaylist.id;
  if (wasAffected) {
    audio.pause();
    ++loadRequestId;
    releaseCurrentObjectUrl();
  }

  try {
    await deleteStoredPlaylist(selectedPlaylist.id);
    if (getActiveState().playlistId === selectedPlaylist.id) {
      getActiveState().playlistId = null;
    }
    await refreshLibrary();
    if (wasAffected) {
      getActiveState().activeTrackId = null;
      await loadTrack(0);
    }
    setStatus("歌单已删除，音频已保留在一级分类");
  } catch (error) {
    setStatus(getFriendlyError(error));
  }
}

async function refreshLibrary() {
  library = await getLibrary();
  categoryStates.forEach((state) => {
    if (state.playlistId && !library.playlists.some((item) => item.id === state.playlistId)) {
      state.playlistId = null;
      state.activeIndex = 0;
    }
    if (state.activeTrackId && !library.tracks.some((item) => item.id === state.activeTrackId)) {
      state.activeTrackId = null;
      state.activeIndex = 0;
    }
  });
  renderCategories();
  renderPlaylist();
}

playButton.addEventListener("click", () => {
  if (!libraryReady) {
    return;
  }

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

importButton.addEventListener("click", () => {
  if (libraryReady) {
    fileInput.click();
  }
});

fileInput.addEventListener("change", () => {
  const files = Array.from(fileInput.files || []);
  fileInput.value = "";
  if (files.length > 0) {
    openImportModal(files);
  }
});

modalCategorySelect.addEventListener("change", updateModalDestinationFields);
modalDestinationSelect.addEventListener("change", updateModalDestinationFields);
modalCloseButton.addEventListener("click", closeModal);
modalCancelButton.addEventListener("click", closeModal);
modalConfirmButton.addEventListener("click", confirmModalAction);
libraryModal.addEventListener("click", (event) => {
  if (event.target === libraryModal) {
    closeModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !libraryModal.hidden) {
    closeModal();
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
  if (audio.src) {
    updatePlaybackState();
    setStatus("当前音频格式无法由 iOS Safari 播放");
  }
});

async function initialize() {
  try {
    await initLibrary();
    await refreshLibrary();
    libraryReady = true;
    audio.volume = 1;
    updatePlayModeButton();
    await loadTrack(0);

    if (library.tracks.length === 0) {
      setStatus("音频库为空，点击“本机上传”开始");
    }
  } catch (error) {
    setStatus(`本机音频库不可用：${getFriendlyError(error)}`);
    importButton.disabled = true;
  }
}

audio.volume = 1;
renderCategories();
updatePlayModeButton();
initialize();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      setStatus("离线缓存暂不可用，但仍可使用已保存的本机音频");
    });
  });
}
