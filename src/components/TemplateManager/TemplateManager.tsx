import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShareRoundedIcon from '@mui/icons-material/ShareRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { storageService } from '../../services/storage/storageService';
import type { Project, Template, TemplateFilter } from '../../types/settings';
import { EVENT_TYPE_OPTIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';
import {
  getTemplateEventTypeLabel,
  getTemplateTypeLabel,
  TEMPLATE_SORT_LABELS,
} from '../../utils/template';
import TemplateEditor from './TemplateEditor';

interface TemplateManagerProps {
  onProjectCreated?: (project: Project) => Promise<void> | void;
}

type TemplateSortValue = keyof typeof TEMPLATE_SORT_LABELS;

function TemplateManager({ onProjectCreated }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TemplateFilter['type']>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<TemplateFilter['eventType']>('all');
  const [sortValue, setSortValue] = useState<TemplateSortValue>('createdAt:desc');
  const [editorTemplate, setEditorTemplate] = useState<Template | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [useDialogTemplate, setUseDialogTemplate] = useState<Template | null>(null);
  const [projectName, setProjectName] = useState('');
  const [shareTemplate, setShareTemplate] = useState<Template | null>(null);
  const [shareCode, setShareCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [sortBy, sortDirection] = sortValue.split(':') as [TemplateFilter['sortBy'], TemplateFilter['sortDirection']];
      const nextTemplates = await storageService.loadTemplates({
        search: searchQuery,
        type: typeFilter,
        eventType: eventTypeFilter,
        sortBy,
        sortDirection,
      });
      setTemplates(nextTemplates);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : '載入範本失敗。');
    } finally {
      setLoading(false);
    }
  }, [eventTypeFilter, searchQuery, sortValue, typeFilter]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const summary = useMemo(
    () => ({
      total: templates.length,
      defaultCount: templates.filter(template => template.isDefault).length,
      fullCount: templates.filter(template => template.type === 'full').length,
    }),
    [templates]
  );

  const handleSaveTemplate = async (template: Template) => {
    await storageService.saveTemplate(template);
    await loadTemplates();
  };

  const handleDeleteTemplate = async (template: Template) => {
    const confirmed = window.confirm(`確定要刪除範本「${template.name}」嗎？`);
    if (!confirmed) {
      return;
    }

    await storageService.deleteTemplate(template.id);
    await loadTemplates();
  };

  const handleToggleDefault = async (template: Template) => {
    await storageService.setDefaultTemplate(template.id, !template.isDefault);
    await loadTemplates();
  };

  const handleExportTemplate = async (template: Template) => {
    const dialogResult = await storageService.showSaveDialog({
      title: '匯出範本',
      defaultPath: `${template.name}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!dialogResult.canceled && dialogResult.filePath) {
      await storageService.exportTemplate(template, dialogResult.filePath);
    }
  };

  const handleImportTemplate = async () => {
    const dialogResult = await storageService.showOpenDialog({
      title: '匯入範本',
      filters: [{ name: 'JSON', extensions: ['json'] }],
      properties: ['openFile'],
    });

    const filePath = dialogResult.filePaths[0];
    if (!dialogResult.canceled && filePath) {
      await storageService.importTemplate(filePath);
      await loadTemplates();
    }
  };

  const handleOpenUseDialog = (template: Template) => {
    setUseDialogTemplate(template);
    setProjectName(`${template.name} 專案`);
    setError(null);
  };

  const handleCreateProjectFromTemplate = async () => {
    if (!useDialogTemplate) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const project = await storageService.createProjectFromTemplate(useDialogTemplate.id, projectName);
      await onProjectCreated?.(project);
      setUseDialogTemplate(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '從範本建立專案失敗。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateShareCode = async (template: Template) => {
    setShareTemplate(template);
    setShareCode(await storageService.generateTemplateShareCode(template.id));
  };

  const handleCopyShareCode = async () => {
    if (!shareCode) {
      return;
    }

    await navigator.clipboard.writeText(shareCode);
  };

  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4 }}>
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
            }}
          >
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                範本管理
              </Typography>
              <Typography color="text.secondary">集中管理 SOP、風險評估與完整專案範本。</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button startIcon={<FileUploadRoundedIcon />} variant="outlined" onClick={() => void handleImportTemplate()}>
                匯入範本
              </Button>
              <Button
                startIcon={<AddRoundedIcon />}
                variant="contained"
                onClick={() => {
                  setEditorTemplate(null);
                  setEditorOpen(true);
                }}
              >
                新增範本
              </Button>
            </Stack>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                md: 'minmax(0, 1.4fr) repeat(3, minmax(160px, 0.7fr))',
              },
            }}
          >
            <TextField
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="搜尋範本名稱"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField select label="類型篩選" value={typeFilter} onChange={event => setTypeFilter(event.target.value as TemplateFilter['type'])}>
              <MenuItem value="all">全部類型</MenuItem>
              <MenuItem value="full">完整專案</MenuItem>
              <MenuItem value="sop">SOP</MenuItem>
              <MenuItem value="risk">風險評估</MenuItem>
            </TextField>
            <TextField
              select
              label="活動類型"
              value={eventTypeFilter}
              onChange={event => setEventTypeFilter(event.target.value as TemplateFilter['eventType'])}
            >
              <MenuItem value="all">全部活動</MenuItem>
              {EVENT_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="排序方式" value={sortValue} onChange={event => setSortValue(event.target.value as TemplateSortValue)}>
              {Object.entries(TEMPLATE_SORT_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {[
              { label: '範本總數', value: summary.total },
              { label: '預設範本', value: summary.defaultCount },
              { label: '完整專案範本', value: summary.fullCount },
            ].map(item => (
              <Paper key={item.label} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="overline" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {item.value}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 4, overflow: 'hidden' }}>
        <TableContainer>
          <Table sx={{ minWidth: 920 }}>
            <TableHead>
              <TableRow>
                <TableCell>範本名稱</TableCell>
                <TableCell>範本類型</TableCell>
                <TableCell>適用活動類型</TableCell>
                <TableCell>預設標籤</TableCell>
                <TableCell>建立時間</TableCell>
                <TableCell align="right">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      尚無符合條件的範本
                    </Typography>
                    <Typography color="text.secondary">可建立新範本，或從專案匯出為範本後在此管理。</Typography>
                  </TableCell>
                </TableRow>
              ) : null}

              {templates.map(template => (
                <TableRow key={template.id} hover>
                  <TableCell>
                    <Stack spacing={0.75}>
                      <Typography sx={{ fontWeight: 700 }}>{template.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        SOP：{template.content.sopTemplate ? '有' : '無'} · 風險：{template.content.riskTemplate ? '有' : '無'} ·
                        設定：{template.content.eventSettings ? '有' : '無'}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{getTemplateTypeLabel(template.type)}</TableCell>
                  <TableCell>{getTemplateEventTypeLabel(template.eventType)}</TableCell>
                  <TableCell>
                    {template.isDefault ? <Chip size="small" color="primary" icon={<StarRoundedIcon />} label="預設" /> : '—'}
                  </TableCell>
                  <TableCell>{formatDateTime(template.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
                      <Tooltip title="使用範本">
                        <IconButton color="primary" onClick={() => handleOpenUseDialog(template)}>
                          <PlayCircleRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="編輯範本">
                        <IconButton
                          onClick={() => {
                            setEditorTemplate(template);
                            setEditorOpen(true);
                          }}
                        >
                          <EditRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="匯出範本">
                        <IconButton onClick={() => void handleExportTemplate(template)}>
                          <DownloadRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="生成分享碼">
                        <IconButton onClick={() => void handleGenerateShareCode(template)}>
                          <ShareRoundedIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={template.isDefault ? '取消預設' : '設為預設'}>
                        <IconButton onClick={() => void handleToggleDefault(template)}>
                          <StarRoundedIcon color={template.isDefault ? 'primary' : 'inherit'} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="刪除範本">
                        <IconButton color="error" onClick={() => void handleDeleteTemplate(template)}>
                          <DeleteRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <TemplateEditor
        open={editorOpen}
        template={editorTemplate}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveTemplate}
      />

      <Dialog open={Boolean(useDialogTemplate)} onClose={submitting ? undefined : () => setUseDialogTemplate(null)} maxWidth="xs" fullWidth>
        <DialogTitle>從範本建立專案</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Typography color="text.secondary">
              將使用「{useDialogTemplate?.name ?? ''}」建立新專案，內容會自動帶入且可後續編輯。
            </Typography>
            <TextField label="新專案名稱" value={projectName} onChange={event => setProjectName(event.target.value)} autoFocus />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUseDialogTemplate(null)} color="inherit" disabled={submitting}>
            取消
          </Button>
          <Button onClick={() => void handleCreateProjectFromTemplate()} variant="contained" disabled={submitting}>
            {submitting ? '建立中...' : '建立專案'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(shareTemplate)} onClose={() => setShareTemplate(null)} maxWidth="sm" fullWidth>
        <DialogTitle>範本分享碼</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography color="text.secondary">
              可將下列分享碼提供給其他人匯入相同範本內容。
            </Typography>
            <TextField value={shareCode} multiline minRows={5} fullWidth slotProps={{ input: { readOnly: true } }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareTemplate(null)} color="inherit">
            關閉
          </Button>
          <Button onClick={() => void handleCopyShareCode()} variant="contained" startIcon={<ShareRoundedIcon />}>
            複製分享碼
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TemplateManager;
