# 中文多音频播放器 PWA MVP

这是一个完全免费的静态 PWA 音频播放器。当前前端 Demo 分为“工作音乐”和“娱乐音乐”两个独立分类，支持分类内播放列表、顺序播放和单曲循环。项目内置三份本地生成的提示音，用于检查播放流程；以后可以直接替换 `audio/` 文件和曲目配置。

## 本地运行

```bash
npm run generate-audio
npm start
```

然后打开 `http://localhost:4173`。

## GitHub Pages

将仓库推送到 GitHub 后，在仓库的 **Settings → Pages** 中选择从 `main` 分支的根目录发布。发布后使用 iPhone Safari 打开 GitHub Pages 地址，点击“播放”即可测试。

## 添加音频

将音频文件放入 `audio/`，然后在 `assets/audioPlaylist.js` 对应分类的 `tracks` 数组中添加记录。
