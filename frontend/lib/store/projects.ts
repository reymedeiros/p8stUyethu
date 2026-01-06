import { create } from 'zustand';
import { projectsAPI, filesAPI } from '../api';

interface Project {
  _id: string;
  name: string;
  description: string;
  prompt: string;
  status: string;
  createdAt: string;
}

interface VirtualFile {
  id: string;
  path: string;
  content: string;
  version: number;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  files: VirtualFile[];
  selectedFile: VirtualFile | null;
  isLoading: boolean;
  
  loadProjects: () => Promise<void>;
  createProject: (name: string, description: string, prompt: string) => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  loadFiles: (projectId: string) => Promise<void>;
  selectFile: (file: VirtualFile) => void;
  updateFileContent: (path: string, content: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  files: [],
  selectedFile: null,
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const response = await projectsAPI.list();
      set({ projects: response.data.projects, isLoading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ isLoading: false });
    }
  },

  createProject: async (name: string, description: string, prompt: string) => {
    try {
      const response = await projectsAPI.create(name, description, prompt);
      const newProject = response.data.project;
      set((state) => ({ projects: [newProject, ...state.projects] }));
      await get().selectProject(newProject._id);
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  selectProject: async (id: string) => {
    try {
      const response = await projectsAPI.get(id);
      const project = response.data.project;
      set({ currentProject: project });
      await get().loadFiles(id);
    } catch (error) {
      console.error('Failed to select project:', error);
    }
  },

  deleteProject: async (id: string) => {
    try {
      await projectsAPI.delete(id);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
        files: state.currentProject?._id === id ? [] : state.files,
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  },

  loadFiles: async (projectId: string) => {
    try {
      const response = await filesAPI.list(projectId);
      set({ files: response.data.files });
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  },

  selectFile: (file: VirtualFile) => {
    set({ selectedFile: file });
  },

  updateFileContent: (path: string, content: string) => {
    set((state) => ({
      files: state.files.map((f) =>
        f.path === path ? { ...f, content } : f
      ),
      selectedFile:
        state.selectedFile?.path === path
          ? { ...state.selectedFile, content }
          : state.selectedFile,
    }));
  },
}));