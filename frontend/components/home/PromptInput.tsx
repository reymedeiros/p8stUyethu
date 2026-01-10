'use client';

import React, { useState } from 'react';
import { 
  Paperclip, 
  Github, 
  Globe, 
  Mic, 
  ArrowRight,
  ChevronDown,
  Layers,
  FileText,
  Smartphone
} from 'lucide-react';
import { useTabStore } from '@/lib/store/tabs';
import { useProjectStore } from '@/lib/store/projects';
import { emergentColors } from '@/lib/design-tokens';

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
      
      // Create the project
      const response = await createProject(projectName, prompt, prompt);
      
      // Get the created project ID from the response
      const newProjectId = response._id;
      
      // Open a new tab for the project execution view
      const tabId = `project-${newProjectId}`;
      addTab({
        id: tabId,
        title: projectName,
        type: 'project',
        projectId: newProjectId,
      });

      setPrompt('');
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
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
              `}
              style={{
                backgroundColor: selectedAppType.id === type.id ? emergentColors.secondary : 'transparent',
                color: selectedAppType.id === type.id ? emergentColors.foreground : emergentColors.mutedForeground,
                border: `1px solid ${selectedAppType.id === type.id ? emergentColors.border : 'transparent'}`,
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{type.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Input Card */}
      <div 
        className="rounded-2xl p-1 backdrop-blur-sm"
        style={{
          backgroundColor: `${emergentColors.secondary}80`,
          border: `1px solid ${emergentColors.border}`,
        }}
      >
        <div className="p-4">
          {/* Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Build me a clone of netflix..."
            className="w-full bg-transparent placeholder:text-white/50 text-base resize-none outline-none min-h-[100px] leading-relaxed"
            style={{ color: emergentColors.foreground }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
        </div>

        {/* Bottom Row */}
        <div 
          className="flex items-center justify-between px-4 pb-4 pt-2"
          style={{ borderTop: `1px solid ${emergentColors.border}50` }}
        >
          {/* Left Actions */}
          <div className="flex items-center gap-1">
            <button 
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" style={{ color: emergentColors.mutedForeground }} />
            </button>
            <button 
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title="Import from GitHub"
            >
              <Github className="w-5 h-5" style={{ color: emergentColors.mutedForeground }} />
            </button>

            {/* Model Selector */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
              >
                <span className="text-base">{selectedModel.icon}</span>
                <span style={{ color: emergentColors.foreground }} className="font-medium">{selectedModel.name}</span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${showModelDropdown ? 'rotate-180' : ''}`}
                  style={{ color: emergentColors.mutedForeground }}
                />
              </button>

              {showModelDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowModelDropdown(false)}
                  />
                  <div 
                    className="absolute left-0 top-full mt-2 w-56 rounded-lg shadow-xl dropdown-enter z-50 py-2"
                    style={{
                      backgroundColor: emergentColors.secondary,
                      border: `1px solid ${emergentColors.border}`,
                    }}
                  >
                    {AI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model);
                          setShowModelDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors text-sm"
                        style={{
                          backgroundColor: selectedModel.id === model.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                        }}
                      >
                        <span className="text-base">{model.icon}</span>
                        <span style={{ color: emergentColors.foreground }}>{model.name}</span>
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
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
            >
              <Globe className="w-4 h-4" style={{ color: emergentColors.mutedForeground }} />
              <span style={{ color: emergentColors.foreground }}>{isPublic ? 'Public' : 'Private'}</span>
            </button>

            {/* Mic Button */}
            <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Mic className="w-5 h-5" style={{ color: emergentColors.mutedForeground }} />
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim()}
              className="ml-2 w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ backgroundColor: emergentColors.foreground }}
            >
              <ArrowRight className="w-5 h-5" style={{ color: emergentColors.background }} />
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
            className="px-4 py-2 rounded-lg transition-all text-sm hover:bg-white/5"
            style={{
              backgroundColor: `${emergentColors.secondary}30`,
              border: `1px solid ${emergentColors.border}50`,
              color: emergentColors.mutedForeground,
            }}
          >
            <span className="font-pixel">{example}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
