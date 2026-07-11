# 活動 SOP 與風險規劃生成器 TODO

## P0 基礎與建置

- [x] 修復 TypeScript 型別錯誤
  - `src/App.tsx` 的結果頁與 Dialog 串接
  - `StorageService` 與 Electron API 型別補齊
  - TemplateManager / TemplatePickerDialog 的 MUI 9 props 修正
  - `importService.ts` 的型別守門與轉換修正
  - `npm run type-check` 通過

- [x] 修復 ESLint 設定到 ESLint 10 flat config
  - 使用 `eslint.config.js`
  - 加入 TypeScript、React、React Hooks 規則
  - `npm run lint` 通過

- [x] 修復 SQLite 測試環境
  - `better-sqlite3` 重新編譯並可在目前 Node ABI 執行
  - `npm test` 通過

- [x] 修復正式建置
  - Electron / Vite / electron-builder 正常輸出
  - `npm run build` 通過

## Phase 2 結果預覽與編輯介面

- [x] 建立獨立 SOP 結果編輯工作區
  - 支援章節、任務、時程與檢查清單編輯
  - 支援新增、刪除、上移、下移與欄位即時修改

- [x] 建立獨立風險評估結果編輯工作區
  - 支援風險項目新增、刪除、上移、下移
  - 支援風險狀態、應對方式、資源、備案與時程編輯
  - 重新計算風險分數、等級與摘要

- [x] 結果頁支援重新生成、手動儲存與自動儲存
  - 重新生成前會要求確認
  - 3 秒無操作自動儲存
  - 支援返回活動資料頁

- [x] 結果頁支援 Word / Excel 匯出
  - Word SOP 匯出
  - Excel 風險評估匯出

## Phase 3 AI 介接

- [x] Electron AI IPC handlers
- [x] UI 端 AI 服務整合
- [x] AI 生成與提示詞測試

## Phase 4 文件匯出

- [x] Word SOP 文件生成
- [x] Excel 風險評估匯出
- [x] Word / Excel IPC handlers

## 後續

- [ ] 鋪上更完整的 AI 流式輸出體驗
- [ ] 補齊 API Key 管理與錯誤提示流程
- [ ] 補做 Windows / macOS / Linux 實機 UAT
- [ ] 補強 README 的部署與發行說明
