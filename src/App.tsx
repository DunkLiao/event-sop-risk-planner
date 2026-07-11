import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Drawer,
  Link,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Toolbar,
  Typography,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useEffect, useMemo, useState } from 'react';
import EventForm from './components/EventForm';
import DeleteProjectDialog from './components/ProjectList/DeleteProjectDialog';
import DuplicateProjectDialog from './components/ProjectList/DuplicateProjectDialog';
import LoadProjectDialog from './components/ProjectList/LoadProjectDialog';
import ProjectDetail from './components/ProjectList/ProjectDetail';
import SaveProjectAsTemplateDialog from './components/ProjectList/SaveProjectAsTemplateDialog';
import ProjectList from './components/ProjectList/ProjectList';
import TemplateManager from './components/TemplateManager/TemplateManager';
import TemplatePickerDialog from './components/TemplateManager/TemplatePickerDialog';
import { storageService } from './services/storage/storageService';
import { useAppStore } from './store/appStore';
import type { Project, ProjectStatus } from './types/settings';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f4f7fb',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Microsoft JhengHei"',
      '"Microsoft YaHei"',
    ].join(','),
  },
});

type AppView = 'editor' | 'projects' | 'templates';
type SortSelection = 'updatedAt:desc' | 'name:asc' | 'status:asc';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('editor');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [sortValue, setSortValue] = useState<SortSelection>('updatedAt:desc');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loadDialogProject, setLoadDialogProject] = useState<Project | null>(null);
  const [deleteDialogProject, setDeleteDialogProject] = useState<Project | null>(null);
  const [duplicateDialogProject, setDuplicateDialogProject] = useState<Project | null>(null);
  const [templateDialogProject, setTemplateDialogProject] = useState<Project | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const projectList = useAppStore(state => state.projectList);
  const projectStats = useAppStore(state => state.projectStats);
  const currentProjectId = useAppStore(state => state.currentProjectId);
  const isProjectListLoading = useAppStore(state => state.isProjectListLoading);
  const error = useAppStore(state => state.error);
  const loadProjectList = useAppStore(state => state.loadProjectList);
  const loadProject = useAppStore(state => state.loadProject);
  const createNewProject = useAppStore(state => state.createNewProject);
  const deleteProject = useAppStore(state => state.deleteProject);
  const duplicateProject = useAppStore(state => state.duplicateProject);
  const updateProjectStatus = useAppStore(state => state.updateProjectStatus);

  const [sortBy, sortDirection] = sortValue.split(':') as ['updatedAt' | 'name' | 'status', 'asc' | 'desc'];

  useEffect(() => {
    void loadProjectList({
      search: searchQuery,
      status: statusFilter,
      sortBy,
      sortDirection,
    });
  }, [loadProjectList, searchQuery, sortBy, sortDirection, statusFilter]);

  useEffect(() => {
    if (projectList.length === 0) {
      setSelectedProjectId(null);
      return;
    }

    if (!selectedProjectId || !projectList.some(project => project.id === selectedProjectId)) {
      setSelectedProjectId(projectList[0]?.id ?? null);
    }
  }, [projectList, selectedProjectId]);

  const selectedProject = useMemo(
    () => projectList.find(project => project.id === selectedProjectId) ?? null,
    [projectList, selectedProjectId]
  );

  const currentProjectName = useMemo(
    () => projectList.find(project => project.id === currentProjectId)?.name ?? '專案編輯',
    [currentProjectId, projectList]
  );

  const handleProjectExport = async (project: Project) => {
    const dialogResult = await storageService.showSaveDialog({
      title: '匯出專案',
      defaultPath: `${project.name}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });

    if (!dialogResult.canceled && dialogResult.filePath) {
      await storageService.exportProject(project, dialogResult.filePath);
    }
  };

  const handleConfirmLoad = async () => {
    if (!loadDialogProject) {
      return;
    }

    setDialogLoading(true);
    try {
      await loadProject(loadDialogProject.id);
      setCurrentView('editor');
      setDrawerOpen(false);
      setLoadDialogProject(null);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogProject) {
      return;
    }

    setDialogLoading(true);
    try {
      await deleteProject(deleteDialogProject.id);
      setDeleteDialogProject(null);
    } finally {
      setDialogLoading(false);
    }
  };

  const handleConfirmDuplicate = async (newName: string) => {
    if (!duplicateDialogProject) {
      return;
    }

    setDialogLoading(true);
    try {
      const duplicatedProject = await duplicateProject(duplicateDialogProject.id, newName);
      setSelectedProjectId(duplicatedProject.id);
      setDuplicateDialogProject(null);
    } finally {
      setDialogLoading(false);
    }
  };

  const refreshProjectList = async () => {
    await loadProjectList({
      search: searchQuery,
      status: statusFilter,
      sortBy,
      sortDirection,
    });
  };

  const handleProjectCreatedFromTemplate = async (project: Project) => {
    await refreshProjectList();
    setSelectedProjectId(project.id);
    await loadProject(project.id);
    setCurrentView('editor');
    setDrawerOpen(false);
    setTemplatePickerOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Button color="inherit" startIcon={<MenuRoundedIcon />} onClick={() => setDrawerOpen(true)} sx={{ mr: 2 }}>
              導航
            </Button>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              活動 SOP 與風險規劃生成器
            </Typography>
            <Button
              color="inherit"
              startIcon={<FolderRoundedIcon />}
              onClick={() => {
                setCurrentView('projects');
                setDrawerOpen(false);
              }}
            >
              我的專案
            </Button>
            <Button
              color="inherit"
              startIcon={<AutoAwesomeRoundedIcon />}
              onClick={() => {
                setCurrentView('templates');
                setDrawerOpen(false);
              }}
            >
              範本管理
            </Button>
          </Toolbar>
        </AppBar>
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 280, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              專案導航
            </Typography>
            <List>
              <ListItemButton
                selected={currentView === 'editor'}
                onClick={() => {
                  setCurrentView('editor');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <HomeRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="專案編輯" secondary="回到目前編輯中的內容" />
              </ListItemButton>
              <ListItemButton
                selected={currentView === 'projects'}
                onClick={() => {
                  setCurrentView('projects');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <FolderRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="我的專案" secondary="瀏覽專案歷史與快速操作" />
              </ListItemButton>
              <ListItemButton
                selected={currentView === 'templates'}
                onClick={() => {
                  setCurrentView('templates');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <AutoAwesomeRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="範本管理" secondary="管理預設與自訂範本" />
              </ListItemButton>
              <ListItemButton
                onClick={() => {
                  createNewProject();
                  setCurrentView('editor');
                  setDrawerOpen(false);
                }}
              >
                <ListItemIcon>
                  <AddRoundedIcon />
                </ListItemIcon>
                <ListItemText primary="建立新專案" secondary="從空白草稿開始" />
              </ListItemButton>
            </List>
          </Box>
        </Drawer>
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, flex: 1 }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                border: themeValue => `1px solid ${themeValue.palette.divider}`,
                background: themeValue =>
                  `linear-gradient(135deg, ${themeValue.palette.primary.main}12 0%, ${themeValue.palette.background.paper} 70%)`,
              }}
            >
              <Typography variant="overline" component="span" color="primary.main" sx={{ fontWeight: 700 }}>
                 {currentView === 'projects'
                   ? 'Project History Workspace'
                   : currentView === 'templates'
                     ? 'Template Library Workspace'
                     : 'Event Planning Workspace'}
              </Typography>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                 {currentView === 'projects'
                   ? '管理你的專案歷史紀錄'
                   : currentView === 'templates'
                     ? '建立並管理你的活動範本'
                     : '建立你的活動規劃基礎資料'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
                 {currentView === 'projects'
                   ? '集中檢視專案歷史、搜尋草稿與已完成規劃，並快速載入、複製或匯出專案。'
                   : currentView === 'templates'
                     ? '管理內建預設範本與自訂範本，快速從範本建立新專案或分享給團隊。'
                     : '透過一致的欄位收集活動需求，先完成主要輸入表單，再逐步生成活動 SOP、時程與風險評估內容。'}
              </Typography>
            </Paper>

            <Breadcrumbs aria-label="breadcrumb">
              <Link
                component="button"
                type="button"
                underline="hover"
                color="inherit"
                onClick={() => setCurrentView('projects')}
              >
                {currentView === 'templates' ? '範本中心' : '專案列表'}
              </Link>
              <Typography color="text.primary">
                {currentView === 'projects' ? '專案管理' : currentView === 'templates' ? '範本管理' : currentProjectName}
              </Typography>
            </Breadcrumbs>

            {error ? (
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, bgcolor: '#fff5f5', color: 'error.main' }}>
                <Typography sx={{ fontWeight: 600 }}>{error}</Typography>
              </Paper>
            ) : null}

            {currentView === 'projects' ? (
              <Box
                sx={{
                  display: 'grid',
                  gap: 3,
                  gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)',
                    xl: 'minmax(0, 1.5fr) minmax(360px, 0.9fr)',
                  },
                }}
              >
                <ProjectList
                  projects={projectList}
                  stats={projectStats}
                  selectedProjectId={selectedProjectId}
                  loading={isProjectListLoading}
                  searchQuery={searchQuery}
                  statusFilter={statusFilter}
                  sortValue={sortValue}
                  onSearchChange={setSearchQuery}
                  onStatusFilterChange={setStatusFilter}
                  onSortChange={value => setSortValue(value as SortSelection)}
                  onSelectProject={setSelectedProjectId}
                  onRequestLoad={setLoadDialogProject}
                  onRequestDuplicate={setDuplicateDialogProject}
                  onRequestDelete={setDeleteDialogProject}
                />
                <ProjectDetail
                  project={selectedProject}
                  onEdit={project => setLoadDialogProject(project)}
                  onExport={project => void handleProjectExport(project)}
                  onDelete={project => setDeleteDialogProject(project)}
                  onStatusChange={(project, status) => void updateProjectStatus(project.id, status)}
                  onSaveAsTemplate={project => setTemplateDialogProject(project)}
                />
              </Box>
            ) : currentView === 'templates' ? (
              <TemplateManager onProjectCreated={handleProjectCreatedFromTemplate} />
            ) : (
              <EventForm onOpenTemplatePicker={() => setTemplatePickerOpen(true)} />
            )}
          </Box>
        </Container>
      </Box>

      <LoadProjectDialog
        open={Boolean(loadDialogProject)}
        project={loadDialogProject}
        loading={dialogLoading}
        onClose={() => setLoadDialogProject(null)}
        onConfirm={() => void handleConfirmLoad()}
      />
      <DeleteProjectDialog
        open={Boolean(deleteDialogProject)}
        project={deleteDialogProject}
        loading={dialogLoading}
        onClose={() => setDeleteDialogProject(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
      <DuplicateProjectDialog
        open={Boolean(duplicateDialogProject)}
        project={duplicateDialogProject}
        loading={dialogLoading}
        onClose={() => setDuplicateDialogProject(null)}
        onConfirm={newName => void handleConfirmDuplicate(newName)}
      />
    </ThemeProvider>
  );
}

export default App;
