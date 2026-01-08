'use client';

import React, { useState } from 'react';
import { 
  Paperclip, 
  Github, 
  Globe, 
  Mic, 
  ArrowRight,
  ChevronDown,
  Sparkles,
  Layers,
  FileText,
  Smartphone
} from 'lucide-react';
import { useTabStore } from '@/lib/store/tabs';
import { useProjectStore } from '@/lib/store/projects';

const AI_MODELS = [
  { id: 'claude-4.5', name: 'Claude 4.5 Sonnet', icon: '✨' },
  { id: 'gpt-4', name: 'GPT-4 Turbo', icon: '🤖' },
  { id: 'gemini-pro', name: 'Gemini Pro', icon: '💎' },
];

const APP_TYPES = [
  { id: 'fullstack', name: 'Full Stack App', icon: Layers },
  { id: 'landing', name: 'Landing Page', icon: FileText },
  { id: 'mobile', name: 'Mobile App', icon: Smartphone },
];

const EXAMPLE_PROMPTS = [
  'My Counter Part',
  'Bill Generator',
  'Word of the Day',
];

export function PromptInput() {
  const [prompt, setPrompt] = useState('');
  const [selectedAppType, setSelectedAppType] = useState(APP_TYPES[0]);
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const { addTab } = useTabStore();
  const { createProject } = useProjectStore();

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    try {
      const projectName = prompt.slice(0, 30) + (prompt.length > 30 ? '...' : '');
      await createProject(projectName, prompt, prompt);
      
      const tabId = `project-${Date.now()}`;
      addTab({
        id: tabId,
        title: projectName,
        type: 'project',
        projectId: tabId,
      });

      setPrompt('');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(`Build me a clone of ${example}...`);
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
      {/* App Type Selector */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {APP_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedAppType(type)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg
                transition-all duration-200 text-sm font-medium
                ${
                  selectedAppType.id === type.id
                    ? 'bg-secondary text-foreground border border-border'
                    : 'bg-transparent text-muted-foreground hover:bg-secondary/50 border border-transparent'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{type.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Input Card */}
      <div className="bg-secondary/50 border border-border rounded-2xl p-1 backdrop-blur-sm">
        <div className="p-4">
          {/* Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build me a clone of netflix..."
            className="
              w-full bg-transparent text-foreground placeholder:text-muted-foreground
              text-base resize-none outline-none min-h-[100px]
              leading-relaxed
            "
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-border/50">
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            <button 
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5 text-muted-foreground" />
            </button>
            <button 
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              title="Import from GitHub"
            >
              <Github className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Model Selector */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="
                  flex items-center gap-2 px-3 py-2 rounded-lg
                  hover:bg-muted/50 transition-colors text-sm
                "
              >
                <span className="text-base">{selectedModel.icon}</span>
                <span className="text-foreground font-medium">{selectedModel.name}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showModelDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showModelDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowModelDropdown(false)}
                  />
                  <div className="
                    absolute left-0 top-full mt-2 w-56
                    bg-popover border border-border rounded-lg shadow-xl
                    dropdown-enter z-50 py-2
                  ">
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelDropdown(false);
                        }}
                        className={`
                          w-full px-4 py-2.5 flex items-center gap-3 text-left
                          hover:bg-secondary transition-colors text-sm
                          ${selectedModel.id === model.id ? 'bg-secondary' : ''}
                        `}
                      >
                        <span className="text-base">{model.icon}</span>
                        <span>{model.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Public/Private Toggle */}
            <button 
              onClick={() => setIsPublic(!isPublic)}
              className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                hover:bg-muted/50 transition-colors text-sm
              "
            >
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{isPublic ? 'Public' : 'Private'}</span>
            </button>

            {/* Image Upload */}
            <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <svg className="w-5 h-5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>

            {/* Mic Button */}
            <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <Mic className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="
                ml-2 w-10 h-10 rounded-full bg-foreground text-background
                flex items-center justify-center
                hover:bg-foreground/90 transition-all
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:scale-105 active:scale-95
              "
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Example Prompts */}
      <div className="flex items-center justify-center gap-3 mt-6">
        {EXAMPLE_PROMPTS.map((example) => (
          <button
            key={example}
            onClick={() => handleExampleClick(example)}
            className="
              px-4 py-2 rounded-lg
              bg-secondary/30 border border-border/50
              hover:bg-secondary hover:border-border
              transition-all text-sm text-muted-foreground hover:text-foreground
            "
          >
            <span className="font-pixel">{example}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
