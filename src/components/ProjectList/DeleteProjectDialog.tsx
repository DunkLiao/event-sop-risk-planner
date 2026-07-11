import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import type { Project } from '../../types/settings';

interface DeleteProjectDialogProps {
  open: boolean;
  project: Project | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteProjectDialog({ open, project, loading = false, onClose, onConfirm }: DeleteProjectDialogProps) {
  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>刪除專案</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 1.5 }}>刪除後將無法復原，請確認是否要永久移除此專案。</DialogContentText>
        {project ? (
          <Typography variant="subtitle1" color="error.main">
            {project.name}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          取消
        </Button>
        <Button onClick={onConfirm} disabled={loading} variant="contained" color="error">
          刪除專案
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteProjectDialog;
