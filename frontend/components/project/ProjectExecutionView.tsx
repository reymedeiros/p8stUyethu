'use client';

import React, { useState, useCallback } from 'react';
import { emergentColors } from '@/lib/design-tokens';
import { AgentChatPanel } from './AgentChatPanel';
import { PreviewPanel } from './PreviewPanel';
import { CodeServerDialog } from './CodeServerDialog';
import { projectsAPI } from '@/lib/api';
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket';
import { useNetworkUrl } from '@/hooks/useNetworkUrl';
import { useAuthStore } from '@/lib/store/auth';

// SVG Icons - exact match from reference
const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="16" height="16" rx="3" fill="#111111"/>
    <path d="M6.15823 6.50097C6.32933 6.49167 6.4979 6.54973 6.63088 6.66405L6.68362 6.71483L9.2969 9.48046C9.41813 9.6088 9.49025 9.78065 9.49905 9.9619C9.50783 10.1431 9.4528 10.3211 9.34475 10.4619L9.2969 10.5176L6.68362 13.2842C6.55807 13.4175 6.38874 13.495 6.21096 13.5C6.03326 13.5049 5.86049 13.4366 5.72854 13.3105C5.59673 13.1845 5.51548 13.0098 5.50198 12.8223C5.48855 12.6346 5.54388 12.4485 5.65627 12.3027L5.70413 12.2471L7.82717 9.99901L5.70413 7.75194C5.57423 7.61441 5.50101 7.42786 5.501 7.23339C5.501 7.0389 5.57422 6.85238 5.70413 6.71483C5.82533 6.58656 5.98707 6.51033 6.15823 6.50097ZM13.8184 12C13.9934 12 14.1614 12.0695 14.2881 12.1933C14.4149 12.3173 14.4905 12.4864 14.499 12.666C14.5075 12.8456 14.4486 13.0222 14.334 13.1582C14.2195 13.2941 14.058 13.3791 13.8838 13.3965L13.8184 13.4004H10.1817C10.0066 13.4003 9.83769 13.3311 9.71096 13.207C9.58423 13.083 9.50942 12.9129 9.501 12.7334C9.49265 12.554 9.55161 12.3781 9.66604 12.2422C9.78058 12.1062 9.94195 12.0203 10.1162 12.0029L10.1817 12H13.8184Z" fill="white"/>
  </svg>
);

const PreviewIcon = () => (
  <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.9998 15.1667C13.4726 15.1667 14.6665 13.9728 14.6665 12.5C14.6665 11.0272 13.4726 9.83326 11.9998 9.83326C10.5269 9.83326 9.33301 11.0272 9.33301 12.5C9.33301 13.9728 10.5269 15.1667 11.9998 15.1667Z" fill="#FFFFFF"/>
    <path d="M21.9598 12.2733C21.1757 10.245 19.8144 8.49096 18.0442 7.22791C16.274 5.96485 14.1726 5.24818 11.9995 5.16646C9.82646 5.24818 7.72498 5.96485 5.95481 7.22791C4.18463 8.49096 2.82336 10.245 2.03923 12.2733C1.98627 12.4198 1.98627 12.5802 2.03923 12.7267C2.82336 14.755 4.18463 16.509 5.95481 17.7721C7.72498 19.0351 9.82646 19.7518 11.9995 19.8335C14.1726 19.7518 16.274 19.0351 18.0442 17.7721C19.8144 16.509 21.1757 14.755 21.9598 12.7267C22.0128 12.5802 22.0128 12.4198 21.9598 12.2733ZM11.9995 16.8335C11.1424 16.8335 10.3046 16.5793 9.59197 16.1031C8.87934 15.627 8.32391 14.9502 7.99592 14.1583C7.66793 13.3665 7.58211 12.4952 7.74932 11.6546C7.91653 10.814 8.32925 10.0418 8.9353 9.43578C9.54134 8.82974 10.3135 8.41702 11.1541 8.24981C11.9947 8.0826 12.866 8.16842 13.6579 8.49641C14.4497 8.8244 15.1265 9.37983 15.6026 10.0925C16.0788 10.8051 16.333 11.6429 16.333 12.5C16.3312 13.6488 15.8741 14.75 15.0618 15.5623C14.2495 16.3746 13.1483 16.8317 11.9995 16.8335Z" fill="#FFFFFF"/>
  </svg>
);

interface ProjectExecutionViewProps {
  projectId: string;
  projectName: string;
}

export function ProjectExecutionView({ projectId, projectName }: ProjectExecutionViewProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [codeServerUrl, setCodeServerUrl] = useState('');
  const [codeServerPassword, setCodeServerPassword] = useState('');
  const [loadingCodeServer, setLoadingCodeServer] = useState(false);
  const [panelWidth, setPanelWidth] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);

  const { token } = useAuthStore();
  const { getPreviewUrl } = useNetworkUrl();
  const { messages, agentStatus, sendMessage, disconnect } = useProjectWebSocket(
    projectId,
    token || ''
  );

  const previewUrl = getPreviewUrl(projectId);

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  const handleStop = () => {
    // In the future, we can implement stop functionality
    // For now, we just disconnect the WebSocket
    disconnect();
  };

  const handleClosePreview = () => {
    setShowPreview(false);
  };

  const handleToggleCode = async () => {
    if (!showCode && !showCodeDialog) {
      // Fetch code-server credentials
      setLoadingCodeServer(true);
      try {
        const response = await projectsAPI.getCodeServerCredentials(projectId);
        setCodeServerUrl(response.data.url);
        setCodeServerPassword(response.data.password);
        setShowCodeDialog(true);
      } catch (error) {
        console.error('Failed to get code-server credentials:', error);
        alert('Failed to get code-server credentials. Please try again.');
      } finally {
        setLoadingCodeServer(false);
      }
    } else {
      setShowCode(!showCode);
      if (!showCode) {
        setShowPreview(false);
      }
    }
  };

  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
    if (!showPreview) {
      setShowCode(false);
    }
  };

  // Handle resizer drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const container = document.getElementById('split-container');
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setPanelWidth(Math.min(Math.max(newWidth, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const isSplitView = showPreview || showCode;

  return (
    <div className="flex flex-col h-full" data-testid="project-execution-view">
      {/* Code Server Dialog */}
      <CodeServerDialog
        isOpen={showCodeDialog}
        onClose={() => setShowCodeDialog(false)}
        url={codeServerUrl}
        password={codeServerPassword}
      />

      {/* Action Buttons - Top Right */}
      <div 
        className="absolute top-[14px] right-4 z-20 flex items-center gap-2"
        data-testid="project-actions"
      >
        <button
          onClick={handleToggleCode}
          disabled={loadingCodeServer}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${loadingCodeServer ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: showCode ? emergentColors.secondary : 'transparent',
            border: `1px solid ${emergentColors.border}`,
            color: emergentColors.foreground,
          }}
          data-testid="code-button"
        >
          <CodeIcon />
          {loadingCodeServer ? 'Loading...' : 'Code'}
        </button>
        <button
          onClick={handleTogglePreview}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all`}
          style={{
            backgroundColor: showPreview ? emergentColors.secondary : 'transparent',
            border: `1px solid ${emergentColors.border}`,
            color: emergentColors.foreground,
          }}
          data-testid="preview-button"
        >
          <PreviewIcon />
          Preview
        </button>
      </div>

      {/* Main Content Area */}
      <div id="split-container" className="flex flex-1 overflow-hidden">
        {/* Agent Chat Panel */}
        <div 
          className="transition-all duration-300"
          style={{ width: isSplitView ? `${panelWidth}%` : '100%' }}
        >
          <AgentChatPanel
            messages={messages}
            agentStatus={agentStatus}
            onSendMessage={handleSendMessage}
            onStop={handleStop}
          />
        </div>

        {/* Resizable Divider - exact match from HTML */}
        {isSplitView && (
          <div
            onMouseDown={handleMouseDown}
            className={`
              h-full relative w-px items-center justify-center
              after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2
              group transition-colors duration-200 hidden md:flex
              ${isDragging ? 'bg-[#00CCAF]/60' : 'bg-[#242424]'}
              hover:bg-[#00CCAF]/60
            `}
            style={{ cursor: 'col-resize', touchAction: 'none', userSelect: 'none' }}
            data-resize-handle-state={isDragging ? 'drag' : 'inactive'}
          >
            <div 
              className={`
                z-10 min-w-2 min-h-6 border rounded-md transition-all duration-200
                group-hover:bg-[#00CCAF] group-hover:border-[#00CCAF]
                ${isDragging ? 'bg-[#00CCAF] border-[#00CCAF]' : 'bg-[#242424] border-[#242424]'}
              `}
            />
          </div>
        )}

        {/* Preview Panel - Right side */}
        {showPreview && (
          <div 
            className="h-full overflow-hidden"
            style={{ width: `${100 - panelWidth}%` }}
          >
            <PreviewPanel
              previewUrl={previewUrl}
              onClose={handleClosePreview}
            />
          </div>
        )}

        {/* Code Panel - Right side */}
        {showCode && !showPreview && (
          <div 
            className="h-full overflow-hidden"
            style={{ width: `${100 - panelWidth}%` }}
          >
            <div className="w-full h-full bg-[#111112] max-md:absolute max-md:inset-0 relative block">
              <div className="flex flex-col h-full">
                <div className="pointer-events-auto">
                  <div className="p-4 px-0 md:p-4 bg-[#111112] z-[2] flex items-center justify-between border-b border-[#242424]/60">
                    <div className="text-[#939399] font-['Brockmann'] text-[15px] md:text-[18px] font-medium leading-[24px]">
                      Code
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowCode(false)}
                        className="w-8 h-8 bg-[#FFFFFF0A] hover:bg-[#FFFFFF14] flex items-center justify-center rounded-[6px]"
                        title="Close"
                      >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M4.26008 4.26399C4.61208 3.912 5.18276 3.912 5.53475 4.26399L9.99609 8.72533L14.4574 4.26399C14.8094 3.912 15.3801 3.912 15.7321 4.26399C16.0841 4.61598 16.0841 5.18667 15.7321 5.53865L11.2707 9.99998L15.7321 14.4613C16.0841 14.8133 16.0841 15.384 15.7321 15.736C15.3801 16.088 14.8094 16.088 14.4574 15.736L9.99609 11.2746L5.53475 15.736C5.18276 16.088 4.61208 16.088 4.26008 15.736C3.9081 15.384 3.9081 14.8133 4.26008 14.4613L8.72143 9.99998L4.26008 5.53865C3.9081 5.18667 3.9081 4.61598 4.26008 4.26399Z" fill="#737380"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="relative flex-1 p-4 overflow-hidden pointer-events-auto">
                  <p className="text-sm" style={{ color: emergentColors.mutedForeground }}>
                    Code editor will appear here
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
