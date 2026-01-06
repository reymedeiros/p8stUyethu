'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Editor } from '@/components/Editor';
import { PromptPanel } from '@/components/PromptPanel';
import { LogsPanel } from '@/components/LogsPanel';
import { useAuthStore } from '@/lib/store/auth';
import { LoginForm } from '@/components/LoginForm';

export default function Home() {
  const { token, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!token) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            <Editor />
          </div>
          <div className="w-[400px] border-l border-border flex flex-col">
            <PromptPanel />
            <LogsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}