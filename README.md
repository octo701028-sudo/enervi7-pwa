# Enervi 7 — Upload & Go（GitHub Pages 版）
這個壓縮包已套用 **品牌色 / 按鈕風格 / 標語（Align. Awaken. Amplify.）**，
你只需要把所有檔案直接上傳到 GitHub，就能開啟 **GitHub Pages** 使用與安裝（PWA）。

## 檔案與路徑規劃（已就緒）
```
/ (repo 根目錄)
├─ index.html          ← 入口頁
├─ style.css           ← 外觀（已套用品牌色與按鈕風格）
├─ app.js              ← 前端邏輯（雷達圖、儲存、CSV）
├─ manifest.webmanifest← PWA 設定（App 名稱與圖示）
├─ sw.js               ← Service Worker（快取、離線）
├─ icon-192.png        ← App 圖示（192）
├─ icon-512.png        ← App 圖示（512）
└─ maskable-512.png    ← App 圖示（maskable）
```

## 推薦 repo 名稱
`enervi7-pwa`（全小寫、無空格）

## 上傳與發布（GitHub Pages）
1. 新增公開 repo（名稱：`enervi7-pwa`）
2. 上傳本壓縮包「所有檔案」到 **repo 根目錄**
3. 進入 **Settings → Pages → Branch: main（/root） → Save**
4. 網址會是：`https://你的帳號.github.io/enervi7-pwa/`
5. 用手機打開網址即可安裝：
   - iOS（Safari）：分享 → 加到主畫面
   - Android（Chrome）：右上角 ⋮ → 安裝應用程式

## 客製化
- 標語：在 `index.html` 的 header 內修改即可
- 品牌色：在 `style.css` 的 `:root` 變數調整
- 階段文案：在 `app.js` 的 `STAGES` 物件內直接改
