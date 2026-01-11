'use client';

import React, { useState, useEffect } from 'react';
import { 
  Paperclip, 
  Github, 
  Globe, 
  Mic, 
  ArrowRight,
  ChevronDown,
  Layers,
  FileText,
  Smartphone,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useTabStore } from '@/lib/store/tabs';
import { useProjectStore } from '@/lib/store/projects';
import { emergentColors } from '@/lib/design-tokens';
import { providerApi, ProviderConfig } from '@/lib/providerApi';

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
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const { addTab } = useTabStore();
  const { createProject } = useProjectStore();

  // Load providers on mount
  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      setLoadingProviders(true);
      setProvidersError(null);
      const configs = await providerApi.getProviderConfigs();
      
      // Filter to only enabled providers
      const enabledProviders = configs.filter(p => p.enabled);
      setProviders(enabledProviders);
      
      // Select primary provider by default, or first available
      const primary = enabledProviders.find(p => p.isPrimary);
      setSelectedProvider(primary || enabledProviders[0] || null);
    } catch (error: any) {
      console.error('Failed to load providers:', error);
      setProvidersError('Failed to load AI providers. Please configure them in settings.');
    } finally {
      setLoadingProviders(false);
    }
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    
    if (!selectedProvider) {
      alert('Please configure an AI provider in settings before creating a project.');
      return;
    }

    try {
      const projectName = prompt.slice(0, 30) + (prompt.length > 30 ? '...' : '');
      
      // Create the project with provider info
      const response = await createProject(
        projectName, 
        prompt, 
        prompt,
        selectedProvider.id,
        selectedProvider.defaultModel
      );
      
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

  // Get display info for provider
  const getProviderIcon = (type: string) => {
    const icons: Record<string, string> = {
      openai: '🤖',
      anthropic: '✨',
      gemini: '💎',
      mistral: '🌬️',
      groq: '⚡',
      lmstudio: '🖥️',
    };
    return icons[type] || '🤖';
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
              {loadingProviders ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm" style={{ color: emergentColors.mutedForeground }}>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              ) : providersError ? (
                <button
                  onClick={loadProviders}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                  style={{ color: emergentColors.mutedForeground }}
                  title={providersError}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>No Providers</span>
                </button>
              ) : providers.length === 0 ? (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please configure AI providers in Settings → Provider Settings');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                  style={{ color: emergentColors.mutedForeground }}
                >
                  <Settings className="w-4 h-4" />
                  <span>Configure Provider</span>
                </a>
              ) : selectedProvider ? (
                <>
                  <button
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm"
                  >
                    <span className="text-base">{getProviderIcon(selectedProvider.type)}</span>
                    <div className="flex flex-col items-start">
                      <span style={{ color: emergentColors.foreground }} className="font-medium">
                        {selectedProvider.name}
                      </span>
                      <span className="text-xs" style={{ color: emergentColors.mutedForeground }}>
                        {selectedProvider.defaultModel}
                      </span>
                    </div>
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
                        className="absolute left-0 top-full mt-2 w-64 rounded-lg shadow-xl dropdown-enter z-50 py-2"
                        style={{
                          backgroundColor: emergentColors.secondary,
                          border: `1px solid ${emergentColors.border}`,
                        }}
                      >
                        {providers.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => {
                              setSelectedProvider(provider);
                              setShowModelDropdown(false);
                            }}
                            className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors text-sm"
                            style={{
                              backgroundColor: selectedProvider.id === provider.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                            }}
                          >
                            <span className="text-base">{getProviderIcon(provider.type)}</span>
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2">
                                <span style={{ color: emergentColors.foreground }}>{provider.name}</span>
                                {provider.isPrimary && (
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                    backgroundColor: `${emergentColors.accentTeal}20`,
                                    color: emergentColors.accentTeal 
                                  }}>
                                    Primary
                                  </span>
                                )}
                              </div>
                              <span className="text-xs" style={{ color: emergentColors.mutedForeground }}>
                                {provider.defaultModel}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : null}
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
              disabled={!prompt.trim() || !selectedProvider}
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
