# 活動 SOP 與風險規劃生成器

基於 React + Electron 的桌面應用程式，用來輸入活動資訊、生成 SOP 與風險評估，並提供可直接編輯與匯出的結果工作區。

## 目前完成度

- P0 基礎與建置已完成
- Phase 2 結果預覽與編輯介面已完成
- Word / Excel 匯出已完成
- Electron AI IPC 已完成

## 主要功能

- 活動資料輸入與專案儲存
- SOP 與風險評估自動生成
- 結果工作區可直接編輯
- SOP 支援章節、任務、時程、檢查清單編輯
- 風險評估支援風險項目、狀態、應對策略、資源與備案編輯
- 重新生成前會要求確認，避免覆蓋既有結果
- 3 秒自動儲存與手動儲存
- Word SOP 匯出
- Excel 風險評估匯出
- 範本管理與模板匯入 / 匯出

## 開發指令

```bash
npm install
npm run dev
npm run type-check
npm run lint
npm test
npm run test:ai
npm run test:ui
npm run build
```

## 專案結構

```text
electron/        Electron 主程序、preload 與 IPC
src/components/  React UI 元件
src/services/    商業邏輯與文件/AI/儲存服務
src/store/       Zustand 狀態管理
src/types/       共用型別
src/utils/       共用工具
tests/           Node test 測試
templates/       可匯入的活動範本
public/          靜態資源
```

## 驗證狀態

已通過：

- `npm run type-check`
- `npm run lint`
- `npm test`
- `npm run test:ai`
- `npm run test:ui`
- `npm run build`

## 備註

- 目前 `build` 會產出 Windows 安裝檔與 unpacked 目錄。
- 若要調整 AI 行為，先檢查 `src/services/ai/` 與 `electron/ipc/generation.ts`。
