import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { Template } from '../../types/settings';
import { EVENT_TYPE_OPTIONS } from '../../utils/constants';
import { normalizeTemplate, TEMPLATE_TYPE_LABELS } from '../../utils/template';

interface TemplateEditorProps {
  open: boolean;
  template?: Template | null;
  onClose: () => void;
  onSave: (template: Template) => Promise<void> | void;
}

const createEmptyTemplate = (): Template =>
  normalizeTemplate({
    name: '',
    type: 'full',
    eventType: EVENT_TYPE_OPTIONS[0]?.value ?? 'other',
    content: {
      eventSettings: {
        type: EVENT_TYPE_OPTIONS[0]?.value ?? 'other',
      },
    },
    isDefault: false,
  });

function TemplateEditor({ open, template, onClose, onSave }: TemplateEditorProps) {
  const sourceTemplate = useMemo(() => template ?? createEmptyTemplate(), [template]);
  const [name, setName] = useState(sourceTemplate.name);
  const [type, setType] = useState<Template['type']>(sourceTemplate.type);
  const [eventType, setEventType] = useState(sourceTemplate.eventType);
  const [isDefault, setIsDefault] = useState(sourceTemplate.isDefault);
  const [contentText, setContentText] = useState(JSON.stringify(sourceTemplate.content, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextTemplate = template ?? createEmptyTemplate();
    setName(nextTemplate.name);
    setType(nextTemplate.type);
    setEventType(nextTemplate.eventType);
    setIsDefault(nextTemplate.isDefault);
    setContentText(JSON.stringify(nextTemplate.content, null, 2));
    setError(null);
    setSaving(false);
  }, [template, open]);

  const handleSubmit = async () => {
    setError(null);

    if (name.trim() === '') {
      setError('請輸入範本名稱。');
      return;
    }

    try {
      setSaving(true);
      const content = JSON.parse(contentText) as Template['content'];
      const nextTemplate = normalizeTemplate({
        ...sourceTemplate,
        name,
        type,
        eventType,
        content,
        isDefault,
      });
      await onSave(nextTemplate);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '範本內容格式錯誤。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle>{template ? '編輯範本' : '建立範本'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="範本名稱" value={name} onChange={event => setName(event.target.value)} autoFocus />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="範本類型"
              value={type}
              onChange={event => setType(event.target.value as Template['type'])}
              fullWidth
            >
              {Object.entries(TEMPLATE_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="適用活動類型"
              value={eventType}
              onChange={event => setEventType(event.target.value)}
              fullWidth
            >
              {EVENT_TYPE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <FormControlLabel
            control={<Checkbox checked={isDefault} onChange={event => setIsDefault(event.target.checked)} />}
            label="設為預設範本"
          />
          <TextField
            label="範本內容（JSON）"
            value={contentText}
            onChange={event => setContentText(event.target.value)}
            multiline
            minRows={16}
            fullWidth
            helperText="可編輯 SOP、風險評估與活動設定內容。"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          取消
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? '儲存中...' : '儲存範本'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TemplateEditor;
