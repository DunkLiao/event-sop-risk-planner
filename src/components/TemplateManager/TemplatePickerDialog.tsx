import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { storageService } from '../../services/storage/storageService';
import type { Project, Template } from '../../types/settings';
import { EVENT_TYPE_OPTIONS } from '../../utils/constants';
import { formatDateTime } from '../../utils/helpers';
import { getTemplateEventTypeLabel, getTemplateTypeLabel } from '../../utils/template';

interface TemplatePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onProjectCreated: (project: Project) => Promise<void> | void;
  defaultOnly?: boolean;
  initialTemplateId?: string | null;
}

function TemplatePickerDialog({
  open,
  onClose,
  onProjectCreated,
  defaultOnly = false,
  initialTemplateId = null,
}: TemplatePickerDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(initialTemplateId ?? '');
  const [projectName, setProjectName] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadTemplates = async () => {
      setLoading(true);
      setError(null);

      try {
        const nextTemplates = await storageService.loadTemplates({
          defaultOnly,
          eventType: eventTypeFilter === 'all' ? 'all' : (eventTypeFilter as never),
          sortBy: 'createdAt',
          sortDirection: 'desc',
        });
        setTemplates(nextTemplates);
        setSelectedTemplateId(() => {
          if (initialTemplateId && nextTemplates.some(template => template.id === initialTemplateId)) {
            return initialTemplateId;
          }

          return nextTemplates[0]?.id ?? '';
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : '載入範本失敗。');
      } finally {
        setLoading(false);
      }
    };

    void loadTemplates();
  }, [defaultOnly, eventTypeFilter, initialTemplateId, open]);

  useEffect(() => {
    if (open) {
      setProjectName('');
      setError(null);
      if (!initialTemplateId) {
        setSelectedTemplateId('');
      }
    }
  }, [initialTemplateId, open]);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === selectedTemplateId) ?? null,
    [selectedTemplateId, templates]
  );

  const handleCreateProject = async () => {
    if (!selectedTemplate) {
      setError('請先選擇範本。');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const project = await storageService.createProjectFromTemplate(
        selectedTemplate.id,
        projectName.trim() || `${selectedTemplate.name} 專案`
      );
      await onProjectCreated(project);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '建立專案失敗。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>從範本開始</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="新專案名稱"
              value={projectName}
              onChange={event => setProjectName(event.target.value)}
              fullWidth
            />
            <TextField
              select
              label="活動類型"
              value={eventTypeFilter}
              onChange={event => setEventTypeFilter(event.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">全部類型</MenuItem>
              {EVENT_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {loading ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">正在載入範本…</Typography>
            </Paper>
          ) : templates.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                目前沒有可用範本
              </Typography>
              <Typography color="text.secondary">請先在範本管理建立或匯入範本。</Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  md: 'repeat(2, minmax(0, 1fr))',
                },
              }}
            >
              {templates.map(template => {
                const selected = template.id === selectedTemplateId;

                return (
                  <Paper
                    key={template.id}
                    variant="outlined"
                    onClick={() => setSelectedTemplateId(template.id)}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      cursor: 'pointer',
                      borderColor: selected ? 'primary.main' : 'divider',
                      boxShadow: selected ? theme => `0 0 0 1px ${theme.palette.primary.main}` : 'none',
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {template.name}
                        </Typography>
                        {template.isDefault ? <Chip size="small" label="預設" color="primary" icon={<StarRoundedIcon />} /> : null}
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {getTemplateTypeLabel(template.type)} · {getTemplateEventTypeLabel(template.eventType)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        建立時間：{formatDateTime(template.createdAt)}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Box>
          )}

          {selectedTemplate ? (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.background.paper} 100%)`,
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <AutoAwesomeRoundedIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    範本預覽
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  會自動帶入活動設定、SOP 與風險評估內容，建立後仍可繼續修改。
                </Typography>
                <Typography variant="body2">SOP：{selectedTemplate.content.sopTemplate ? '已包含' : '未包含'}</Typography>
                <Typography variant="body2">風險評估：{selectedTemplate.content.riskTemplate ? '已包含' : '未包含'}</Typography>
                <Typography variant="body2">活動設定：{selectedTemplate.content.eventSettings ? '已包含' : '未包含'}</Typography>
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          取消
        </Button>
        <Button onClick={handleCreateProject} variant="contained" disabled={submitting || !selectedTemplate}>
          {submitting ? '建立中...' : '建立專案'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TemplatePickerDialog;
