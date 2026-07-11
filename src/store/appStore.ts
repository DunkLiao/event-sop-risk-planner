import { create } from 'zustand';
import { storageService } from '../services/storage/storageService';
import { EventFormData, EventInfo, SOPDocument } from '../types/event';
import { RiskAssessment } from '../types/risk';
import { Project, ProjectFilter, ProjectStats, ProjectStatus } from '../types/settings';
import {
  buildDraftEventInfo,
  DEFAULT_EVENT_FORM_VALUES,
  getProjectNameFromState,
  hasProjectContent,
  mapEventToFormData,
} from '../utils/project';

interface AppState {
  // ���ʪ���Z
  eventFormData: EventFormData | null;
  setEventFormData: (formData: EventFormData | null) => void;

  // ��e�s�誺���ʸ�T
  currentEvent: EventInfo | null;
  setCurrentEvent: (event: EventInfo | null) => void;

  // �ͦ��� SOP ���
  sopDocument: SOPDocument | null;
  setSopDocument: (sop: SOPDocument | null) => void;

  // �ͦ������I����
  riskAssessment: RiskAssessment | null;
  setRiskAssessment: (risk: RiskAssessment | null) => void;

  // UI ���A
  currentStep: number;
  setCurrentStep: (step: number) => void;

  // ���J���A
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;

  // �M�׺޲z
  projectList: Project[];
  projectStats: ProjectStats | null;
  currentProjectId: string | null;
  isProjectListLoading: boolean;
  projectHydrationKey: number;
  projectSaveState: 'idle' | 'saving' | 'saved' | 'error';
  projectSaveError: string | null;
  loadProjectList: (filter?: ProjectFilter) => Promise<void>;
  loadProject: (id: string) => Promise<Project | null>;
  saveCurrentProject: (options?: { status?: ProjectStatus }) => Promise<Project | null>;
  createNewProject: () => void;
  deleteProject: (id: string) => Promise<void>;
  duplicateProject: (id: string, newName: string) => Promise<Project>;
  updateProjectStatus: (id: string, status: ProjectStatus) => Promise<Project>;

  // ���~���A
  error: string | null;
  setError: (error: string | null) => void;

  // �M���Ҧ����A
  reset: () => void;
}

const sortProjectsByUpdatedAt = (projects: Project[]): Project[] =>
  [...projects].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

const upsertProject = (projects: Project[], project: Project): Project[] => {
  const nextProjects = projects.filter(item => item.id !== project.id);
  nextProjects.unshift(project);
  return sortProjectsByUpdatedAt(nextProjects);
};

export const useAppStore = create<AppState>((set, get) => ({
  eventFormData: null,
  setEventFormData: formData => set({ eventFormData: formData }),

  currentEvent: null,
  setCurrentEvent: event => set({ currentEvent: event }),

  sopDocument: null,
  setSopDocument: sop => set({ sopDocument: sop }),

  riskAssessment: null,
  setRiskAssessment: risk => set({ riskAssessment: risk }),

  currentStep: 0,
  setCurrentStep: step => set({ currentStep: step }),

  isGenerating: false,
  setIsGenerating: loading => set({ isGenerating: loading }),

  projectList: [],
  projectStats: null,
  currentProjectId: null,
  isProjectListLoading: false,
  projectHydrationKey: 0,
  projectSaveState: 'idle',
  projectSaveError: null,
  loadProjectList: async filter => {
    set({ isProjectListLoading: true });

    try {
      const [projectList, projectStats] = await Promise.all([
        storageService.listProjects(filter),
        storageService.getProjectStats(),
      ]);

      set({
        projectList,
        projectStats,
        isProjectListLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '���J�M�צC����ѡC',
        isProjectListLoading: false,
      });
    }
  },
  loadProject: async id => {
    try {
      const project = await storageService.getProjectById(id);

      if (!project) {
        set({ error: '�䤣����w�M�סC' });
        return null;
      }

      set(state => ({
        currentProjectId: project.id,
        currentEvent: project.eventInfo,
        eventFormData: mapEventToFormData(project.eventInfo),
        sopDocument: project.sopDocument ?? null,
        riskAssessment: project.riskAssessment ?? null,
        currentStep: project.formProgress?.currentStep ?? 0,
        projectSaveState: 'saved',
        projectSaveError: null,
        error: null,
        projectHydrationKey: state.projectHydrationKey + 1,
      }));

      return project;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '���J�M�ץ��ѡC',
      });
      return null;
    }
  },
  saveCurrentProject: async options => {
    const state = get();
    const draftValues = state.eventFormData ?? DEFAULT_EVENT_FORM_VALUES;

    if (!hasProjectContent(draftValues) && !state.currentProjectId && !state.sopDocument && !state.riskAssessment) {
      return null;
    }

    set({
      projectSaveState: 'saving',
      projectSaveError: null,
    });

    try {
      const existingProject = state.currentProjectId
        ? state.projectList.find(project => project.id === state.currentProjectId) ?? null
        : null;
      const eventId = state.currentProjectId ?? state.currentEvent?.id;
      const eventInfo = buildDraftEventInfo(draftValues, state.currentEvent, eventId ?? undefined);
      const status = options?.status ?? existingProject?.status ?? (state.currentProjectId ? 'in_progress' : 'draft');
      const project: Project = {
        id: eventInfo.id,
        name: getProjectNameFromState(draftValues, state.currentEvent),
        eventInfo,
        sopDocument: state.sopDocument ?? undefined,
        riskAssessment: state.riskAssessment ?? undefined,
        formProgress: {
          currentStep: state.currentStep,
        },
        createdAt: existingProject?.createdAt ?? eventInfo.createdAt,
        updatedAt: eventInfo.updatedAt,
        status,
      };

      await storageService.saveProject(project);
      const refreshedStats = await storageService.getProjectStats();

      set(currentState => ({
        currentProjectId: project.id,
        currentEvent: project.eventInfo,
        projectList: upsertProject(currentState.projectList, project),
        projectStats: refreshedStats,
        projectSaveState: 'saved',
        projectSaveError: null,
        error: null,
      }));

      return project;
    } catch (error) {
      set({
        projectSaveState: 'error',
        projectSaveError: error instanceof Error ? error.message : '�x�s�M�ץ��ѡC',
        error: error instanceof Error ? error.message : '�x�s�M�ץ��ѡC',
      });
      return null;
    }
  },
  createNewProject: () =>
    set(state => ({
      eventFormData: DEFAULT_EVENT_FORM_VALUES,
      currentEvent: null,
      sopDocument: null,
      riskAssessment: null,
      currentProjectId: null,
      currentStep: 0,
      error: null,
      projectSaveState: 'idle',
      projectSaveError: null,
      projectHydrationKey: state.projectHydrationKey + 1,
    })),
  deleteProject: async id => {
    try {
      await storageService.deleteProject(id);
      const refreshedStats = await storageService.getProjectStats();

      set(state => {
        const nextState: Partial<AppState> = {
          projectList: state.projectList.filter(project => project.id !== id),
          projectStats: refreshedStats,
        };

        if (state.currentProjectId === id) {
          nextState.currentProjectId = null;
          nextState.currentEvent = null;
          nextState.eventFormData = DEFAULT_EVENT_FORM_VALUES;
          nextState.sopDocument = null;
          nextState.riskAssessment = null;
          nextState.projectSaveState = 'idle';
          nextState.projectSaveError = null;
          nextState.projectHydrationKey = state.projectHydrationKey + 1;
        }

        return nextState as AppState;
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '�R���M�ץ��ѡC',
      });
    }
  },
  duplicateProject: async (id, newName) => {
    const duplicatedProject = await storageService.duplicateProject(id, newName);
    const refreshedStats = await storageService.getProjectStats();

    set(state => ({
      projectList: upsertProject(state.projectList, duplicatedProject),
      projectStats: refreshedStats,
      error: null,
    }));

    return duplicatedProject;
  },
  updateProjectStatus: async (id, status) => {
    const updatedProject = await storageService.updateProjectStatus(id, status);
    const refreshedStats = await storageService.getProjectStats();

    set(state => {
      const nextState: Partial<AppState> = {
        projectList: upsertProject(state.projectList, updatedProject),
        projectStats: refreshedStats,
        error: null,
      };

      if (state.currentProjectId === id) {
        nextState.currentEvent = updatedProject.eventInfo;
        nextState.projectSaveState = 'saved';
      }

      return nextState as AppState;
    });

    return updatedProject;
  },

  error: null,
  setError: error => set({ error }),

  reset: () =>
    set({
      eventFormData: null,
      currentEvent: null,
      sopDocument: null,
      riskAssessment: null,
      currentStep: 0,
      isGenerating: false,
      projectList: [],
      projectStats: null,
      currentProjectId: null,
      isProjectListLoading: false,
      projectHydrationKey: 0,
      projectSaveState: 'idle',
      projectSaveError: null,
      error: null,
    }),
}));
