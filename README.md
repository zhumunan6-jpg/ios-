# 中文多音频播放器 PWA MVP

这是一个完全免费的静态 PWA 音频播放器。前端固定保留“工作音乐”和“娱乐音乐”两个一级分类，每个分类可以混合放置单首音频和歌单。点击歌单后进入歌单内部的音频列表，支持分类或歌单内的播放、顺序播放和单曲循环。音频文件放在 `audio/` 目录，内容结构直接在 `assets/audioPlaylist.js` 中维护。

## 本地运行

```bash
npm run generate-audio
npm start
```

然后打开 `http://localhost:4173`。

## GitHub Pages

将仓库推送到 GitHub 后，在仓库的 **Settings → Pages** 中选择从 `main` 分支的根目录发布。发布后使用 iPhone Safari 打开 GitHub Pages 地址，点击“播放”即可测试。

## 添加音频

播放器适配 `.m4a` 音频，当前推荐使用 AAC 编码的 M4A 文件（例如 AAC-LC、44.1 kHz、双声道）。将音频文件放入 `audio/`，然后在 `assets/audioPlaylist.js` 对应分类的 `items` 数组中登记。单首音频使用 `type: "track"`，歌单使用 `type: "playlist"`，歌单内部的 `tracks` 数组继续登记单首音频，例如：

```js
{
  id: "focus-track",
  type: "track",
  title: "专注音乐",
  artist: "工作音乐",
  src: "./audio/focus-track.wav"
},
{
  id: "morning-playlist",
  type: "playlist",
  title: "晨间歌单",
  tracks: [
    {
      id: "morning-01",
      type: "track",
      title: "晨间第一首",
      src: "./audio/morning-01.wav"
    }
  ]
}
```
