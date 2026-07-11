# 活動 SOP 與風險規劃生成器

基於 React + Electron + AI 的跨平台桌面應用程式，自動生成活動標準作業流程 (SOP) 與風險評估報告。

## 專案狀態

✅ Phase 1: 專案基礎建置 - **進行中**
- ✅ 專案結構初始化
- ✅ 配置檔案設定完成
- ✅ 基本資料夾架構建立
- ✅ TypeScript 型別定義完成

## 技術棧

- **前端**: React 19 + TypeScript 5.6
- **桌面框架**: Electron 43
- **建置工具**: Vite 8
- **UI 框架**: Material-UI (MUI) 9
- **狀態管理**: Zustand
- **AI 整合**: OpenAI API / Anthropic Claude API
- **文件生成**: docx, exceljs
- **程式碼品質**: ESLint + Prettier

## 專案結構

```
event-sop-risk-planner/
├── electron/               # Electron 主程序
│   ├── main.ts            # 主程序入口
│   └── preload.ts         # 預載腳本
├── src/                   # React 應用程式
│   ├── components/        # UI 元件
│   ├── services/          # 業務邏輯
│   ├── types/             # TypeScript 型別
│   ├── utils/             # 工具函式
│   ├── hooks/             # React Hooks
│   ├── store/             # 狀態管理
│   ├── App.tsx            # 根元件
│   └── main.tsx           # React 入口
├── templates/             # 文件範本
├── public/                # 靜態資源
└── tests/                 # 測試檔案
```

## 開發指令

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置應用程式
npm run build

# 程式碼檢查
npm run lint

# 格式化程式碼
npm run format

# 型別檢查
npm run type-check
```

## 核心功能

### 1. 活動資訊輸入
- 支援多種活動類型（會議、展覽、演唱會、體育賽事等）
- 多步驟表單（基本資訊 → 詳細需求 → 特殊考量）
- 活動規模與預算評估

### 2. AI 自動生成
- SOP 流程步驟生成
- 風險識別與評估
- 應對策略建議
- 支援 OpenAI 和 Claude API

### 3. 文件匯出
- Word 格式 SOP 文件
- Excel 格式風險矩陣
- 自訂範本支援

### 4. 專案管理
- 歷史專案儲存
- 範本管理
- 匯入/匯出功能

## 開發計畫

詳細的實作計畫請參考：[實作計畫文件](C:\Users\user\.copilot\session-state\6dcdd704-59ae-4fbf-8b0b-2734dee747e0\plan.md)

## 授權

MIT License
