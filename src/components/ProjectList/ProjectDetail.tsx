import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import {
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { Project, ProjectStatus } from '../../types/settings';
import { formatDateTime } from '../../utils/helpers';
import { getEventScaleLabel, getEventTypeLabel, PROJECT_STATUS_LABELS } from '../../utils/project';

interface ProjectDetailProps {
  project: Project | null;
  onEdit: (project: Project) => void;
  onExport: (project: Project) => void;
  onDelete: (project: Project) => void;
  onStatusChange: (project: Project, status: ProjectStatus) => void;
  onSaveAsTemplate: (project: Project) => void;
}

const PROJECT_STATUS_COLOR: Record<ProjectStatus, 'default' | 'primary' | 'success'> = {
  draft: 'default',
  in_progress: 'primary',
  completed: 'success',
};

function ProjectDetail({ project, onEdit, onExport, onDelete, onStatusChange, onSaveAsTemplate }: ProjectDetailProps) {
  if (!project) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          選擇一個專案
        </Typography>
        <Typography color="text.secondary">從左側清單選擇專案後，即可查看完整資訊、匯出或繼續編輯。</Typography>
      </Paper>
    );
  }

  const topRisks = project.riskAssessment?.summary.topRisks ?? [];
  const highRiskCount =
    (project.riskAssessment?.summary.risksBySeverity.high ?? 0) +
    (project.riskAssessment?.summary.risksBySeverity.critical ?? 0);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, display: 'grid', gap: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="overline" color="primary.main" sx={{ fontWeight: 700 }}>
            Project Detail
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {project.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            建立於 {formatDateTime(project.createdAt)} · 最後更新 {formatDateTime(project.updatedAt)}
          </Typography>
        </Box>
        <Chip label={PROJECT_STATUS_LABELS[project.status]} color={PROJECT_STATUS_COLOR[project.status]} />
      </Box>

      <TextField
        select
        label="專案狀態"
        value={project.status}
        onChange={event => onStatusChange(project, event.target.value as ProjectStatus)}
        sx={{ maxWidth: 220 }}
      >
        {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </TextField>

      <Divider />

      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          活動資訊摘要
        </Typography>
        <List dense disablePadding>
          <ListItem disableGutters>
            <ListItemText primary="活動類型" secondary={getEventTypeLabel(project.eventInfo.type)} />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="活動規模" secondary={getEventScaleLabel(project.eventInfo.scale)} />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="活動時間" secondary={`${project.eventInfo.startDate || '未設定'} ~ ${project.eventInfo.endDate || '未設定'}`} />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="活動地點" secondary={project.eventInfo.location || '未設定'} />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="預計人數" secondary={project.eventInfo.attendees > 0 ? `${project.eventInfo.attendees} 人` : '未設定'} />
          </ListItem>
          <ListItem disableGutters>
            <ListItemText primary="說明" secondary={project.eventInfo.description || '尚未填寫活動描述'} />
          </ListItem>
        </List>
      </Box>

      <Divider />

      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          SOP 文件預覽
        </Typography>
        {project.sopDocument ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              章節數量：{project.sopDocument.sections.length} · 時程項目：{project.sopDocument.timeline.length} · 核對清單：
              {project.sopDocument.checklist.length}
            </Typography>
            {project.sopDocument.sections.slice(0, 3).map(section => (
              <Paper key={section.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="subtitle2">{section.title}</Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {section.content || `任務數量 ${section.tasks.length} 項`}
                </Typography>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">尚未生成 SOP 文件。</Typography>
        )}
      </Box>

      <Divider />

      <Box>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
          風險評估摘要
        </Typography>
        {project.riskAssessment ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              風險總數：{project.riskAssessment.summary.totalRisks} · 高風險以上：{highRiskCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              重點風險：{topRisks.length > 0 ? topRisks.join('、') : '尚未標記'}
            </Typography>
          </Stack>
        ) : (
          <Typography color="text.secondary">尚未生成風險評估。</Typography>
        )}
      </Box>

      <Divider />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button startIcon={<EditRoundedIcon />} variant="contained" onClick={() => onEdit(project)}>
          編輯專案
        </Button>
        <Button startIcon={<DownloadRoundedIcon />} variant="outlined" onClick={() => onExport(project)}>
          匯出專案
        </Button>
        <Button startIcon={<AutoAwesomeRoundedIcon />} variant="outlined" onClick={() => onSaveAsTemplate(project)}>
          儲存為範本
        </Button>
        <Button startIcon={<DeleteRoundedIcon />} variant="outlined" color="error" onClick={() => onDelete(project)}>
          刪除專案
        </Button>
      </Stack>
    </Paper>
  );
}

export default ProjectDetail;
