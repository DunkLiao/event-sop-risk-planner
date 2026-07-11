# Repository Guidelines

## 專案結構與模組組織

`src/` 是 React 前端主體：畫面元件放在 `src/components/`，狀態管理放在 `src/store/`，商業邏輯依領域拆至 `src/services/`，共用型別、Hooks 與工具分別位於 `src/types/`、`src/hooks/`、`src/utils/`。Electron 主程序、preload 與 IPC handler 位於 `electron/`。測試集中在 `tests/`，AI 服務另有鄰近原始碼的 `src/services/ai/__tests__/`。靜態資源放在 `public/`，可匯入的活動範本放在 `templates/`；不要手動修改 `build/`、`.ai-test-dist/` 等產出目錄。

## 建置、測試與開發指令

- `npm install`：依 `package-lock.json` 安裝相依套件。
- `npm run dev`：在 `http://localhost:5173` 啟動 Vite 與 Electron 開發流程。
- `npm run type-check`：檢查前端與 Node/Electron TypeScript 設定。
- `npm run lint`：執行 ESLint，且不允許警告通過。
- `npm test`：執行 SQLite 儲存層測試。
- `npm run test:ai`：編譯並執行 AI 服務與提示詞測試。
- `npm run build`：完成 TypeScript、Vite 與 electron-builder 正式建置。

## 程式風格與命名規範

遵循 `.prettierrc`：2 空格縮排、單引號、分號、100 字元行寬與 LF 換行。React 元件與型別使用 `PascalCase`，函式、變數與 Zustand store 使用 `camelCase`，自訂 Hook 以 `use` 開頭。元件目錄依功能命名，例如 `src/components/TemplateManager/`。優先使用 `@services`、`@utils` 等 `vite.config.ts` 別名，避免冗長相對路徑。提交前執行 `npm run format`、lint 與型別檢查。

## 測試準則

測試採 Node.js `node:test` 與 `assert`。檔名使用 `*.test.ts`，並依功能放在 `tests/<domain>/` 或原始碼旁的 `__tests__/`。新增儲存、AI 解析、驗證或提示詞行為時，應涵蓋正常路徑與錯誤案例。涉及 SQLite 的測試必須使用暫存資料，不得依賴個人應用資料。

## Commit 與 Pull Request 準則

目前工作目錄未包含 Git 歷史，無法歸納既有提交格式。建議採簡短祈使句並標明範圍，例如 `feat(ai): validate provider response`。Pull Request 應說明目的、主要變更與驗證指令，連結相關 issue；UI 變更附上截圖，設定或資料格式變更則列出相容性與遷移注意事項。不得提交 API 金鑰、個人資料庫、`node_modules/` 或建置產物。
