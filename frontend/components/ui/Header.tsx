'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Settings, ChevronDown, LogOut, Users, User, HelpCircle, Gift } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { TabBar } from './TabBar';
import { ProviderSettings } from '../ProviderSettings';
import { UserManagement } from '../UserManagement';

export function Header() {
  const { user, logout } = useAuthStore();
  const [showProviders, setShowProviders] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const providersRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setShowAvatarMenu(false);
      }
      if (providersRef.current && !providersRef.current.contains(e.target as Node)) {
        setShowProviders(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitial = () => {
    if (user?.name) return user.name.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <>
      <header className="h-14 border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 z-50">
        {/* Left: Tab Bar */}
        <div className="flex items-center h-full">
          <TabBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Providers Button */}
          <div ref={providersRef} className="relative">
            <button
              onClick={() => setShowProviders(!showProviders)}
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                bg-secondary hover:bg-secondary/80
                text-sm font-medium transition-all duration-200
                border border-border hover:border-muted-foreground/30
              "
            >
              <Settings className="w-4 h-4" />
              <span>Providers</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showProviders ? 'rotate-180' : ''}`} />
            </button>

            {showProviders && (
              <div className="
                absolute right-0 top-full mt-2 w-64
                bg-popover border border-border rounded-lg shadow-xl
                dropdown-enter z-50
              ">
                <div className="p-4">
                  <h3 className="text-sm font-semibold mb-3">LLM Providers</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Configure your AI providers and API keys
                  </p>
                  <button
                    onClick={() => {
                      setShowProviders(false);
                      setShowProviderModal(true);
                    }}
                    className="
                      w-full px-4 py-2 bg-primary text-primary-foreground
                      rounded-lg text-sm font-medium
                      hover:bg-primary/90 transition-colors
                    "
                  >
                    Manage Providers
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gift Icon */}
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Gift className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Avatar Menu */}
          <div ref={avatarRef} className="relative">
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              className="
                w-9 h-9 rounded-full bg-secondary
                flex items-center justify-center
                text-sm font-semibold
                hover:bg-secondary/80 transition-colors
                border border-border
              "
            >
              {getUserInitial()}
            </button>

            {showAvatarMenu && (
              <div className="
                absolute right-0 top-full mt-2 w-56
                bg-popover border border-border rounded-lg shadow-xl
                dropdown-enter z-50 overflow-hidden
              ">
                {/* User Info */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                      {getUserInitial()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button className="
                    w-full px-4 py-2 flex items-center gap-3
                    hover:bg-secondary transition-colors text-left
                  ">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Profile</span>
                  </button>

                  {user?.isAdmin && (
                    <button 
                      onClick={() => {
                        setShowAvatarMenu(false);
                        setShowUserManagement(true);
                      }}
                      className="
                        w-full px-4 py-2 flex items-center gap-3
                        hover:bg-secondary transition-colors text-left
                      "
                    >
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">User Management</span>
                    </button>
                  )}

                  <button className="
                    w-full px-4 py-2 flex items-center gap-3
                    hover:bg-secondary transition-colors text-left
                  ">
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Help & Support</span>
                  </button>

                  <div className="border-t border-border my-2" />

                  <button
                    onClick={logout}
                    className="
                      w-full px-4 py-2 flex items-center gap-3
                      hover:bg-secondary transition-colors text-left
                      text-red-400 hover:text-red-300
                    "
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Provider Settings Modal */}
      {showProviderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-xl font-semibold">Provider Settings</h2>
              <button
                onClick={() => setShowProviderModal(false)}
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
