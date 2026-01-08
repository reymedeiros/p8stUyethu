'use client';

import React from 'react';
import { X, LayoutGrid } from 'lucide-react';
import { useTabStore, Tab } from '@/lib/store/tabs';

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useTabStore();

  return (
    <div className="flex items-center gap-1 px-2 h-full">
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onActivate={() => setActiveTab(tab.id)}
          onClose={() => removeTab(tab.id)}
        />
      ))}
    </div>
  );
}

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
}

function TabItem({ tab, isActive, onActivate, onClose }: TabItemProps) {
  const isHome = tab.type === 'home';

  return (
    <div
      onClick={onActivate}
      className={`
        group relative flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer
        transition-all duration-200 min-w-[120px] max-w-[200px]
        ${isActive 
          ? 'bg-secondary border-b-2 border-foreground' 
          : 'hover:bg-secondary/50 border-b-2 border-transparent'
        }
      `}
    >
      {isHome ? (
        <LayoutGrid className="w-4 h-4 flex-shrink-0" />
      ) : (
        <div className="w-2 h-2 rounded-full bg-cyan flex-shrink-0 animate-pulse" />
      )}
      
      <span className="text-sm truncate">
        {tab.title}
      </span>

      {!isHome && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="
            ml-auto opacity-0 group-hover:opacity-100
            p-1 rounded hover:bg-muted transition-all
          "
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
