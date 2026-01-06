import { create } from 'zustand';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface LogsState {
  logs: LogEntry[];
  addLog: (level: LogEntry['level'], message: string) => void;
  clearLogs: () => void;
}

export const useLogsStore = create<LogsState>((set) => ({
  logs: [],
  
  addLog: (level, message) => {
    set((state) => ({
      logs: [...state.logs, { timestamp: new Date(), level, message }],
    }));
  },
  
  clearLogs: () => set({ logs: [] }),
}));