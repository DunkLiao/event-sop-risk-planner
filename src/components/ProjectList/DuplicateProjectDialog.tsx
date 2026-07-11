import { useEffect, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import type { Project } from '../../types/settings';

interface DuplicateProjectDialogProps {
  open: boolean;
  project: Project | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}

function DuplicateProjectDialog({
  open,
  project,
  loading = false,
  onClose,
  onConfirm,
}: DuplicateProjectDialogProps) {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (open && project) {
      setNewName(`${project.name} 副本`);
    }
  }, [open, project]);

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>複製專案</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          label="新專案名稱"
          value={newName}
          onChange={event => setNewName(event.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} color="inherit">
          取消
        </Button>
        <Button onClick={() => onConfirm(newName)} disabled={loading || newName.trim() === ''} variant="contained">
          建立副本
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DuplicateProjectDialog;
