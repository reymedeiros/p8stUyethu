'use client';

import { useEffect, useRef } from 'react';
import { useProjectStore } from '@/lib/store/projects';
import MonacoEditor from '@monaco-editor/react';
import { FileTree } from './FileTree';

export function Editor() {
  const { selectedFile, updateFileContent, currentProject } = useProjectStore();
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  function handleEditorChange(value: string | undefined) {
    if (selectedFile && value !== undefined) {
      updateFileContent(selectedFile.path, value);
    }
  }

  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return languageMap[ext || ''] || 'plaintext';
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No project selected</p>
          <p className="text-sm">Create or select a project to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-border overflow-y-auto">
        <div className="p-3 border-b border-border">
          <h3 className="text-sm font-semibold">Files</h3>
        </div>
        <FileTree />
      </div>
      <div className="flex-1">
        {selectedFile ? (
          <div className="h-full flex flex-col">
            <div className="px-4 py-2 border-b border-border bg-secondary">
              <p className="text-sm font-mono">{selectedFile.path}</p>
            </div>
            <div className="flex-1">
              <MonacoEditor
                height="100%"
                language={getLanguage(selectedFile.path)}
                value={selectedFile.content}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderWhitespace: 'selection',
                  tabSize: 2,
                  wordWrap: 'on',
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a file to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}