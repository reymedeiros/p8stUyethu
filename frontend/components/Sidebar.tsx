'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/lib/store/projects';
import { useAuthStore } from '@/lib/store/auth';
import { FolderOpen, Plus, Trash2, LogOut, Users, Settings } from 'lucide-react';

export function Sidebar() {
  const { projects, loadProjects, selectProject, currentProject, deleteProject } = useProjectStore();
  const { logout, user, token } = useAuthStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [newProjectData, setNewProjectData] = useState({
    name: '',
    description: '',
    prompt: '',
  });

  useEffect(() => {
    if (token) {
      loadProjects();
    }
  }, [token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await useProjectStore.getState().createProject(
        newProjectData.name,
        newProjectData.description,
        newProjectData.prompt
      );
      setShowNewProject(false);
      setNewProjectData({ name: '', description: '', prompt: '' });
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  return (
    <>
      <div className="w-64 bg-secondary border-r border-border flex flex-col h-screen">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Projects</h2>
            <button
              onClick={() => setShowNewProject(true)}
              className="p-1.5 hover:bg-accent rounded transition"
              title="New Project"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {projects.map((project) => (
            <div
              key={project._id}
              onClick={() => selectProject(project._id)}
              className={`p-3 rounded cursor-pointer mb-1 group hover:bg-accent transition ${
                currentProject?._id === project._id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm font-medium truncate">{project.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project._id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-background rounded transition"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={() => setShowProviderSettings(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded transition text-sm"
          >
            <Settings className="w-4 h-4" />
            Providers
          </button>
          {user?.isAdmin && (
            <button
              onClick={() => setShowUserManagement(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 rounded transition text-sm"
            >
              <Users className="w-4 h-4" />
              Manage Users
            </button>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-muted hover:bg-accent rounded transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {showNewProject && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-secondary p-6 rounded-lg w-96 border border-border">
              <h3 className="text-lg font-semibold mb-4">New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newProjectData.name}
                    onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <input
                    type="text"
                    value={newProjectData.description}
                    onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prompt</label>
                  <textarea
                    value={newProjectData.prompt}
                    onChange={(e) => setNewProjectData({ ...newProjectData, prompt: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary h-24"
                    required
                    placeholder="Describe what you want to build..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewProject(false)}
                    className="flex-1 px-4 py-2 bg-muted rounded hover:bg-accent transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {showUserManagement && user?.isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg w-full max-w-3xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-semibold">User Management</h2>
              <button
                onClick={() => setShowUserManagement(false)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              {/* We'll dynamically import UserManagement component */}
              <UserManagementContent />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Dynamic content component to avoid circular dependencies
function UserManagementContent() {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    import('./UserManagement').then((mod) => {
      setComponent(() => mod.UserManagement);
    });
  }, []);

  if (!Component) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return <Component />;
}