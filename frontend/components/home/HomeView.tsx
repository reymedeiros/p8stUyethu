'use client';

import React from 'react';
import { ParticleBackground } from '../ui/ParticleBackground';
import { TopBar } from '../ui/TopBar';
import { HeroSection } from './HeroSection';
import { PromptInput } from './PromptInput';
import { RecentTasks } from './RecentTasks';

export function HomeView() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Animated Background */}
      <ParticleBackground />

      {/* Top Navigation Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="relative z-10 pt-20 pb-16">
        <div className="px-8">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="pt-16 pb-8">
              <HeroSection />
            </div>

            {/* Prompt Input */}
            <div className="pb-8">
              <PromptInput />
            </div>

            {/* Recent Tasks */}
            <div className="pb-16">
              <RecentTasks />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
