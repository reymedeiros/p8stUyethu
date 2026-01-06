interface FileEntry {
  path: string;
}

'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/lib/store/projects';
import { File, Folder, ChevronRight, ChevronDown } from 'lucide-react';

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

function buildFileTree(files: FileEntry[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];
  const map = new Map<string, FileTreeNode>();

  files.forEach((file) => {
    const parts: string[] = file.path.split('/');
    let currentPath = '';

    parts.forEach((part, index) => {
      const previousPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;

      if (!map.has(currentPath)) {
        const node: FileTreeNode = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: isLast ? undefined : [],
        };

        map.set(currentPath, node);

        if (previousPath) {
          const parent = map.get(previousPath);
          if (parent?.children) {
            parent.children.push(node);
          }
        } else {
          root.push(node);
        }
      }
    });
  });

  return root;
}

function FileTreeItem({ node, onSelect }: { node: FileTreeNode; onSelect: (path: string) => void }) {
  const [expanded, setExpanded] = useState(true);

  if (!node.isDirectory) {
    return (
      <div
        onClick={() => onSelect(node.path)}
        className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer text-sm"
      >
        <File className="w-4 h-4 text-muted-foreground" />
        <span>{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 py-1 px-2 hover:bg-accent rounded cursor-pointer text-sm"
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <Folder className="w-4 h-4 text-primary" />
        <span>{node.name}</span>
      </div>
      {expanded && node.children && (
        <div className="ml-4">
          {node.children.map((child) => (
            <FileTreeItem key={child.path} node={child} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const { files, selectFile } = useProjectStore();
  const [tree, setTree] = useState<FileTreeNode[]>([]);

  useEffect(() => {
    if (files.length > 0) {
      setTree(buildFileTree(files));
    } else {
      setTree([]);
    }
  }, [files]);

  const handleSelect = (path: string) => {
    const file = files.find((f) => f.path === path);
    if (file) {
      selectFile(file);
    }
  };

  if (tree.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        No files yet. Generate some code!
      </div>
    );
  }

  return (
    <div className="p-2">
      {tree.map((node) => (
        <FileTreeItem key={node.path} node={node} onSelect={handleSelect} />
      ))}
    </div>
  );
}