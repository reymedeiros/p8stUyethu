'use client';

import { useEffect, useRef } from 'react';
import { useLogsStore } from '@/lib/store/logs';
import { Terminal, X } from 'lucide-react';

export function LogsPanel() {
  const { logs, clearLogs } = useLogsStore();
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-muted-foreground';
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <h3 className="text-sm font-semibold">Logs</h3>
        </div>
        {logs.length > 0 && (
          <button
            onClick={clearLogs}
            className="p-1 hover:bg-accent rounded transition"
            title="Clear logs"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1">
        {logs.length === 0 ? (
          <div className="text-muted-foreground">No logs yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-muted-foreground">{formatTime(log.timestamp)}</span>
              <span className={getLevelColor(log.level)}>[{log.level.toUpperCase()}]</span>
              <span className="flex-1">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}