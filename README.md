# 中文多音频播放器 PWA MVP

这是一个完全免费的静态 PWA 音频播放器。初版内置一个 `BBBBB.wav` 音频，播放器保留多音频列表结构。

## 本地运行

```bash
npm run generate-audio
npm start
```

然后打开 `http://localhost:4173`。

## GitHub Pages

将仓库推送到 GitHub 后，在仓库的 **Settings → Pages** 中选择从 `main` 分支的根目录发布。发布后使用 iPhone Safari 打开 GitHub Pages 地址，点击“播放”即可测试。

## 添加音频

将音频文件放入 `audio/`，然后在 `assets/audioPlaylist.js` 的 `tracks` 数组中添加对应记录。

