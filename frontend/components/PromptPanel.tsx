'use client';

import { useState } from 'react';
import { useProjectStore } from '@/lib/store/projects';
import { useLogsStore } from '@/lib/store/logs';
import { Play, Loader2 } from 'lucide-react';

export function PromptPanel() {
  const [prompt, setPrompt] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const { currentProject } = useProjectStore();
  const { addLog } = useLogsStore();

  const handleBuild = async () => {
    if (!currentProject || !prompt.trim()) return;

    setIsBuilding(true);
    addLog('info', 'Starting build...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const wsUrl = apiUrl.replace('http', 'ws');
      const token = localStorage.getItem('token');

      const ws = new WebSocket(`${wsUrl}/api/build/${currentProject._id}`);

      ws.onopen = () => {
        addLog('info', 'Connected to build service');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'status':
            case 'progress':
              addLog('info', data.message);
              break;
            case 'complete':
              addLog('success', 'Build completed!');
              setIsBuilding(false);
              setPrompt('');
              break;
            case 'error':
              addLog('error', data.message);
              setIsBuilding(false);
              break;
          }
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      ws.onerror = (error) => {
        addLog('error', 'WebSocket error');
        setIsBuilding(false);
      };

      ws.onclose = () => {
        addLog('info', 'Connection closed');
        setIsBuilding(false);
      };
    } catch (error: any) {
      addLog('error', error.message);
      setIsBuilding(false);
    }
  };

  return (
    <div className="border-b border-border p-4">
      <h3 className="text-sm font-semibold mb-3">AI Builder</h3>
      <div className="space-y-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to build..."
          className="w-full px-3 py-2 bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary text-sm h-24 resize-none"
          disabled={isBuilding || !currentProject}
        />
        <button
          onClick={handleBuild}
          disabled={isBuilding || !currentProject || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isBuilding ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Building...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Build
            </>
          )}
        </button>
      </div>
      {!currentProject && (
        <p className="text-xs text-muted-foreground mt-2">
          Select or create a project first
        </p>
      )}
    </div>
  );
}