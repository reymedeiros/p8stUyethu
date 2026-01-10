'use client';

import React, { useState } from 'react';
import { emergentColors } from '@/lib/design-tokens';

interface CodeServerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  password: string;
}

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.6667 5.33333V3.46667C10.6667 2.72 10.0667 2.12 9.32 2.12H3.46667C2.72 2.12 2.12 2.72 2.12 3.46667V9.32C2.12 10.0667 2.72 10.6667 3.46667 10.6667H5.33333M6.68 13.88H12.5333C13.28 13.88 13.88 13.28 13.88 12.5333V6.68C13.88 5.93333 13.28 5.33333 12.5333 5.33333H6.68C5.93333 5.33333 5.33333 5.93333 5.33333 6.68V12.5333C5.33333 13.28 5.93333 13.88 6.68 13.88Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.3334 4L6.00002 11.3333L2.66669 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function CodeServerDialog({ isOpen, onClose, url, password }: CodeServerDialogProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleOpenInBrowser = () => {
    window.open(url, '_blank');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      data-testid="code-server-dialog"
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl"
        style={{
          backgroundColor: emergentColors.secondary,
          border: `1px solid ${emergentColors.border}`,
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: emergentColors.border }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: emergentColors.foreground }}
          >
            VS Code Link
          </h2>
          <p
            className="mt-1 text-sm"
            style={{ color: emergentColors.mutedForeground }}
          >
            Access VS Code in your browser with the following link and password
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {/* URL Section */}
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: emergentColors.subtleText }}
            >
              Access URL
            </label>
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                backgroundColor: emergentColors.inputBackground,
                border: `1px solid ${emergentColors.border}`,
              }}
            >
              <code
                className="flex-1 text-sm font-mono overflow-x-auto"
                style={{ color: emergentColors.foreground }}
              >
                {url}
              </code>
              <button
                onClick={handleCopyUrl}
                className="flex-shrink-0 p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: copiedUrl ? emergentColors.stepSuccess + '20' : emergentColors.hoverBackground,
                  color: copiedUrl ? emergentColors.stepSuccess : emergentColors.foreground,
                }}
                title="Copy URL"
                data-testid="copy-url-button"
              >
                {copiedUrl ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <label
              className="block mb-2 text-sm font-medium"
              style={{ color: emergentColors.subtleText }}
            >
              Password
            </label>
            <div
              className="flex items-center gap-2 p-3 rounded-lg"
              style={{
                backgroundColor: emergentColors.inputBackground,
                border: `1px solid ${emergentColors.border}`,
              }}
            >
              <code
                className="flex-1 text-sm font-mono"
                style={{ color: emergentColors.foreground }}
              >
                {password}
              </code>
              <button
                onClick={handleCopyPassword}
                className="flex-shrink-0 p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: copiedPassword ? emergentColors.stepSuccess + '20' : emergentColors.hoverBackground,
                  color: copiedPassword ? emergentColors.stepSuccess : emergentColors.foreground,
                }}
                title="Copy password"
                data-testid="copy-password-button"
              >
                {copiedPassword ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between border-t"
          style={{ borderColor: emergentColors.border }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              color: emergentColors.foreground,
              backgroundColor: 'transparent',
              border: `1px solid ${emergentColors.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = emergentColors.hoverBackground;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            data-testid="cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={handleOpenInBrowser}
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              color: emergentColors.background,
              backgroundColor: emergentColors.foreground,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            data-testid="open-in-browser-button"
          >
            Open in Browser
          </button>
        </div>
      </div>
    </div>
  );
}
