'use client';

import React from 'react';

export function HeroSection() {
  return (
    <div className="text-center mb-16 animate-fade-in">
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium mb-6 tracking-tight leading-tight">
        <span className="text-foreground">Where ideas become reality</span>
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-normal">
        Build fully functional apps and websites through simple conversations
      </p>
    </div>
  );
}
