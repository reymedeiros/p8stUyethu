'use client';

import React, { useRef, useEffect, useState } from 'react';
import { emergentColors } from '@/lib/design-tokens';
import { MessageItem, Message } from './MessageItem';
import { AgentStatus } from './AgentStatus';

// SVG Icons as inline components
const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M11.1294 4.36049C11.61 3.87984 12.3894 3.87984 12.87 4.36049L18.4084 9.89892C18.889 10.3796 18.889 11.1588 18.4084 11.6394C17.9277 12.1202 17.1485 12.1202 16.6679 11.6394L13.2304 8.20213L13.2304 18.7692C13.2304 19.4489 12.6794 20 11.9996 20C11.32 20 10.7689 19.4489 10.7689 18.7692L10.7689 8.20213L7.3315 11.6394C6.85087 12.1202 6.07161 12.1202 5.59098 11.6394C5.1103 11.1588 5.1103 10.3796 5.59098 9.89892L11.1294 4.36049Z" fill="#0F0F10"/>
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M7.77778 18C6.79594 18 6 17.2041 6 16.2222V7.77778C6 6.79594 6.79594 6 7.77778 6H16.2222C17.2041 6 18 6.79594 18 7.77778V16.2222C18 17.2041 17.2041 18 16.2222 18H7.77778Z" fill="#0F0F10"/>
  </svg>
);

const AttachmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path fillRule="evenodd" clipRule="evenodd" d="M12.1438 6.25391C12.1438 4.18284 10.5448 2.50391 8.5724 2.50391C6.59997 2.50391 5.00097 4.18284 5.00097 6.25391L5.00098 12.2539C5.00098 15.1534 7.23955 17.5039 10.001 17.5039C12.7624 17.5039 15.001 15.1534 15.001 12.2539L15.001 7.75391C15.001 7.3397 14.6812 7.00391 14.2867 7.00391C13.8922 7.00391 13.5724 7.3397 13.5724 7.75391L13.5724 12.2539C13.5724 14.325 11.9734 16.0039 10.001 16.0039C8.02855 16.0039 6.42955 14.325 6.42955 12.2539L6.42955 6.25391C6.42955 5.01127 7.3889 4.00391 8.5724 4.00391C9.7559 4.00391 10.7153 5.01127 10.7153 6.25391L10.7153 12.2539C10.7153 12.6681 10.3955 13.0039 10.001 13.0039C9.60648 13.0039 9.28669 12.6681 9.28669 12.2539L9.28669 7.75391C9.28669 7.3397 8.9669 7.00391 8.5724 7.00391C8.1779 7.00391 7.85812 7.3397 7.85812 7.75391L7.85812 12.2539C7.85812 13.4966 8.81748 14.5039 10.001 14.5039C11.1845 14.5039 12.1438 13.4966 12.1438 12.2539L12.1438 6.25391Z" fill="#E6E6E6"/>
  </svg>
);

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C6.47788 2 2 6.59041 2 12.2531C2 16.7833 4.86531 20.6266 8.83866 21.9824C9.33841 22.0773 9.52193 21.76 9.52193 21.4891C9.52193 21.2447 9.5126 20.4369 9.50836 19.5802C6.72626 20.2004 6.13923 18.3704 6.13923 18.3704C5.68434 17.1853 5.02891 16.8703 5.02891 16.8703C4.12165 16.2339 5.0973 16.2469 5.0973 16.2469C6.1015 16.3193 6.63027 17.3035 6.63027 17.3035C7.52216 18.871 8.96964 18.4178 9.54028 18.1559C9.63 17.4931 9.88921 17.0409 10.1752 16.7849C7.95406 16.5255 5.61909 15.6464 5.61909 11.7177C5.61909 10.5983 6.00974 9.6836 6.64948 8.96559C6.54564 8.7073 6.20338 7.6645 6.74634 6.25219C6.74634 6.25219 7.58608 5.97662 9.49707 7.3032C10.2947 7.07595 11.1502 6.96208 12 6.95823C12.8499 6.96208 13.706 7.07595 14.5052 7.3032C16.4139 5.97662 17.2525 6.25219 17.2525 6.25219C17.7968 7.6645 17.4544 8.7073 17.3505 8.96559C17.9917 9.6836 18.3797 10.5982 18.3797 11.7177C18.3797 15.6557 16.0403 16.5229 13.8135 16.7767C14.1722 17.0948 14.4918 17.7189 14.4918 18.6754C14.4918 20.0472 14.4802 21.1514 14.4802 21.4891C14.4802 21.762 14.6602 22.0817 15.1671 21.981C19.1383 20.6237 22 16.7818 22 12.2531C22 6.59041 17.5227 2 12 2Z" fill="white"/>
  </svg>
);

interface AgentChatPanelProps {
  messages: Message[];
  agentStatus: 'running' | 'waiting' | 'idle';
  onSendMessage: (message: string) => void;
  onStop?: () => void;
}

export function AgentChatPanel({ 
  messages, 
  agentStatus, 
  onSendMessage,
  onStop 
}: AgentChatPanelProps) {
  const [input, setInput] = useState('');
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isUserScrolling]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '72px';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  // Detect user scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    setIsUserScrolling(!isAtBottom);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || agentStatus === 'running') return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isAgentBusy = agentStatus === 'running';
  const isWaiting = agentStatus === 'waiting';

  // Gradient background based on status - exact match from HTML
  const inputGradient = isAgentBusy 
    ? 'linear-gradient(rgba(255,255,255,0.02) 0%, rgba(103,203,101,0.2) 100%)'
    : isWaiting
    ? 'linear-gradient(rgba(255,255,255,0.02) 0%, rgba(95,211,243,0.2) 100%)'
    : 'none';

  return (
    <div className="flex flex-col h-full relative" data-testid="agent-chat-panel">
      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          {messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
          {/* Bottom spacer for input area */}
          <div className="h-[14rem]" />
        </div>
      </div>

      {/* Fixed Bottom Input Area */}
      <div 
        className="absolute z-[40] bottom-0 left-0 right-0 px-0 md:px-4 flex flex-col justify-center bg-transparent"
      >
        {/* Scroll to bottom button */}
        {isUserScrolling && (
          <div className="flex justify-center mb-2">
            <button
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                setIsUserScrolling(false);
              }}
              className="z-[9999] p-2 w-[36px] h-[36px] flex items-center justify-center text-black transition-colors bg-white rounded-full shadow-lg hover:bg-white/80"
              data-testid="scroll-to-bottom-button"
              aria-label="Scroll to bottom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
                <path fillRule="evenodd" clipRule="evenodd" d="M11.1294 4.36049C11.61 3.87984 12.3894 3.87984 12.87 4.36049L18.4084 9.89892C18.889 10.3796 18.889 11.1588 18.4084 11.6394C17.9277 12.1202 17.1485 12.1202 16.6679 11.6394L13.2304 8.20213L13.2304 18.7692C13.2304 19.4489 12.6794 20 11.9996 20C11.32 20 10.7689 19.4489 10.7689 18.7692L10.7689 8.20213L7.3315 11.6394C6.85087 12.1202 6.07161 12.1202 5.59098 11.6394C5.1103 11.1588 5.1103 10.3796 5.59098 9.89892L11.1294 4.36049Z" fill="#0F0F10"/>
              </svg>
            </button>
          </div>
        )}

        {/* Input Container */}
        <div className="relative flex items-center justify-center w-full md:pb-2 pb-0 md:backdrop-blur-md backdrop-blur-md">
          <div 
            className="flex flex-col md:p-1 p-0 max-w-full sm:max-w-4xl md:pt-1 pt-0 w-full md:rounded-[14px] md:backdrop-blur-[40px] shadow-sm md:bg-[#1A1A1C] rounded-t-[14px]"
            style={{ background: inputGradient }}
          >
            {/* Status Bar */}
            <div className="flex items-center justify-between w-full px-2 md:px-3 md:py-2">
              <div className="flex items-center gap-2">
                <AgentStatus status={agentStatus} />
              </div>
            </div>

            {/* Form */}
            <form 
              onSubmit={handleSubmit}
              className="flex flex-1 flex-col md:bg-[#0F0F10] bg-[#1A1A1C] rounded-none rounded-tl-[14px] rounded-tr-[14px] border relative md:rounded-xl border-[#252526]"
            >
              {/* Border Beam Animation for Waiting State */}
              {isWaiting && (
                <div 
                  className="pointer-events-none absolute inset-0 rounded-[inherit]"
                  style={{
                    border: 'calc(var(--border-width) * 1px) solid transparent',
                    maskClip: 'padding-box, border-box',
                    maskComposite: 'intersect',
                    mask: 'linear-gradient(transparent, transparent), linear-gradient(white, white)',
                    WebkitMaskClip: 'padding-box, border-box',
                    WebkitMaskComposite: 'intersect',
                    '--border-width': '1',
                    '--duration': '8',
                    '--delay': '0s',
                    '--size': '100',
                    '--anchor': '90',
                    '--color-from': emergentColors.agentWaitingPrimary,
                    '--color-to': 'transparent',
                  } as React.CSSProperties}
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      content: '""',
                      aspectRatio: '1',
                      width: 'calc(var(--size) * 1px)',
                      animation: 'border-beam calc(var(--duration) * 1s) infinite linear',
                      animationDelay: 'var(--delay)',
                      background: 'linear-gradient(to left, var(--color-from), var(--color-to), transparent)',
                      offsetAnchor: 'calc(var(--anchor) * 1%) 50%',
                      offsetPath: 'rect(0 auto auto 0 round calc(var(--size) * 1px))',
                    } as React.CSSProperties}
                  />
                </div>
              )}

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Agent"
                rows={2}
                className="w-full resize-none md:bg-[#0F0F10] bg-[#1A1A1C] outline-none text-[16px] px-4 py-3 min-h-[64px] overflow-y-auto placeholder:text-white/50 max-h-[200px] rounded-xl"
                style={{ lineHeight: 1.5, color: emergentColors.foreground }}
                disabled={isAgentBusy}
                data-testid="chat-input"
              />

              {/* Bottom Row */}
              <div 
                className="flex items-center justify-between p-2.5 md:bg-[#0F0F10] bg-[#1A1A1C] rounded-xl"
              >
                {/* Left Actions */}
                <div className="relative flex items-center gap-2">
                  {/* Attach Button */}
                  <button
                    type="button"
                    className="p-2 transition-colors duration-200 rounded-[30px] bg-[#FFFFFF14] hover:bg-gray-100/10 group/paperclip"
                    data-testid="chat-input-attach-button"
                  >
                    <span className="size-5 transition-transform duration-200 transform group-hover/paperclip:rotate-45 block">
                      <AttachmentIcon />
                    </span>
                  </button>

                  {/* GitHub Button */}
                  <button
                    type="button"
                    className="p-2 pr-2.5 h-9 transition-colors duration-200 rounded-full flex items-center gap-1 bg-[#FFFFFF14] hover:bg-gray-100/10 opacity-50 cursor-not-allowed"
                    data-testid="chat-input-github-button"
                    disabled
                  >
                    <span className="size-5">
                      <GitHubIcon />
                    </span>
                    <span className="text-sm font-medium text-[#E6E6E6]">Save to GitHub</span>
                  </button>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2">
                  {/* Submit/Stop Button */}
                  {isAgentBusy ? (
                    <button
                      type="button"
                      onClick={onStop}
                      className="w-[48px] px-[12px] flex py-[6px] justify-center items-center gap-[10px] rounded-[38px] bg-[#ECECEC] transition-all duration-300 hover:bg-primary/90 cursor-pointer"
                      data-testid="chat-input-stop"
                    >
                      <StopIcon />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="w-[48px] px-[12px] flex py-[6px] justify-center items-center gap-[10px] rounded-[38px] bg-[#ECECEC] transition-all duration-300 hover:bg-primary/90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      data-testid="chat-input-submit"
                    >
                      <ArrowIcon />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
