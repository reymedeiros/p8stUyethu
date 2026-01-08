'use client';

import React, { useState } from 'react';
import { ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { ProviderSettings } from '../ProviderSettings';
import { UserManagement } from '../UserManagement';

export function TopBar() {
  const { user, logout } = useAuthStore();
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showProviderSettings, setShowProviderSettings] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-md border-b border-border z-50">
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left - Logo/Home */}
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded" />
              <span className="font-semibold text-lg">Home</span>
            </button>
          </div>

          {/* Right - Providers & Avatar */}
          <div className="flex items-center gap-3">
            {/* Providers Button */}
            <button
              onClick={() => setShowProviderSettings(true)}
              className="
                px-4 py-2 rounded-lg
                bg-[hsl(var(--yellow-primary))] text-[hsl(var(--yellow-primary-text))]
                hover:opacity-90 transition-all
                font-medium text-sm
                flex items-center gap-2
              "
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6m8.66-10.5l-3 5.2m-11.32 0l-3-5.2m0 11.32l3-5.2m11.32 0l3 5.2" />
              </svg>
              Providers
            </button>

            {/* Gift Icon */}
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="8" width="18" height="4" rx="1" />
                <path d="M12 8v13" />
                <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
                <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.5 4.5 0 0 1 12 7.5" />
                <path d="M16.5 8a2.5 2.5 0 0 0 0-5A4.5 4.5 0 0 0 12 7.5" />
              </svg>
            </button>

            {/* Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                className="
                  w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500
                  flex items-center justify-center text-white font-semibold text-sm
                  hover:opacity-90 transition-all
                "
              >
                {user?.name?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
              </button>

              {/* Dropdown Menu */}
              {showAvatarMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowAvatarMenu(false)}
                  />
                  <div className="
                    absolute right-0 top-full mt-2 w-56
                    bg-popover border border-border rounded-lg shadow-xl
                    dropdown-enter z-50 py-2 overflow-hidden
                  ">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-medium text-sm">{user?.name || user?.username}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                    </div>

                    {/* Menu Items */}
                    <button
                      onClick={() => {
                        setShowUserManagement(true);
                        setShowAvatarMenu(false);
                      }}
                      className="
                        w-full px-4 py-2.5 flex items-center gap-3 text-left text-sm
                        hover:bg-secondary transition-colors
                      "
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      <span>Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setShowAvatarMenu(false);
                      }}
                      className="
                        w-full px-4 py-2.5 flex items-center gap-3 text-left text-sm
                        hover:bg-secondary transition-colors text-red-400
                      "
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Provider Settings Modal */}
      {showProviderSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-semibold">Provider Settings</h2>
              <button
                onClick={() => setShowProviderSettings(false)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProviderSettings />
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      {showUserManagement && user?.isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg w-full max-w-3xl h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-semibold">User Management</h2>
              <button
                onClick={() => setShowUserManagement(false)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <UserManagement />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
