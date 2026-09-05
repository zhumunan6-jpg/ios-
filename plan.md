# 中文多音频播放器 PWA MVP

## 目标

在公开 GitHub 仓库中创建一个完全免费的静态 PWA 音频播放器。播放器保留多音频列表结构，初版只内置一个本地 `BBBBB.wav` 音频，并支持在 iPhone Safari 中播放。

## 实施内容

- 参考并精简 `sitaber/audioplaylist` 的 HTML5 播放器思路，保留 MIT 许可证和版权说明。
- 使用原生 HTML、CSS 和 JavaScript，不使用后端、数据库、第三方 API 或付费服务。
- 播放器界面中文化，包含音频列表、播放/暂停、上一首/下一首、进度、时长、静音和音量控制。
- 音频文件放在 `audio/` 目录，初版只有 `audio/bbbbb.wav`。
- 添加 Web App Manifest 和 Service Worker，支持 GitHub Pages 与首次访问后的离线打开。
- 添加无依赖的 Node.js 本地静态服务器。

## Git 管理

- 默认分支：`main`
- 远程仓库：`https://github.com/zhumunan6-jpg/ios-.git`
- 提交 `chore: initialize repository`
- 提交 `feat: add Chinese multi-audio PWA MVP`

## 验收标准

- 本地服务器能打开播放器。
- 播放按钮能播放完整的 `BBBBB.wav`。
- 多音频列表当前显示一条音频。
- iPhone Safari 通过 GitHub Pages 地址可以播放音频。
- 首次访问后断网，页面和音频仍能从缓存打开。
- 仓库不包含密钥、外部音频链接或付费服务依赖。

## 当前版本边界

- 这是 iPhone Safari PWA，不是 App Store 原生 iOS 应用。
- 初版不提供手机端上传功能。
- `BBBBB.wav` 是五段简单提示音，不是真人语音。
- 仓库为公开仓库，源码和音频文件都会公开。

