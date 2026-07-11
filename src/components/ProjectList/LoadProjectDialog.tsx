import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import type { Project } from '../../types/settings';

interface LoadProjectDialogProps {
  open: boolean;
  project: Project | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function LoadProjectDialog({ open, project, loading = false, onClose, onConfirm }: LoadProjectDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>載入專案</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1.5 }}>載入後會切換到此專案的編輯內容，未保存的本地表單變更可能被覆蓋。</DialogContentText>
        {project ? <Typography variant="subtitle1">{project.name}</Typography> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          取消
        </Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained">
          載入專案
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default LoadProjectDialog;
