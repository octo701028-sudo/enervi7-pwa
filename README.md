# Enervi 7 — PWA（上傳即用）

這個資料夾是一個 **100% 前端、可離線安裝的 PWA**。把全部檔案上傳到 GitHub Pages repo 的根目錄（`main`/`/`）即可使用。

## 檔案一覽
- `index.html` — 主頁，含安裝 App 按鈕與 UI。
- `style.css` — 品牌色深紫、按鈕風格。
- `app.js` — 計算邏輯 + 雷達圖（含中文字軸標籤、HiDPI 清晰）。
- `manifest.webmanifest` — PWA 資訊（名稱、色彩、圖示）。
- `sw.js` — Service Worker（版本 `enervi7-cache-v7`）。
- `icon-192.png`, `icon-512.png`, `maskable-512.png` — 安裝圖示。

## 部署（GitHub Pages）
1. 建立/打開你的公開 repo（例如 `enervi7-pwa`）。
2. 把本資料夾所有檔案 **上傳至根目錄** → Commit 到 `main`。
3. Repo → Settings → Pages → Source: `Deploy from a branch`、Branch: `main`、Folder: `/ (root)`。
4. 等 Actions `pages build and deployment` 顯示 **Success**。
5. 造訪 `https://<你的帳號>.github.io/<repo>/`。

> 若你先前開過舊版，請在網址後加 `?purge=v7` 重新整理一次，確保吃到新快取。

## 安裝到手機桌面
- iOS Safari：分享 → 加到主畫面。
- Android Chrome：瀏覽器會出現安裝提示，或從選單加入主畫面。

---
有需要我幫你調整文案、色票或加上 GA/像素碼，都可以再說一聲。
