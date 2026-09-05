const DATABASE_NAME = "chinese-audio-player-library";
const DATABASE_VERSION = 1;
const PLAYLIST_STORE = "playlists";
const TRACK_STORE = "tracks";

let databasePromise;

function createId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function openDatabase() {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = () => reject(request.error || new Error("本地音频库打开失败"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(PLAYLIST_STORE)) {
        const playlistStore = database.createObjectStore(PLAYLIST_STORE, { keyPath: "id" });
        playlistStore.createIndex("categoryId", "categoryId", { unique: false });
      }

      if (!database.objectStoreNames.contains(TRACK_STORE)) {
        const trackStore = database.createObjectStore(TRACK_STORE, { keyPath: "id" });
        trackStore.createIndex("categoryId", "categoryId", { unique: false });
        trackStore.createIndex("playlistId", "playlistId", { unique: false });
        trackStore.createIndex("duplicateKey", "duplicateKey", { unique: false });
      }
    };
  });

  return databasePromise;
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("本地音频库读取失败"));
  });
}

function transactionComplete(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("本地音频库写入失败"));
    transaction.onabort = () => reject(transaction.error || new Error("本地音频库写入已取消"));
  });
}

function sortByOrder(left, right) {
  return (left.order || 0) - (right.order || 0);
}

function getDuplicateKey(file) {
  return [file.name, file.size, file.type || "", file.lastModified || 0].join("|");
}

function isAudioFile(file) {
  return /\.(aac|m4a|mp3|wav)$/i.test(file.name || "")
    || ["audio/aac", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav"].includes(file.type);
}

async function getAllFromStore(storeName) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readonly");
  return requestResult(transaction.objectStore(storeName).getAll());
}

export async function initLibrary() {
  const database = await openDatabase();

  if (navigator.storage?.persist) {
    try {
      await navigator.storage.persist();
    } catch {
      // Persistent storage is a best-effort browser permission.
    }
  }

  return database;
}

export async function getLibrary() {
  await initLibrary();
  const [playlists, tracks] = await Promise.all([
    getAllFromStore(PLAYLIST_STORE),
    getAllFromStore(TRACK_STORE)
  ]);

  return {
    playlists: playlists.sort(sortByOrder),
    tracks: tracks.sort(sortByOrder)
  };
}

export async function getStorageEstimate() {
  if (!navigator.storage?.estimate) {
    return null;
  }

  return navigator.storage.estimate();
}

export async function getTrackBlob(trackId) {
  await initLibrary();
  const database = await openDatabase();
  const transaction = database.transaction(TRACK_STORE, "readonly");
  const track = await requestResult(transaction.objectStore(TRACK_STORE).get(trackId));
  return track?.blob || null;
}

export async function createPlaylist(categoryId, title) {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error("歌单名称不能为空");
  }

  const library = await getLibrary();
  if (library.playlists.some((playlist) => playlist.categoryId === categoryId && playlist.title === normalizedTitle)) {
    throw new Error("该分类下已经存在同名歌单");
  }

  const categoryPlaylists = library.playlists.filter((playlist) => playlist.categoryId === categoryId);
  const playlist = {
    id: createId("playlist"),
    categoryId,
    title: normalizedTitle,
    order: categoryPlaylists.length,
    createdAt: Date.now()
  };

  const database = await openDatabase();
  const transaction = database.transaction(PLAYLIST_STORE, "readwrite");
  transaction.objectStore(PLAYLIST_STORE).put(playlist);
  await transactionComplete(transaction);
  return playlist;
}

export async function saveImportedTracks(files, destination) {
  await initLibrary();
  const library = await getLibrary();
  const existingKeys = new Set(library.tracks.map((track) => track.duplicateKey));
  const importedFiles = [];
  let skippedDuplicates = 0;
  let skippedUnsupported = 0;

  for (const file of files) {
    if (!isAudioFile(file)) {
      skippedUnsupported += 1;
      continue;
    }

    const duplicateKey = getDuplicateKey(file);
    if (existingKeys.has(duplicateKey)) {
      skippedDuplicates += 1;
      continue;
    }

    existingKeys.add(duplicateKey);
    importedFiles.push({ file, duplicateKey });
  }

  if (importedFiles.length === 0) {
    return { imported: 0, skippedDuplicates, skippedUnsupported, playlist: null };
  }

  let playlist = null;
  if (destination.type === "new-playlist") {
    const normalizedTitle = destination.title.trim();
    if (!normalizedTitle) {
      throw new Error("歌单名称不能为空");
    }

    if (library.playlists.some(
      (item) => item.categoryId === destination.categoryId && item.title === normalizedTitle
    )) {
      throw new Error("该分类下已经存在同名歌单");
    }

    playlist = {
      id: createId("playlist"),
      categoryId: destination.categoryId,
      title: normalizedTitle,
      order: library.playlists.filter((item) => item.categoryId === destination.categoryId).length,
      createdAt: Date.now()
    };
  } else if (destination.type === "playlist") {
    playlist = library.playlists.find((item) => item.id === destination.playlistId) || null;
    if (!playlist || playlist.categoryId !== destination.categoryId) {
      throw new Error("目标歌单不存在");
    }
  }

  const categoryId = destination.categoryId;
  const playlistId = playlist?.id || null;
  const targetTracks = library.tracks.filter(
    (track) => track.categoryId === categoryId && track.playlistId === playlistId
  );
  const database = await openDatabase();
  const transaction = database.transaction([PLAYLIST_STORE, TRACK_STORE], "readwrite");

  if (destination.type === "new-playlist") {
    transaction.objectStore(PLAYLIST_STORE).put(playlist);
  }

  importedFiles.forEach(({ file, duplicateKey }, index) => {
    transaction.objectStore(TRACK_STORE).put({
      id: createId("track"),
      categoryId,
      playlistId,
      title: file.name,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      lastModified: file.lastModified || 0,
      duplicateKey,
      blob: file,
      order: targetTracks.length + index,
      createdAt: Date.now()
    });
  });

  await transactionComplete(transaction);
  return { imported: importedFiles.length, skippedDuplicates, skippedUnsupported, playlist };
}

export async function moveTrack(trackId, destination) {
  const library = await getLibrary();
  const track = library.tracks.find((item) => item.id === trackId);

  if (!track) {
    throw new Error("音频不存在");
  }

  let playlistId = null;
  if (destination.playlistId) {
    const playlist = library.playlists.find((item) => item.id === destination.playlistId);
    if (!playlist || playlist.categoryId !== destination.categoryId) {
      throw new Error("目标歌单不存在");
    }
    playlistId = playlist.id;
  }

  const targetTracks = library.tracks.filter(
    (item) => item.id !== trackId && item.categoryId === destination.categoryId && item.playlistId === playlistId
  );
  const updatedTrack = {
    ...track,
    categoryId: destination.categoryId,
    playlistId,
    order: targetTracks.length
  };
  const database = await openDatabase();
  const transaction = database.transaction(TRACK_STORE, "readwrite");
  transaction.objectStore(TRACK_STORE).put(updatedTrack);
  await transactionComplete(transaction);
  return updatedTrack;
}

export async function deleteTrack(trackId) {
  await initLibrary();
  const database = await openDatabase();
  const transaction = database.transaction(TRACK_STORE, "readwrite");
  transaction.objectStore(TRACK_STORE).delete(trackId);
  await transactionComplete(transaction);
}

export async function deletePlaylist(playlistId) {
  const library = await getLibrary();
  const playlist = library.playlists.find((item) => item.id === playlistId);

  if (!playlist) {
    throw new Error("歌单不存在");
  }

  const database = await openDatabase();
  const transaction = database.transaction([PLAYLIST_STORE, TRACK_STORE], "readwrite");
  const trackStore = transaction.objectStore(TRACK_STORE);

  library.tracks
    .filter((track) => track.playlistId === playlistId)
    .forEach((track, index) => {
      trackStore.put({
        ...track,
        playlistId: null,
        order: library.tracks.filter(
          (item) => item.categoryId === playlist.categoryId && item.playlistId === null
        ).length + index
      });
    });

  transaction.objectStore(PLAYLIST_STORE).delete(playlistId);
  await transactionComplete(transaction);
}
