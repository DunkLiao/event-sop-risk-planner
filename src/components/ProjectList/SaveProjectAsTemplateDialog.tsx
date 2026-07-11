import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { storageService } from '../../services/storage/storageService';
import type { Project, Template } from '../../types/settings';

interface SaveProjectAsTemplateDialogProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
  onSaved?: (template: Template) => Promise<void> | void;
}

function SaveProjectAsTemplateDialog({ open, project, onClose, onSaved }: SaveProjectAsTemplateDialogProps) {
  const [templateName, setTemplateName] = useState('');
  const [includeSop, setIncludeSop] = useState(true);
  const [includeRisk, setIncludeRisk] = useState(true);
  const [includeEventSettings, setIncludeEventSettings] = useState(true);
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTemplateName(project ? `${project.name} 範本` : '');
    setIncludeSop(Boolean(project?.sopDocument));
    setIncludeRisk(Boolean(project?.riskAssessment));
    setIncludeEventSettings(true);
    setIsDefault(false);
    setError(null);
    setSaving(false);
  }, [project, open]);

  const handleSubmit = async () => {
    if (!project) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const template = await storageService.createTemplateFromProject(project.id, templateName, {
        includeSop,
        includeRisk,
        includeEventSettings,
        isDefault,
      });
      await onSaved?.(template);
      onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '建立範本失敗。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>儲存為範本</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="範本名稱"
            value={templateName}
            onChange={event => setTemplateName(event.target.value)}
            autoFocus
            fullWidth
          />
          <Stack spacing={1}>
            <FormControlLabel
              control={<Checkbox checked={includeSop} onChange={event => setIncludeSop(event.target.checked)} />}
              label="包含 SOP 文件"
            />
            <FormControlLabel
              control={<Checkbox checked={includeRisk} onChange={event => setIncludeRisk(event.target.checked)} />}
              label="包含風險評估"
            />
            <FormControlLabel
              control={
                <Checkbox checked={includeEventSettings} onChange={event => setIncludeEventSettings(event.target.checked)} />
              }
              label="包含活動設定"
            />
            <FormControlLabel
              control={<Checkbox checked={isDefault} onChange={event => setIsDefault(event.target.checked)} />}
              label="設為預設範本"
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          取消
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving || (!includeSop && !includeRisk && !includeEventSettings)}
        >
          {saving ? '儲存中...' : '儲存範本'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SaveProjectAsTemplateDialog;
