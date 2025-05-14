# 專案階層說明：

```!
Catasy-novel/
├── docs/                       # VitePress 的文檔根目錄
│   ├── .vitepress/             # VitePress 設定目錄
│   │   ├── config.mjs          # VitePress 主設定檔
│   │   └── theme/              # 自訂主題相關 (例如 custom.css)
│   │       └── custom.css      # 自訂 CSS 樣式
│   │       └── index.js        # 自訂主題入口
│   ├── novels/                 # 存放所有小說的目錄
│   │   ├── [novelIdA]/         # 小說 A 的目錄 (例如 a, my-first-novel)
│   │   │   ├── index.md        # 小說 A 的簡介頁
│   │   │   ├── Ch-1.md         # 小說 A 的第一章
│   │   │   ├── Ch-2.md         # 小說 A 的第二章
│   │   │   └── ...
│   │   └── [novelIdB]/         # 小說 B 的目錄
│   │       ├── index.md
│   │       └── ...
│   ├── public/                 # 靜態資源目錄 (圖片等)
│   │   └── images/
│   │       ├── a.jpg
│   │       └── ...
│   ├── index.md                # 網站首頁 (顯示所有小說列表)
│   └── novels.data.mjs         # 首頁動態小說列表的資料載入器
├── scripts/                    # 存放所有 Node.js 管理腳本的目錄
│   ├── create-novel.mjs        # 新建小說
│   ├── create-chapter.mjs      # 新建章節
│   ├── publish-chapters.mjs    # 發布/撤回章節
│   ├── update-novel-status.mjs # 更新小說狀態
│   ├── sync-novels-meta.mjs    # 同步所有小說（批量處理）
│   └── manage-deletion.mjs     # 刪除小說、章節
├── node_modules/               # npm 安裝的依賴
├── novel-cli.mjs               # CLI 主入口腳本
├── package.json
├── package-lock.json
└── README.md
```

### 啟動專案指令

```
// 安裝依賴
npm install

// 啟動 VitePress 開發伺服器
npm run docs:dev

// 建置 VitePress 網站
npm run docs:build

// 預覽建置後的網站
npm run docs:preview
```

### 自動化腳本指令

```
// 啟動互動式選單
novel-cli

// 查看所有可用操作
novel-cli --h
```

### 環境設定

1.  確保已安裝 [Node.js](https://nodejs.org/) (建議使用 v18 或更高版本，目前專案測試基於 v22.x.x)。
2.  (推薦) 安裝並使用 [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) 來管理 Node.js 版本。
    - 安裝 nvm 後，可以執行 `nvm install --lts` 或 `nvm install <version>` (例如 `nvm install 20`)。
    - 然後執行 `nvm use <version>`。
    - (可選) 在專案根目錄下創建 `.nvmrc` 檔案並寫入 Node.js 版本號，之後進入專案目錄執行 `nvm use` 即可自動切換。
3.  Clone 本專案。
4.  進入專案根目錄，執行 `npm install` 安裝所有依賴。
