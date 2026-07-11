# 活動 SOP 與風險規劃生成器待辦清單

本清單依目前 `plan.md` 與程式碼實際狀態整理。優先完成 P0 品質關卡，再依 Phase 推進功能；每個項目只有在驗收條件全部通過後才能勾選。

## P0：恢復可開發、可測試、可建置狀態

- [ ] 修復 TypeScript 型別錯誤
  - 移除或接回 `src/App.tsx` 未使用的範本 Dialog 與狀態。
  - 補齊範本功能需要的 `StorageService` 方法與型別。
  - 修正 TemplateManager、TemplatePickerDialog 的 MUI 9 props 型別。
  - 修正 `importService.ts` 的不安全型別轉換。
  - 驗收：`npm run type-check` 成功且無錯誤。
- [ ] 遷移 ESLint 設定至 ESLint 10 flat config
  - 建立可被 ESLint 10 載入的 `eslint.config.js` 或 `eslint.config.mjs`。
  - 保留 TypeScript、React、React Hooks 與零警告要求。
  - 驗收：`npm run lint` 成功且無警告。
- [ ] 修復 SQLite 測試執行方式
  - 解決測試引用 `src/services/storage/database.js` 但原始檔為 TypeScript 的問題。
  - 確保測試使用暫存資料庫，不讀寫個人應用資料。
  - 驗收：`npm test` 全部通過。
- [ ] 恢復完整建置流程
  - 確認 TypeScript、Vite 與 Electron 輸出路徑一致。
  - 補齊 electron-builder 所需的 Windows、macOS、Linux icon 資源或調整設定。
  - 驗收：`npm run build` 成功產生可安裝產物。

## Phase 2：完成結果預覽與編輯介面

- [ ] 建立 SOP 結果預覽與編輯器
  - 顯示章節、任務、時程、檢查清單與責任分工。
  - 允許使用者修改 AI 生成內容並回存目前專案。
  - 驗收：重新載入專案後仍保留修改內容。
- [ ] 建立風險評估結果預覽與編輯器
  - 顯示風險清單、可能性、影響、等級、應對策略與負責人。
  - 允許編輯並即時重新計算風險等級與摘要。
  - 驗收：編輯後資料可儲存並正確載入。
- [ ] 建立生成與匯出操作區
  - 提供生成 SOP、生成風險評估、重新生成、匯出 Word 與匯出 Excel 操作。
  - 清楚呈現處理中、成功、失敗及可重試狀態。
  - 驗收：所有按鈕皆連接實際 service，不使用模擬延遲或空 handler。
- [ ] 完成響應式與可用性調整
  - 確認多步驟表單、結果編輯器與專案管理在窄螢幕不產生不可操作的水平溢位。
  - 驗收：桌面與小尺寸視窗的主要工作流程皆可完成。

## Phase 3：接通 AI 端到端生成流程

- [ ] 在 Electron 主程序註冊 AI IPC handlers
  - 實作並註冊 `generate-sop` 與 `generate-risk-assessment`。
  - 驗證 IPC 輸入資料，回傳可識別的錯誤代碼與訊息。
  - 驗收：preload 公開的 AI 方法都有主程序對應 handler。
- [ ] 將 UI 接到 AIManager
  - 從活動表單建立 SOP／風險請求，依設定選擇 OpenAI 或 Claude。
  - 將解析與驗證後的結果寫入 Zustand store 及目前專案。
  - 驗收：使用有效 API Key 可從表單完成生成並看到結果。
- [ ] 完成 API Key 管理流程
  - 驗證金鑰、加密保存、遮罩顯示與刪除功能。
  - 確保敏感資訊不出現在 renderer state、日誌及錯誤訊息。
  - 驗收：重新啟動應用程式後可安全使用已保存金鑰。
- [ ] 實作 streaming 生成進度
  - 顯示生成階段、已接收內容與合理的進度狀態。
  - 驗收：長時間請求期間 UI 保持可操作且持續更新狀態。
- [ ] 實作取消與重試
  - 使用可中止請求，避免取消後結果覆蓋目前專案。
  - 保留既有 rate limit、網路錯誤及暫時性錯誤重試策略。
  - 驗收：取消後不寫入結果；可重試錯誤能依設定重試。
- [ ] 實作 token 與成本控制
  - 顯示 token 使用量與估算成本，允許設定單次或專案預算警告。
  - 驗收：超過門檻前提示使用者，且不記錄 API Key。
- [ ] 修復並擴充 AI 測試
  - 涵蓋雙供應商、快取、重試、取消、解析錯誤與無效回應。
  - 驗收：`npm run test:ai` 全部通過。

## Phase 4：實作文件生成與匯出

- [ ] 使用 `docx` 實作 Word SOP 文件
  - 包含封面／標題、SOP 章節、任務、時程表、責任分工與檢查清單。
  - 支援基本品牌資訊、字型、色彩及頁首頁尾設定。
  - 驗收：輸出檔可在 Microsoft Word 2016+ 開啟及編輯。
- [ ] 補齊 Word 流程呈現
  - 將 SOP 步驟以 Office 相容的流程圖或清楚的流程表呈現。
  - 驗收：無需外部圖片或網路資源即可正確顯示。
- [ ] 使用 `exceljs` 實作 Excel 風險矩陣
  - 建立風險清單、評分、等級、應對措施、負責人與追蹤狀態欄位。
  - 建立可能性 × 影響矩陣與風險等級視覺格式。
  - 驗收：輸出檔可在 Microsoft Excel 2016+ 開啟、編輯及重新計算。
- [ ] 實作 Word／Excel IPC 與儲存對話框
  - 註冊 `export-word`、`export-excel` handlers，驗證路徑與輸出資料。
  - 正確處理取消、覆寫、權限不足與寫入失敗。
  - 驗收：使用者可從結果畫面選擇路徑並成功匯出。
- [ ] 支援自訂文件範本與品牌化
  - 定義可持久化的範本設定與預覽方式。
  - 在 `templates/sop-templates/`、`templates/risk-templates/` 提供可用預設範本。
  - 驗收：切換範本後匯出文件的樣式與內容配置會改變。
- [ ] 將大型文件生成移至背景工作
  - 避免文件產生期間阻塞 renderer 或 Electron 主執行緒。
  - 驗收：大型專案匯出期間視窗仍可回應。

## Phase 5：完成資料持久化、範本與匯入

- [ ] 補齊範本 StorageService API
  - 實作 `createTemplateFromProject`、`setDefaultTemplate`、`createProjectFromTemplate` 與 `generateTemplateShareCode`。
  - 驗收：範本相關元件不再有型別錯誤，操作結果可持久化。
- [ ] 接回範本 Dialog
  - 在 `App.tsx` 實際渲染 TemplatePickerDialog 與 SaveProjectAsTemplateDialog。
  - 驗收：可從表單套用範本，也可將現有專案儲存為範本。
- [ ] 完成 JSON 匯入 UI
  - 提供檔案選擇、格式檢查、版本檢查、衝突處理與匯入摘要。
  - 驗收：專案與範本匯入後可立即在列表中使用。
- [ ] 完成 JSON 匯出選項
  - 支援單筆／多筆專案、單筆／多筆範本及設定匯出。
  - API Key 預設不得包含在匯出檔；若允許包含，必須明確警告並取得確認。
  - 驗收：匯出檔可由同版本應用程式重新匯入。
- [ ] 補強資料遷移與損毀處理
  - 為資料庫 schema 與 JSON 格式建立版本遷移策略。
  - 驗收：舊版本資料可升級；無效資料不會破壞既有資料庫。

## Phase 6：優化、測試與 UAT

- [ ] 補齊單元測試
  - 涵蓋 storage、匯入匯出、驗證器、AI 解析與文件資料轉換的正常及錯誤案例。
  - 驗收：所有測試使用隔離暫存資料且可重複執行。
- [ ] 建立整合測試
  - 測試 renderer → preload → IPC → service → storage／檔案的主要流程。
  - 驗收：AI 可使用 mock provider，測試不消耗真實 API 額度。
- [ ] 建立端到端與 UAT 清單
  - 覆蓋建立活動、生成、編輯、儲存、載入、範本、匯入與文件匯出。
  - 驗收：在全新使用者資料目錄完成一次完整流程並記錄結果。
- [ ] 實作離線模式
  - 離線時允許編輯、瀏覽歷史專案、使用範本與匯出既有結果。
  - 驗收：AI 功能清楚標示不可用，其他本地功能正常。
- [ ] 驗證效能成功指標
  - 量測應用程式啟動時間與完整生成時間。
  - 驗收：啟動時間低於 3 秒，完整 SOP 與風險評估在 3 分鐘內完成。
- [ ] 建立 AI 品質評估流程
  - 使用代表性活動樣本與人工評分規則衡量內容正確性、完整性及可執行性。
  - 驗收：人工審核準確度達 80% 以上並保留評估紀錄。
- [ ] 驗證至少 10 種常見活動類型
  - 為各類型準備範例資料、風險提示與生成驗收案例。
  - 驗收：10 種類型皆能完成端到端生成與匯出。

## Phase 7：打包、文件與發布

- [ ] 驗證 Windows 安裝檔
  - 測試安裝、啟動、資料保存、升級與解除安裝。
  - 驗收：乾淨 Windows 環境可完成主要工作流程。
- [ ] 驗證 macOS 與 Linux 安裝檔
  - 測試檔案路徑、權限、對話框、SQLite 與文件匯出。
  - 驗收：支援平台均有可安裝且可執行的產物。
- [ ] 實作應用程式更新機制
  - 定義更新來源、版本策略、簽章需求、失敗回復與使用者提示。
  - 驗收：可從舊版安全更新至新版且保留使用者資料。
- [ ] 更新 README 與使用者文件
  - 修正 README 中失效的本機絕對 `plan.md` 連結。
  - 更新真實專案狀態、安裝、開發、測試、API Key、備份、匯入匯出與疑難排解說明。
  - 驗收：全新開發者可依文件完成安裝、測試與啟動。
- [ ] 建立發布檢查清單
  - 包含版本號、變更紀錄、測試、UAT、簽章、產物雜湊及回復方案。
  - 驗收：每次發布都有可追溯的檢查紀錄。

## 全域完成條件

- [ ] `npm run type-check` 通過。
- [ ] `npm run lint` 通過且零警告。
- [ ] `npm test` 通過。
- [ ] `npm run test:ai` 通過。
- [ ] `npm run build` 通過。
- [ ] 主要端到端流程與 UAT 通過。
- [ ] Word／Excel 在 Microsoft Office 2016+ 驗證可編輯。
- [ ] Windows、macOS、Linux 支援狀態與限制已記錄於 README。
