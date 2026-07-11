import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { Project, ProjectStats, ProjectStatus } from '../../types/settings';
import { formatDateTime } from '../../utils/helpers';
import { getEventScaleLabel, getEventTypeLabel, PROJECT_STATUS_LABELS } from '../../utils/project';

interface ProjectListProps {
  projects: Project[];
  stats: ProjectStats | null;
  selectedProjectId: string | null;
  loading?: boolean;
  searchQuery: string;
  statusFilter: ProjectStatus | 'all';
  sortValue: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: ProjectStatus | 'all') => void;
  onSortChange: (value: string) => void;
  onSelectProject: (projectId: string) => void;
  onRequestLoad: (project: Project) => void;
  onRequestDuplicate: (project: Project) => void;
  onRequestDelete: (project: Project) => void;
}

const PROJECT_STATUS_COLOR: Record<ProjectStatus, 'default' | 'primary' | 'success'> = {
  draft: 'default',
  in_progress: 'primary',
  completed: 'success',
};

function ProjectList({
  projects,
  stats,
  selectedProjectId,
  loading = false,
  searchQuery,
  statusFilter,
  sortValue,
  onSearchChange,
  onStatusFilterChange,
  onSortChange,
  onSelectProject,
  onRequestLoad,
  onRequestDuplicate,
  onRequestDelete,
}: ProjectListProps) {
  return (
    <Box sx={{ display: 'grid', gap: 3 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              我的專案
            </Typography>
            <Typography variant="body2" color="text.secondary">
              快速搜尋歷史專案、繼續編輯或複製既有規劃。
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 1.5,
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr)',
                md: 'minmax(0, 1.4fr) repeat(2, minmax(180px, 0.6fr))',
              },
            }}
          >
            <TextField
              value={searchQuery}
              onChange={event => onSearchChange(event.target.value)}
              placeholder="搜尋專案名稱、地點或活動描述"
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
            <TextField
              select
              label="狀態篩選"
              value={statusFilter}
              onChange={event => onStatusFilterChange(event.target.value as ProjectStatus | 'all')}
            >
              <MenuItem value="all">全部狀態</MenuItem>
              {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField select label="排序方式" value={sortValue} onChange={event => onSortChange(event.target.value)}>
              <MenuItem value="updatedAt:desc">最近更新</MenuItem>
              <MenuItem value="name:asc">名稱 A → Z</MenuItem>
              <MenuItem value="status:asc">狀態</MenuItem>
            </TextField>
          </Box>

          {stats ? (
            <Box
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(4, minmax(0, 1fr))',
                },
              }}
            >
              {[
                { label: '總專案', value: stats.total },
                { label: '草稿', value: stats.byStatus.draft },
                { label: '進行中', value: stats.byStatus.in_progress },
                { label: '已完成', value: stats.byStatus.completed },
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
          ) : null}
        </Stack>
      </Paper>

      {loading ? (
        <Paper variant="outlined" sx={{ p: 5, borderRadius: 4, textAlign: 'center' }}>
          <CircularProgress size={28} />
          <Typography sx={{ mt: 1.5 }} color="text.secondary">
            正在載入專案列表…
          </Typography>
        </Paper>
      ) : projects.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 5, borderRadius: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            尚無符合條件的專案
          </Typography>
          <Typography color="text.secondary">建立第一個活動草稿後，這裡會顯示完整歷史紀錄與快速操作。</Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {projects.map(project => (
            <Card
              key={project.id}
              variant="outlined"
              onClick={() => onSelectProject(project.id)}
              sx={{
                borderRadius: 4,
                cursor: 'pointer',
                borderColor: selectedProjectId === project.id ? 'primary.main' : 'divider',
                boxShadow: selectedProjectId === project.id ? theme => `0 0 0 1px ${theme.palette.primary.main}` : 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme => theme.shadows[3],
                },
              }}
            >
              <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {project.name}
                  </Typography>
                  <Chip size="small" label={PROJECT_STATUS_LABELS[project.status]} color={PROJECT_STATUS_COLOR[project.status]} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {getEventTypeLabel(project.eventInfo.type)} · {getEventScaleLabel(project.eventInfo.scale)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  地點：{project.eventInfo.location || '未設定'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  最後更新：{formatDateTime(project.updatedAt)}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Box>
                  <Tooltip title="載入專案">
                    <IconButton
                      size="small"
                      onClick={event => {
                        event.stopPropagation();
                        onRequestLoad(project);
                      }}
                    >
                      <FolderOpenRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="複製專案">
                    <IconButton
                      size="small"
                      onClick={event => {
                        event.stopPropagation();
                        onRequestDuplicate(project);
                      }}
                    >
                      <ContentCopyRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Tooltip title="刪除專案">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={event => {
                      event.stopPropagation();
                      onRequestDelete(project);
                    }}
                  >
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

export default ProjectList;
