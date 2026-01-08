'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw, MoreHorizontal, FileText, Globe } from 'lucide-react';
import { useProjectStore } from '@/lib/store/projects';
import { useTabStore } from '@/lib/store/tabs';
import { useAuthStore } from '@/lib/store/auth';

export function RecentTasks() {
  const { projects, loadProjects, selectProject } = useProjectStore();
  const { addTab } = useTabStore();
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'tasks' | 'deployed'>('tasks');

  useEffect(() => {
    if (token) {
      loadProjects();
    }
  }, [token, loadProjects]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  const handleTaskClick = async (project: any) => {
    await selectProject(project._id);
    addTab({
      id: `project-${project._id}`,
      title: project.name.slice(0, 20) + (project.name.length > 20 ? '...' : ''),
      type: 'project',
      projectId: project._id,
    });
  };

  return (
    <div 
      className="w-full max-w-5xl mx-auto mt-20 animate-fade-in" 
      style={{ animationDelay: '0.2s' }}
    >
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                activeTab === 'tasks'
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }
            `}
          >
            <FileText className="w-4 h-4" />
            Recent Tasks
          </button>
          <button 
            onClick={() => setActiveTab('deployed')}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              transition-all duration-200
              ${
                activeTab === 'deployed'
                  ? 'text-foreground bg-secondary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }
            `}
          >
            <Globe className="w-4 h-4" />
            Deployed Apps
          </button>
        </div>
        <button 
          onClick={() => loadProjects()}
          className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-secondary/30 border border-border rounded-xl overflow-hidden backdrop-blur-sm">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3.5 border-b border-border/50">
          <div className="col-span-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</div>
          <div className="col-span-7 text-xs font-medium text-muted-foreground uppercase tracking-wider">Task</div>
          <div className="col-span-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Modified</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/50">
          {projects.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground mb-1">No recent tasks</p>
              <p className="text-sm text-muted-foreground/70">Start a new project by entering a prompt above</p>
            </div>
          ) : (
            projects.slice(0, 10).map((project, index) => (
              <div
                key={project._id}
                onClick={() => handleTaskClick(project)}
                className="
                  grid grid-cols-12 gap-4 px-6 py-4
                  hover:bg-secondary/40 cursor-pointer transition-all
                  group
                "
                style={{
                  animationDelay: `${0.3 + index * 0.05}s`,
                }}
              >
                <div className="col-span-2 flex items-center">
                  <span className="text-sm text-muted-foreground font-mono">
                    EMT - {project._id.slice(-6)}
                  </span>
                </div>
                <div className="col-span-7 flex flex-col justify-center">
                  <p className="text-sm font-medium text-foreground mb-0.5">
                    {project.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {project.description || project.prompt}
                  </p>
                </div>
                <div className="col-span-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {formatTimeAgo(project.createdAt)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Show options menu
                    }}
                    className="
                      p-1.5 rounded-lg hover:bg-muted/50 transition-colors
                      opacity-0 group-hover:opacity-100
                    "
                  >
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {projects.length > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="text-sm text-muted-foreground">
            Showing 1-{Math.min(projects.length, 10)} out of {projects.length}
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 rounded-lg bg-secondary text-foreground text-sm font-medium">1</button>
            </div>
            <button className="px-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-sm text-muted-foreground">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
            <div className="ml-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tasks per page:</span>
              <select className="bg-secondary border border-border rounded px-2 py-1 text-xs">
                <option>50</option>
                <option>100</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
