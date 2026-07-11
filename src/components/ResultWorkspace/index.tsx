import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useMemo, useRef, useState } from 'react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { storageService } from '../../services/storage/storageService';
import { useAppStore } from '../../store/appStore';
import RiskEditor from './RiskEditor';
import SOPEditor from './SOPEditor';

type Operation = 'idle' | 'processing' | 'success' | 'error';
type RetryAction = (() => Promise<void>) | null;
interface Props {
  onBackToForm: () => void;
}

export default function ResultWorkspace({ onBackToForm }: Props) {
  const [tab, setTab] = useState<'sop' | 'risk'>('sop');
  const [operation, setOperation] = useState<Operation>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const currentEvent = useAppStore(state => state.currentEvent);
  const currentProjectId = useAppStore(state => state.currentProjectId);
  const hydrationKey = useAppStore(state => state.projectHydrationKey);
  const sop = useAppStore(state => state.sopDocument);
  const risk = useAppStore(state => state.riskAssessment);
  const setSop = useAppStore(state => state.setSopDocument);
  const setRisk = useAppStore(state => state.setRiskAssessment);
  const save = useAppStore(state => state.saveCurrentProject);
  const lastActionRef = useRef<RetryAction>(null);
  const savePayload = useMemo(() => ({ sop, risk }), [risk, sop]);
  const autoSave = useAutoSave({
    value: savePayload,
    enabled: Boolean(currentProjectId),
    delay: 3000,
    resetKey: `${hydrationKey}-${currentProjectId}`,
    canSave: Boolean(currentProjectId),
    onSave: async () => {
      await save({ status: 'in_progress' });
    },
  });

  const run = async (action: () => Promise<boolean | void>, success: string, retryAction: RetryAction = null) => {
    lastActionRef.current = retryAction;
    setOperation('processing');
    setMessage(null);
    try {
      const result = await action();
      if (result === false) {
        setOperation('idle');
        return;
      }
      setOperation('success');
      setMessage(success);
    } catch (error) {
      setOperation('error');
      setMessage(error instanceof Error ? error.message : '執行失敗，請稍後再試。');
    }
  };

  const generateSop = () =>
    run(
      async () => {
        if (!currentEvent) throw new Error('找不到活動資料，無法生成 SOP。');
        if (sop && !window.confirm('重新生成會覆蓋目前 SOP，是否繼續？')) return false;
        setSop(await storageService.generateSOP({ eventInfo: currentEvent }));
        await save({ status: 'in_progress' });
      },
      'SOP 已更新並儲存。',
      generateSop,
    );

  const generateRisk = () =>
    run(
      async () => {
        if (!currentEvent) throw new Error('找不到活動資料，無法生成風險評估。');
        if (risk && !window.confirm('重新生成會覆蓋目前風險評估，是否繼續？')) return false;
        setRisk(await storageService.generateRiskAssessment({ eventInfo: currentEvent }));
        await save({ status: 'in_progress' });
      },
      '風險評估已更新並儲存。',
      generateRisk,
    );

  const exportSop = () =>
    run(
      async () => {
        if (!sop) throw new Error('目前沒有 SOP 可匯出。');
        const dialog = await storageService.showSaveDialog({
          title: '匯出 Word SOP',
          defaultPath: `${sop.eventName}-SOP.docx`,
          filters: [{ name: 'Word', extensions: ['docx'] }],
        });
        if (dialog.canceled || !dialog.filePath) return false;
        await storageService.exportWordDocument(sop, dialog.filePath);
      },
      'Word SOP 匯出完成。',
      exportSop,
    );

  const exportRisk = () =>
    run(
      async () => {
        if (!risk) throw new Error('目前沒有風險評估可匯出。');
        const dialog = await storageService.showSaveDialog({
          title: '匯出 Excel 風險評估',
          defaultPath: `${risk.eventName}-風險評估.xlsx`,
          filters: [{ name: 'Excel', extensions: ['xlsx'] }],
        });
        if (dialog.canceled || !dialog.filePath) return false;
        await storageService.exportExcelDocument(risk, dialog.filePath);
      },
      'Excel 風險評估匯出完成。',
      exportRisk,
    );

  const busy = operation === 'processing';
  const retry = lastActionRef.current;
  const retryLabel = message && operation === 'error' ? '重試上次操作' : '重新執行';

  return (
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, position: { md: 'sticky' }, top: 8, zIndex: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' } }}>
          <Box>
            <Typography variant="overline" color="primary">
              Phase 2 · 結果工作區
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {currentEvent?.name ?? '活動結果'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {autoSave.status === 'saving' ? '自動儲存中…' : autoSave.status === 'saved' ? '修改已儲存' : autoSave.error ?? '可直接編輯生成結果'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Button onClick={onBackToForm}>返回活動資料</Button>
            <Button startIcon={<SaveRoundedIcon />} disabled={busy} onClick={() => void run(async () => { await save({ status: 'in_progress' }); }, '專案已儲存。')}>
              立即儲存
            </Button>
            <Button startIcon={sop ? <ReplayRoundedIcon /> : <AutoAwesomeRoundedIcon />} disabled={busy} onClick={() => void generateSop()}>
              {sop ? '重新生成 SOP' : '生成 SOP'}
            </Button>
            <Button startIcon={risk ? <ReplayRoundedIcon /> : <AutoAwesomeRoundedIcon />} disabled={busy} onClick={() => void generateRisk()}>
              {risk ? '重新生成風險' : '生成風險'}
            </Button>
            <Button startIcon={<DownloadRoundedIcon />} disabled={busy || !sop} onClick={() => void exportSop()}>
              Word
            </Button>
            <Button startIcon={<DownloadRoundedIcon />} disabled={busy || !risk} onClick={() => void exportRisk()}>
              Excel
            </Button>
            {busy ? <CircularProgress size={24} /> : null}
          </Stack>
        </Stack>
      </Paper>

      {message ? (
        <Alert
          severity={operation === 'error' ? 'error' : 'success'}
          action={
            operation === 'error' && retry ? (
              <Button color="inherit" onClick={() => void retry()}>
                {retryLabel}
              </Button>
            ) : undefined
          }
        >
          {message}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, value: 'sop' | 'risk') => setTab(value)} variant="fullWidth">
          <Tab value="sop" label={`SOP${sop ? ` · ${sop.sections.length} 章` : ''}`} />
          <Tab value="risk" label={`風險評估${risk ? ` · ${risk.risks.length} 項` : ''}`} />
        </Tabs>
      </Paper>

      {tab === 'sop' ? (
        sop ? (
          <SOPEditor document={sop} onChange={setSop} disabled={busy} />
        ) : (
          <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
            <Typography variant="h6">尚未生成 SOP</Typography>
            <Button sx={{ mt: 2 }} variant="contained" onClick={() => void generateSop()}>
              立即生成
            </Button>
          </Paper>
        )
      ) : risk ? (
        <RiskEditor assessment={risk} onChange={setRisk} disabled={busy} />
      ) : (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6">尚未生成風險評估</Typography>
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => void generateRisk()}>
            立即生成
          </Button>
        </Paper>
      )}
    </Stack>
  );
}
